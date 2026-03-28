#!/usr/bin/env node
/**
 * nfc-pcsc@0.8.1 Reader.js 패치
 *
 * 문제1: reader.state를 업데이트하지 않아 두 번째 이후 카드 삽입 이벤트 감지 실패
 * 문제2: connect() 실패 시 card 이벤트가 발생하지 않음
 * 수정: status 이벤트마다 reader.state를 갱신하고, connect() 없이 card 이벤트 emit
 */
const fs = require('fs');
const path = require('path');

const candidates = [
  path.resolve(__dirname, '../node_modules/nfc-pcsc/dist/Reader.js'),
  path.resolve(__dirname, '../../../node_modules/.pnpm/nfc-pcsc@0.8.1/node_modules/nfc-pcsc/dist/Reader.js'),
];

let filePath = null;
for (const p of candidates) {
  if (fs.existsSync(p)) { filePath = p; break; }
}

if (!filePath) {
  console.log('[nfc-pcsc patch] Reader.js not found, skipping');
  process.exit(0);
}

let content = fs.readFileSync(filePath, 'utf8');
let patched = false;

// Patch 1: reader.state 갱신
const stateOld = 'const changes = this.reader.state ^ status.state;';
const stateNew = 'const changes = this.reader.state ^ status.state; this.reader.state = status.state;';
if (content.includes(stateOld) && !content.includes(stateNew)) {
  content = content.replace(stateOld, stateNew);
  patched = true;
  console.log('[nfc-pcsc patch] applied: reader.state update');
}

// Patch 2: connect() 제거, card 이벤트 직접 emit
const connectOld = `          try {
            await this.connect();

            if (!this.autoProcessing) {
              this.emit('card', { ...this.card
              });
              return;
            }

            this.handleTag();
          } catch (err) {
            this.emit(err);
          }`;
const connectNew = `          try {
            // patched: skip connect, let consumer handle raw connect
            this.emit('card', { ...this.card });
          } catch (err) {
            this.emit('error', err);
          }`;

if (content.includes(connectOld)) {
  content = content.replace(connectOld, connectNew);
  patched = true;
  console.log('[nfc-pcsc patch] applied: skip connect, emit card directly');
}

if (patched) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('[nfc-pcsc patch] saved:', filePath);
} else {
  console.log('[nfc-pcsc patch] already patched or pattern changed, skipping');
}
