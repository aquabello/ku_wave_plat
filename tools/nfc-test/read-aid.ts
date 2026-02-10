/**
 * NFC AID Reader Test Script
 * ACR122U USB NFC Reader를 사용하여 카드의 AID를 읽는 테스트 스크립트
 *
 * 설치: npm install nfc-pcsc
 * 실행: npx ts-node tools/nfc-test/read-aid.ts
 */

import { NFC } from 'nfc-pcsc';

const nfc = new NFC();

console.log('===========================================');
console.log(' NFC AID Reader Test (ACR122U)');
console.log(' 카드를 리더기에 올려주세요...');
console.log('===========================================\n');

nfc.on('reader', (reader: any) => {
  console.log(`[리더기 감지] ${reader.name}`);

  reader.on('card', async (card: any) => {
    console.log('\n--- 카드 감지 ---');
    console.log(`UID: ${card.uid}`);
    console.log(`ATR: ${card.atr.toString('hex').toUpperCase()}`);
    console.log(`Type: ${card.type}`);

    // 공통 AID 목록 테스트 (SELECT 명령어로 AID 존재 여부 확인)
    const testAids = [
      { name: 'NDEF', aid: 'D2760000850101' },
      { name: 'T-Money', aid: 'D4100000030001' },
      { name: 'Mifare DESFire', aid: 'A00000000401' },
      { name: 'Korean ID', aid: 'D410000001' },
      { name: 'University Card (예시)', aid: 'F04B4F4E4B554B' }, // "KONKUK" hex
    ];

    console.log('\n--- AID 스캔 ---');

    for (const { name, aid } of testAids) {
      try {
        // ISO 7816-4 SELECT 명령 (APDU)
        // CLA=00, INS=A4, P1=04 (Select by AID), P2=00
        const aidBuffer = Buffer.from(aid, 'hex');
        const selectApdu = Buffer.from([
          0x00, 0xa4, 0x04, 0x00,
          aidBuffer.length,
          ...aidBuffer,
          0x00 // Le: expect response
        ]);

        const response = await reader.transmit(selectApdu, 256);
        const sw = response.slice(-2);
        const sw1 = sw[0];
        const sw2 = sw[1];

        if (sw1 === 0x90 && sw2 === 0x00) {
          const data = response.slice(0, -2);
          console.log(`  ✅ ${name} (${aid}): 존재함`);
          if (data.length > 0) {
            console.log(`     응답 데이터: ${data.toString('hex').toUpperCase()}`);
          }
        } else {
          console.log(`  ❌ ${name} (${aid}): 없음 (SW=${sw.toString('hex').toUpperCase()})`);
        }
      } catch (err: any) {
        console.log(`  ⚠️  ${name} (${aid}): 오류 - ${err.message}`);
      }
    }

    // 카드의 전체 AID 목록 조회 시도 (GET DATA)
    console.log('\n--- 카드 정보 ---');
    try {
      // GET UID 명령 (ACR122U 전용)
      const getUid = Buffer.from([0xFF, 0xCA, 0x00, 0x00, 0x00]);
      const uidResponse = await reader.transmit(getUid, 256);
      const uidSw = uidResponse.slice(-2);
      if (uidSw[0] === 0x90) {
        const uid = uidResponse.slice(0, -2).toString('hex').toUpperCase();
        console.log(`  카드 UID: ${uid}`);
        console.log(`  UID 길이: ${uid.length / 2} bytes`);
      }
    } catch (err: any) {
      console.log(`  UID 조회 실패: ${err.message}`);
    }

    // ATS (Answer To Select) 조회 - Type A 카드
    try {
      const getAts = Buffer.from([0xFF, 0xCA, 0x01, 0x00, 0x00]);
      const atsResponse = await reader.transmit(getAts, 256);
      const atsSw = atsResponse.slice(-2);
      if (atsSw[0] === 0x90 && atsResponse.length > 2) {
        console.log(`  ATS: ${atsResponse.slice(0, -2).toString('hex').toUpperCase()}`);
      }
    } catch (err: any) {
      // ATS not supported for all card types
    }

    console.log('\n카드를 제거하고 다른 카드를 올려주세요...');
  });

  reader.on('card.off', (card: any) => {
    console.log(`[카드 제거] UID: ${card.uid}`);
  });

  reader.on('error', (err: any) => {
    console.error(`[리더기 오류] ${err.message}`);
  });
});

nfc.on('error', (err: any) => {
  console.error(`[NFC 오류] ${err.message}`);
  console.log('\n확인사항:');
  console.log('1. ACR122U가 USB에 연결되어 있는지 확인');
  console.log('2. 다른 프로그램이 리더기를 점유하고 있지 않은지 확인');
  console.log('3. macOS: brew install pcsc-lite 필요할 수 있음');
});

// 종료 처리
process.on('SIGINT', () => {
  console.log('\n프로그램을 종료합니다.');
  process.exit(0);
});
