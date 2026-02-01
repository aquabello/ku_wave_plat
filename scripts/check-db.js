#!/usr/bin/env node

async function main() {
  console.log('📌 외부 개발 DB를 사용합니다.\n');
  console.log('⚠️  .env 파일의 DB 연결 정보를 확인하세요:\n');
  console.log('  - DB_HOST');
  console.log('  - DB_PORT');
  console.log('  - DB_USERNAME');
  console.log('  - DB_PASSWORD');
  console.log('  - DB_DATABASE\n');
  console.log('🚀 개발 서버를 시작합니다...\n');
}

main().catch((error) => {
  console.error('오류 발생:', error.message);
  process.exit(1);
});
