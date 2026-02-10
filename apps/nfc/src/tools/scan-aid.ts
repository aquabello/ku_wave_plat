#!/usr/bin/env ts-node
/**
 * NFC AID Scanner Tool
 * ACR122U로 폰/카드의 AID를 스캔하여 식별하는 유틸리티
 *
 * Usage:
 *   pnpm --filter @ku/nfc scan-aid
 *   pnpm --filter @ku/nfc scan-aid -- --quick
 *   pnpm --filter @ku/nfc scan-aid -- --aid A0000000031010
 */

import { NFC } from 'nfc-pcsc';

// ========================================
// AID Database
// ========================================

interface AidEntry {
  name: string;
  aid: string; // hex string without spaces
}

interface AidCategory {
  name: string;
  aids: AidEntry[];
}

const AID_DATABASE: AidCategory[] = [
  {
    name: 'System / Environment',
    aids: [
      { name: 'PPSE (Contactless Payment)', aid: '325041592E5359532E4444463031' }, // 2PAY.SYS.DDF01
      { name: 'PSE (Contact Payment)', aid: '315041592E5359532E4444463031' },      // 1PAY.SYS.DDF01
      { name: 'NDEF Type 4 Tag', aid: 'D2760000850101' },
      { name: 'NDEF Tag Application', aid: 'D2760000850100' },
    ],
  },
  {
    name: 'Payment Apps',
    aids: [
      { name: 'Visa Credit/Debit', aid: 'A0000000031010' },
      { name: 'Visa Electron', aid: 'A0000000032010' },
      { name: 'V Pay', aid: 'A0000000032020' },
      { name: 'Mastercard Credit/Debit', aid: 'A0000000041010' },
      { name: 'Mastercard Maestro', aid: 'A0000000043060' },
      { name: 'AMEX', aid: 'A000000025010101' },
      { name: 'JCB', aid: 'A0000000651010' },
      { name: 'UnionPay Debit', aid: 'A000000333010101' },
      { name: 'UnionPay Credit', aid: 'A000000333010102' },
      { name: 'Discover/Diners', aid: 'A0000001523010' },
    ],
  },
  {
    name: 'Korean Transport / Payment',
    aids: [
      { name: 'T-Money', aid: 'D4100000030001' },
      { name: 'T-Money (Alt)', aid: 'D4100000030002' },
      { name: 'Cashbee', aid: 'D4100000040001' },
      { name: 'Railplus', aid: 'D4100000060001' },
      { name: 'Korea Smart Card', aid: 'D410000001' },
      { name: 'Korean National ID', aid: 'D4100000010001' },
      { name: 'Korean ePassport', aid: 'A0000002471001' },
    ],
  },
  {
    name: 'University / Education',
    aids: [
      { name: 'Mifare DESFire Default', aid: 'A0000000040100' },
      { name: 'Mifare DESFire (Alt)', aid: 'D2760000850100' },
      { name: 'MIFARE Plus', aid: 'A00000039656434C' },
      { name: 'HID iCLASS', aid: 'A0000001160000' },
      { name: 'KONKUK (HEX)', aid: 'F04B4F4E4B554B' },        // "KONKUK"
      { name: 'KUWAVE (HEX)', aid: 'F04B55574156045' },        // "KUWAVE"
    ],
  },
  {
    name: 'HCE Common',
    aids: [
      { name: 'Android HCE Sample', aid: 'F0010203040506' },
      { name: 'Android Beam/NDEF', aid: 'D2760000850101' },
      { name: 'HCE Loyalty Sample', aid: 'F041434D450101' },
      { name: 'Access Control', aid: 'F0414343455353' },       // "ACCESS"
      { name: 'Smart Room', aid: 'F0524F4F4D3031' },           // "ROOM01"
      { name: 'Smart Classroom', aid: 'F0434C41535330' },      // "CLASS0"
    ],
  },
  {
    name: 'HCE Prefix Scan (F0 00~0F)',
    aids: Array.from({ length: 16 }, (_, i) => ({
      name: `HCE F0-${i.toString(16).toUpperCase().padStart(2, '0')}`,
      aid: `F0${i.toString(16).toUpperCase().padStart(2, '0')}`,
    })),
  },
];

// Quick scan categories
const QUICK_CATEGORIES = ['System / Environment', 'Korean Transport / Payment', 'HCE Common'];

// ========================================
// CLI Args Parser
// ========================================

interface CliArgs {
  quick: boolean;
  aid: string | null;
  loop: boolean;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const result: CliArgs = { quick: false, aid: null, loop: false };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--quick':
        result.quick = true;
        break;
      case '--aid':
        result.aid = args[++i] || null;
        break;
      case '--loop':
        result.loop = true;
        break;
    }
  }

  return result;
}

// ========================================
// APDU Helpers
// ========================================

function hexToBuffer(hex: string): Buffer {
  const clean = hex.replace(/[\s:-]/g, '');
  return Buffer.from(clean, 'hex');
}

function buildSelectApdu(aidHex: string): Buffer {
  const aidBuf = hexToBuffer(aidHex);
  return Buffer.from([
    0x00, // CLA
    0xA4, // INS: SELECT
    0x04, // P1: Select by AID
    0x00, // P2: First or only occurrence
    aidBuf.length, // Lc
    ...aidBuf,
    0x00, // Le: expect response
  ]);
}

// ========================================
// Scanner Logic
// ========================================

interface ScanResult {
  name: string;
  aid: string;
  data: string;
}

async function selectAid(
  reader: any,
  aidHex: string,
): Promise<{ success: boolean; data: string; sw: string }> {
  try {
    const apdu = buildSelectApdu(aidHex);
    const response: Buffer = await reader.transmit(apdu, 256);
    const sw1 = response[response.length - 2];
    const sw2 = response[response.length - 1];
    const swHex = `${sw1.toString(16).toUpperCase().padStart(2, '0')}${sw2.toString(16).toUpperCase().padStart(2, '0')}`;

    if (sw1 === 0x90 && sw2 === 0x00) {
      const data = response.slice(0, -2);
      return { success: true, data: data.length > 0 ? data.toString('hex').toUpperCase() : '', sw: swHex };
    }

    if (sw1 === 0x61) {
      // More data available - send GET RESPONSE
      const getResp = Buffer.from([0x00, 0xC0, 0x00, 0x00, sw2]);
      try {
        const resp2: Buffer = await reader.transmit(getResp, 256);
        const data = response.slice(0, -2);
        const data2 = resp2.slice(0, -2);
        const combined = Buffer.concat([data, data2]).toString('hex').toUpperCase();
        return { success: true, data: combined, sw: swHex };
      } catch {
        const data = response.slice(0, -2);
        return { success: true, data: data.toString('hex').toUpperCase(), sw: swHex };
      }
    }

    return { success: false, data: '', sw: swHex };
  } catch (err: any) {
    return { success: false, data: '', sw: err.message };
  }
}

function detectDeviceType(atr: Buffer): string {
  const atrHex = atr.toString('hex').toUpperCase();
  const phonePatterns = ['3B8880', '3B8980', '3B8A80', '3B8F80', '3B80800101'];
  for (const pattern of phonePatterns) {
    if (atrHex.startsWith(pattern)) return 'PHONE (HCE)';
  }
  return 'CARD';
}

async function scanCard(reader: any, card: any, args: CliArgs): Promise<void> {
  const uid = card.uid || 'N/A';
  const atr: Buffer = card.atr || Buffer.alloc(0);
  const atrHex = atr.toString('hex').toUpperCase();
  const deviceType = detectDeviceType(atr);

  console.log('\n' + '='.repeat(55));
  console.log(' NFC AID Scan Result');
  console.log('='.repeat(55));
  console.log(`  UID:  ${uid}`);
  console.log(`  ATR:  ${atrHex}`);
  console.log(`  Type: ${deviceType}`);

  const allFound: ScanResult[] = [];

  // Single AID test mode
  if (args.aid) {
    console.log(`\n  [Single AID Test]`);
    const { success, data, sw } = await selectAid(reader, args.aid);
    if (success) {
      console.log(`    OK  AID ${args.aid} is PRESENT!`);
      if (data) console.log(`        Response: ${data}`);
      allFound.push({ name: 'Custom', aid: args.aid, data });
    } else {
      console.log(`    --  AID ${args.aid} not found (SW=${sw})`);
    }
  } else {
    // Category scan
    const categories = args.quick
      ? AID_DATABASE.filter((c) => QUICK_CATEGORIES.includes(c.name))
      : AID_DATABASE;

    for (const category of categories) {
      console.log(`\n  [${category.name}]`);

      for (const { name, aid } of category.aids) {
        const { success, data, sw } = await selectAid(reader, aid);

        if (success) {
          console.log(`    OK  ${name}`);
          console.log(`        AID: ${aid}`);
          if (data) console.log(`        Data: ${data}`);
          allFound.push({ name, aid, data });
        } else {
          // Only show unexpected responses (skip common "not found" codes)
          if (!['6A82', '6A86', '6999', '6E00', '6D00', '6A81'].includes(sw)) {
            console.log(`    --  ${name} (SW=${sw})`);
          }
        }
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(55));
  if (allFound.length > 0) {
    console.log(` FOUND: ${allFound.length} AID(s)`);
    console.log('='.repeat(55));
    for (const item of allFound) {
      console.log(`  ${item.name}`);
      console.log(`    AID:  ${item.aid}`);
      if (item.data) console.log(`    Data: ${item.data}`);
    }

    console.log('\n  --- DB 저장용 (tb_nfc_card.card_aid) ---');
    for (const item of allFound) {
      console.log(`  '${item.aid}'`);
    }

    console.log('\n  --- DB 저장용 (tb_nfc_card.card_identifier) ---');
    console.log(`  '${uid}'`);
  } else {
    console.log(' FOUND: No known AIDs detected');
    console.log('='.repeat(55));
    console.log('\n  Possible reasons:');
    console.log('  1. Phone NFC app is not open/foreground');
    console.log('  2. Phone screen is locked (HCE needs unlocked screen)');
    console.log('  3. The app uses a proprietary AID not in our database');
    console.log('  4. Try: pnpm --filter @ku/nfc scan-aid -- --aid YOUR_AID_HEX');
    console.log('\n  Tips:');
    console.log('  - Android: Settings > NFC > ON, then open the target app');
    console.log('  - iPhone: NFC apps auto-activate when near reader');
    console.log('  - Keep device on reader until scan completes (~3 seconds)');
  }
  console.log('');
}

// ========================================
// Main
// ========================================

function main(): void {
  const args = parseArgs();

  console.log('===========================================');
  console.log(' KU NFC AID Scanner (ACR122U)');
  if (args.quick) console.log(' Mode: Quick Scan');
  else if (args.aid) console.log(` Mode: Single AID Test (${args.aid})`);
  else console.log(' Mode: Full Scan');
  console.log(' Hold your phone/card near the reader...');
  console.log('===========================================\n');

  const nfc = new NFC();
  let lastUid: string | null = null;

  nfc.on('reader', (reader: any) => {
    console.log(`[Reader connected] ${reader.name}`);
    console.log('Waiting for phone/card... (Ctrl+C to quit)\n');

    reader.on('card', async (card: any) => {
      const uid = card.uid || 'unknown';

      // Only scan new cards (skip duplicate reads)
      if (uid === lastUid) return;
      lastUid = uid;

      await scanCard(reader, card, args);

      if (args.loop) {
        console.log('Remove device and tap again for next scan...');
      } else {
        console.log('Remove device and tap again, or Ctrl+C to quit.');
      }
    });

    reader.on('card.off', () => {
      lastUid = null;
    });

    reader.on('error', (err: any) => {
      console.error(`[Reader error] ${err.message}`);
    });

    reader.on('end', () => {
      console.log('[Reader disconnected]');
    });
  });

  nfc.on('error', (err: any) => {
    console.error(`[NFC Error] ${err.message}`);
    console.log('\nChecklist:');
    console.log('  1. Is ACR122U plugged in via USB?');
    console.log('  2. macOS: brew install pcsc-lite');
    console.log('  3. Linux: sudo apt install pcscd pcsc-tools libpcsclite-dev');
    console.log('  4. Windows: Install ACR122U driver from ACS website');
    console.log('  5. No other app using the reader (close Chrome NFC, etc.)');
  });

  process.on('SIGINT', () => {
    console.log('\n\nScanner stopped.');
    process.exit(0);
  });
}

main();
