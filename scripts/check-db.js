#!/usr/bin/env node

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function checkMariaDB() {
  try {
    const { stdout } = await execPromise('docker ps --filter name=ku-mariadb --format "{{.Status}}"');
    return stdout.includes('Up');
  } catch {
    return false;
  }
}

async function main() {
  console.log('🔍 데이터베이스 연결 확인 중...\n');

  const mariadbRunning = await checkMariaDB();

  if (!mariadbRunning) {
    console.log('⚠️  데이터베이스가 실행 중이 아닙니다.\n');
    console.log('  ❌ MariaDB 컨테이너가 실행되지 않음');

    console.log('\n다음 명령어로 데이터베이스를 시작하세요:');
    console.log('  pnpm db:start\n');

    process.exit(1);
  }

  console.log('✅ MariaDB 실행 중');
  console.log('\n🚀 개발 서버를 시작합니다...\n');
}

main().catch((error) => {
  console.error('오류 발생:', error.message);
  process.exit(1);
});
