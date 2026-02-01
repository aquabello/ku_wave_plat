#!/usr/bin/env node

const { spawn } = require('child_process');
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

async function startDatabases() {
  console.log('🚀 데이터베이스 컨테이너를 시작합니다...\n');

  return new Promise((resolve, reject) => {
    const docker = spawn('docker', ['compose', 'up', '-d', 'mariadb'], {
      stdio: 'inherit',
    });

    docker.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Docker 시작 실패 (exit code: ${code})`));
      } else {
        console.log('\n✅ 데이터베이스가 시작되었습니다.\n');
        resolve();
      }
    });
  });
}

async function waitForHealthy(timeout = 30000) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const mariadbOk = await checkMariaDB();

    if (mariadbOk) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return false;
}

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
  console.log('🎯 KU-AI-CTL 개발 환경을 시작합니다...\n');

  const mariadbRunning = await checkMariaDB();

  if (!mariadbRunning) {
    await startDatabases();

    console.log('⏳ 데이터베이스가 준비될 때까지 대기 중...\n');

    const healthy = await waitForHealthy();

    if (!healthy) {
      console.error('❌ 데이터베이스 시작 타임아웃\n');
      console.log('다음 명령어로 로그를 확인하세요:');
      console.log('  docker compose logs mariadb\n');
      process.exit(1);
    }
  } else {
    console.log('✅ 데이터베이스가 이미 실행 중입니다.\n');
  }

  await startDevServers();
}

main().catch((error) => {
  console.error('❌ 오류 발생:', error.message);
  process.exit(1);
});
