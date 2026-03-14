import { loadConfig } from './config';
import { NfcReader } from './reader';
import { ApiClient } from './api-client';
import { BuzzerController } from './buzzer';
import { NfcWsServer } from './ws-server';
import { logger } from './logger';

process.on('uncaughtException', (err) => {
  logger.error(`[UNCAUGHT] ${err.message}`);
});

process.on('unhandledRejection', (reason) => {
  logger.error(`[UNHANDLED] ${reason}`);
});

async function main() {
  logger.info('===========================================');
  logger.info(' KU NFC Agent Starting...');
  logger.info('===========================================');

  const config = loadConfig();
  logger.setLevel(config.logLevel as any);
  logger.info(`API URL: ${config.apiUrl}`);
  logger.info(`Buzzer: ${config.buzzerEnabled ? 'ON' : 'OFF'}`);
  logger.info(`WebSocket: ${config.wsEnabled ? `ON (port: ${config.wsPort})` : 'OFF'}`);

  const apiClient = new ApiClient(config);
  const buzzer = new BuzzerController(config);
  const wsServer = new NfcWsServer(config);
  const reader = new NfcReader(config, apiClient, buzzer, wsServer);

  const healthy = await apiClient.healthCheck();

  if (healthy) {
    logger.info('[시작 모드] 태그 모드 (API 연결 성공)');
    reader.setMode('tag');
  } else {
    logger.warn('[시작 모드] AID 테스트 모드 (API 연결 실패)');
    reader.setMode('aid-test');
  }

  reader.start();
  wsServer.start();

  setInterval(async () => {
    if (reader.getMode() !== 'aid-test') return;
    const ok = await apiClient.healthCheck();
    if (ok) {
      logger.info('[헬스체크] API 연결 복구 - 태그 모드로 전환');
      reader.setMode('tag');
    }
  }, 30000);

  process.on('SIGINT', () => {
    logger.info('\nNFC Agent 종료 중...');
    reader.stop();
    wsServer.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    reader.stop();
    wsServer.stop();
    process.exit(0);
  });
}

main().catch((err) => {
  logger.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
