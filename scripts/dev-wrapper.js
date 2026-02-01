#!/usr/bin/env node

const { spawn } = require('child_process');

async function startDevServers() {
  console.log('🔥 개발 서버를 시작합니다...\n');

  const turbo = spawn('turbo', ['run', 'dev'], {
    stdio: 'inherit',
  });

  turbo.on('close', (code) => {
    process.exit(code);
  });

  process.on('SIGINT', () => {
    turbo.kill('SIGINT');
  });

  process.on('SIGTERM', () => {
    turbo.kill('SIGTERM');
  });
}

async function main() {
  console.log('🎯 KU-WAVE-PLAT 개발 환경을 시작합니다...\n');
  console.log('📌 외부 개발 DB를 사용합니다. .env 파일의 DB 설정을 확인하세요.\n');

  await startDevServers();
}

main().catch((error) => {
  console.error('❌ 오류 발생:', error.message);
  process.exit(1);
});
