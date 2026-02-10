# NFC AID Test Tools

ACR122U USB NFC 리더기를 사용하여 NFC 카드의 AID(Application Identifier)를 확인하는 테스트 도구입니다.

## 사전 준비

### 하드웨어
- ACR122U USB NFC Reader

### macOS
```bash
brew install pcsc-lite
```

### Linux
```bash
sudo apt-get install pcscd pcsc-tools libpcsclite-dev
sudo systemctl start pcscd
```

### Windows
- ACR122U 드라이버 설치 (ACS 공식 사이트)

## Node.js 버전 (read-aid.ts)

```bash
# 설치
npm install nfc-pcsc

# 실행
npx ts-node tools/nfc-test/read-aid.ts
```

## Python 버전 (read-aid.py)

```bash
# 설치
pip install pyscard

# 실행
python tools/nfc-test/read-aid.py
```

## 사용 방법

1. ACR122U를 USB에 연결
2. 스크립트 실행
3. NFC 카드를 리더기에 올림
4. UID, ATR, AID 정보 확인

## 출력 예시

```
--- 카드 감지 ---
  카드 UID: 04A1B2C3D4E5F6
  ATR: 3B 8F 80 01 80 4F 0C A0 00 00 03 06

--- AID 스캔 ---
  ✅ NDEF (D2760000850101): 존재함
  ❌ T-Money (D410000003 0001): 없음 (SW=6A82)
  ✅ University (F04B4F4E4B554B): 존재함
     응답: 4B 4F 4E 4B 55 4B

  📋 발견된 AID: 2개
```

## AID 확인 후

발견된 AID 정보를 `tb_nfc_tag` 테이블의 `tag_aid` 컬럼에 저장합니다.
AID 길이는 5~16 bytes (10~32 hex chars)입니다.

## 커스텀 AID 테스트

스크립트의 `testAids` 배열에 확인하려는 AID를 추가하세요:

```typescript
// read-aid.ts
const testAids = [
  { name: '학교 카드', aid: 'YOUR_AID_HEX_HERE' },
];
```

```python
# read-aid.py
test_aids = [
    ("학교 카드", "YOUR AID HEX HERE"),
]
```
