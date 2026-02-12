/**
 * KU NFC Agent - Smart Classroom NFC Reader
 * ACR122U USB NFC Reader를 통해 태깅을 감지하고 BE API를 호출합니다.
 *
 * 실행: pnpm --filter @ku/nfc dev
 */

import { loadConfig } from './config';
import { NfcReader } from './reader';
import { ApiClient } from './api-client';
import { OfflineQueue } from './queue';
import { BuzzerController } from './buzzer';
import { NfcWsServer } from './ws-server';
import { logger } from './logger';

async function main() {
  logger.info('===========================================');
  logger.info(' KU NFC Agent Starting...');
  logger.info('===========================================');

  // 1. 설정 로드
  const config = loadConfig();
  logger.setLevel(config.logLevel as any);
  logger.info(`API URL: ${config.apiUrl}`);
  logger.info(`Buzzer: ${config.buzzerEnabled ? 'ON' : 'OFF'}`);
  logger.info(`WebSocket: ${config.wsEnabled ? `ON (port: ${config.wsPort})` : 'OFF'}`);

  // 2. 모듈 초기화
  const apiClient = new ApiClient(config);
  const queue = new OfflineQueue(config);
  const buzzer = new BuzzerController(config);
  const wsServer = new NfcWsServer(config);
  const reader = new NfcReader(config, apiClient, queue, buzzer, wsServer);

  // 3. 에이전트 시작
  reader.start();
  wsServer.start();

  // 4. 종료 처리
  process.on('SIGINT', () => {
    logger.info('\nNFC Agent 종료 중...');
    reader.stop();
    wsServer.stop();
    queue.flush();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    reader.stop();
    wsServer.stop();
    queue.flush();
    process.exit(0);
  });
}

main().catch((err) => {
  logger.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
