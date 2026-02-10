"""
Phone NFC App AID Scanner (ACR122U)
스마트폰의 NFC 앱(HCE) AID를 ACR122U 리더기로 탐지하는 스크립트

사용법:
  python tools/nfc-test/scan-phone-aid.py                    # 전체 스캔
  python tools/nfc-test/scan-phone-aid.py --aid A00000000101  # 특정 AID 테스트
  python tools/nfc-test/scan-phone-aid.py --quick             # 빠른 스캔 (주요 AID만)

설치: pip install pyscard
"""

from smartcard.System import readers
from smartcard.util import toHexString, toBytes
from smartcard.Exceptions import NoCardException, CardConnectionException
import time
import sys
import argparse

# ========================================
# 포괄적 AID 데이터베이스
# ========================================

# 1. 시스템/환경 AID
SYSTEM_AIDS = [
    ("PPSE (Payment)", "32 50 41 59 2E 53 59 53 2E 44 44 46 30 31"),  # 2PAY.SYS.DDF01
    ("PSE (Payment)",  "31 50 41 59 2E 53 59 53 2E 44 44 46 30 31"),  # 1PAY.SYS.DDF01
    ("NDEF Type 4",    "D2 76 00 00 85 01 01"),
    ("NDEF Tag App",   "D2 76 00 00 85 01 00"),
]

# 2. 결제 앱 AID
PAYMENT_AIDS = [
    ("Visa Credit/Debit",    "A0 00 00 00 03 10 10"),
    ("Visa Electron",        "A0 00 00 00 03 20 10"),
    ("V Pay",                "A0 00 00 00 03 20 20"),
    ("Mastercard Credit",    "A0 00 00 00 04 10 10"),
    ("Mastercard Maestro",   "A0 00 00 00 04 30 60"),
    ("AMEX",                 "A0 00 00 00 25 01 01 01"),
    ("JCB",                  "A0 00 00 00 65 10 10 01"),
    ("UnionPay Debit",       "A0 00 00 03 33 01 01 01"),
    ("UnionPay Credit",      "A0 00 00 03 33 01 01 02"),
    ("Discover",             "A0 00 00 01 52 30 10"),
    ("Samsung Pay Visa",     "A0 00 00 00 03 10 10 02"),
    ("Samsung Pay MC",       "A0 00 00 00 04 10 10 02"),
    ("Google Pay",           "A0 00 00 00 03 10 10"),
    ("Apple Pay",            "A0 00 00 00 04 10 10"),
]

# 3. 한국 교통/결제 AID
KOREAN_AIDS = [
    ("T-Money",              "D4 10 00 00 03 00 01"),
    ("T-Money (Alt)",        "D4 10 00 00 03 00 02"),
    ("Cashbee",              "D4 10 00 00 04 00 01"),
    ("Railplus",             "D4 10 00 00 06 00 01"),
    ("Korea Smart Card",     "D4 10 00 00 01"),
    ("Korean ID",            "D4 10 00 00 01 00 01"),
    ("Korean ePassport",     "A0 00 00 02 47 10 01"),
]

# 4. 대학/교육 관련 AID (일반적 패턴)
UNIVERSITY_AIDS = [
    ("KONKUK (HEX)",         "F0 4B 4F 4E 4B 55 4B"),       # "KONKUK"
    ("KONKUK Univ",          "F0 4B 55 57 41 56 45"),         # "KUWAVE"
    ("DESFire Default",      "A0 00 00 00 04 01"),
    ("DESFire",              "D2 76 00 00 85 01 00"),
    ("MIFARE Plus",          "A0 00 00 03 96 56 43 4C"),
    ("HID iCLASS",           "A0 00 00 01 16 00 00"),
]

# 5. HCE 일반/커스텀 AID
HCE_COMMON_AIDS = [
    ("Android HCE Sample",   "F0 01 02 03 04 05 06"),
    ("Android Beam",         "D2 76 00 00 85 01 01"),
    ("HCE Loyalty",          "F0 41 43 4D 45 01 01"),
    ("Access Control",       "F0 41 43 43 45 53 53"),         # "ACCESS"
    ("Smart Room",           "F0 52 4F 4F 4D 30 31"),         # "ROOM01"
    ("Smart Class",          "F0 43 4C 41 53 53 30 31"),      # "CLASS01"
]

# 6. 광범위 프리픽스 스캔 (F0 XX XX XX XX - 커스텀 HCE 대역)
# F0으로 시작하는 AID는 사설/커스텀 앱에서 흔히 사용
HCE_PREFIX_SCAN = [
    (f"HCE F0-{i:02X}",     f"F0 {i:02X}") for i in range(0x00, 0x10)
]


def select_aid(connection, aid_hex: str) -> tuple:
    """AID SELECT 명령 전송. (성공여부, 응답데이터, SW코드) 반환"""
    aid_bytes = toBytes(aid_hex)
    apdu = [0x00, 0xA4, 0x04, 0x00, len(aid_bytes)] + aid_bytes + [0x00]

    try:
        data, sw1, sw2 = connection.transmit(apdu)
        sw_hex = f"{sw1:02X}{sw2:02X}"
        if sw1 == 0x90 and sw2 == 0x00:
            return True, toHexString(data) if data else "", sw_hex
        elif sw1 == 0x61:
            # 추가 데이터 있음 - GET RESPONSE
            get_resp = [0x00, 0xC0, 0x00, 0x00, sw2]
            data2, sw1_2, sw2_2 = connection.transmit(get_resp)
            if sw1_2 == 0x90:
                full_data = (toHexString(data) + " " + toHexString(data2)).strip()
                return True, full_data, sw_hex
            return True, toHexString(data) if data else "", sw_hex
        else:
            return False, "", sw_hex
    except Exception as e:
        return False, "", str(e)


def get_card_info(connection) -> dict:
    """카드/폰 기본 정보 조회"""
    info = {"uid": "N/A", "atr": "", "atr_hex": "", "is_phone": False}

    # UID
    try:
        data, sw1, sw2 = connection.transmit([0xFF, 0xCA, 0x00, 0x00, 0x00])
        if sw1 == 0x90:
            info["uid"] = toHexString(data).replace(" ", "")
    except:
        pass

    # ATR
    try:
        atr = connection.getATR()
        info["atr_hex"] = toHexString(atr)
        info["atr"] = atr

        # ATR로 폰 NFC 감지 (HCE 장치 특성)
        atr_str = toHexString(atr).replace(" ", "")
        # 일반적인 폰 HCE ATR 패턴
        phone_atr_patterns = [
            "3B8880",    # HCE 일반
            "3B8980",    # Android HCE
            "3B8A80",    # Android HCE variant
            "3B8F80",    # Various phones
            "3B80800101", # Some Samsung
        ]
        for pattern in phone_atr_patterns:
            if atr_str.startswith(pattern):
                info["is_phone"] = True
                break
    except:
        pass

    # ATS (Answer to Select)
    try:
        data, sw1, sw2 = connection.transmit([0xFF, 0xCA, 0x01, 0x00, 0x00])
        if sw1 == 0x90 and data:
            info["ats"] = toHexString(data)
    except:
        pass

    return info


def scan_aid_list(connection, aid_list: list, category: str) -> list:
    """AID 목록 스캔"""
    found = []
    print(f"\n  [{category}]")

    for name, aid in aid_list:
        success, data, sw = select_aid(connection, aid)
        aid_clean = aid.replace(" ", "")

        if success:
            print(f"    OK  {name}")
            print(f"         AID: {aid_clean}")
            if data:
                print(f"         Data: {data}")
            found.append({"name": name, "aid": aid_clean, "data": data})
        else:
            # 6A82=파일없음, 6A86=P1P2잘못, 6999=앱없음 등
            if sw in ("6A82", "6A86", "6999", "6E00"):
                pass  # 조용히 스킵
            else:
                # 예상 밖 응답은 표시
                print(f"    --  {name} (SW={sw})")

    return found


def scan_phone(connection, quick=False):
    """폰 NFC 앱 종합 스캔"""
    print("\n" + "=" * 50)
    print(" Phone NFC App AID Scanner")
    print("=" * 50)

    # 1. 기본 정보
    info = get_card_info(connection)
    print(f"\n  UID: {info['uid']}")
    print(f"  ATR: {info['atr_hex']}")
    if info.get("ats"):
        print(f"  ATS: {info['ats']}")
    if info["is_phone"]:
        print("  Type: PHONE (HCE detected)")
    else:
        print("  Type: CARD or UNKNOWN")

    # 2. AID 스캔
    all_found = []

    if quick:
        # 빠른 스캔: 주요 카테고리만
        all_found += scan_aid_list(connection, SYSTEM_AIDS, "System/Environment")
        all_found += scan_aid_list(connection, KOREAN_AIDS, "Korean Transport/Payment")
        all_found += scan_aid_list(connection, HCE_COMMON_AIDS, "HCE Common")
    else:
        # 전체 스캔
        all_found += scan_aid_list(connection, SYSTEM_AIDS, "System/Environment")
        all_found += scan_aid_list(connection, PAYMENT_AIDS, "Payment Apps")
        all_found += scan_aid_list(connection, KOREAN_AIDS, "Korean Transport/Payment")
        all_found += scan_aid_list(connection, UNIVERSITY_AIDS, "University/Education")
        all_found += scan_aid_list(connection, HCE_COMMON_AIDS, "HCE Common")
        all_found += scan_aid_list(connection, HCE_PREFIX_SCAN, "HCE Prefix Scan (F0 XX)")

    # 3. 결과 요약
    print("\n" + "=" * 50)
    if all_found:
        print(f" RESULT: {len(all_found)} AID(s) found!")
        print("=" * 50)
        for item in all_found:
            print(f"  Name: {item['name']}")
            print(f"  AID:  {item['aid']}")
            if item['data']:
                print(f"  Data: {item['data']}")
            print()

        # DB 저장용 출력
        print("  --- DB 저장용 (tag_aid 컬럼) ---")
        for item in all_found:
            print(f"  '{item['aid']}'")
    else:
        print(" RESULT: No known AIDs found")
        print("=" * 50)
        print("\n  Possible reasons:")
        print("  1. NFC app is not running on the phone")
        print("  2. Phone screen is locked (HCE requires unlocked screen)")
        print("  3. App uses a proprietary AID not in our database")
        print("  4. Try --aid option with a specific AID to test")
        print("\n  Tips:")
        print("  - Android: Settings > Connected devices > NFC > enable")
        print("  - Open the NFC app before tapping")
        print("  - Keep the phone on the reader until scan completes")

    return all_found


def test_single_aid(connection, aid_hex: str):
    """단일 AID 테스트"""
    print(f"\n  Testing AID: {aid_hex}")

    # 공백/하이픈 제거 후 포맷
    clean = aid_hex.replace(" ", "").replace("-", "").replace(":", "")
    # pyscard용 포맷 (2자리씩 공백)
    formatted = " ".join([clean[i:i+2] for i in range(0, len(clean), 2)])

    success, data, sw = select_aid(connection, formatted)

    if success:
        print(f"  OK  AID {clean} is PRESENT on this device!")
        if data:
            print(f"  Response data: {data}")
        print(f"  SW: {sw}")
    else:
        print(f"  FAIL  AID {clean} not found (SW={sw})")

    return success


def main():
    parser = argparse.ArgumentParser(description="Phone NFC App AID Scanner (ACR122U)")
    parser.add_argument("--aid", type=str, help="Test a specific AID (hex string)")
    parser.add_argument("--quick", action="store_true", help="Quick scan (main AIDs only)")
    parser.add_argument("--loop", action="store_true", help="Continuous scanning mode")
    args = parser.parse_args()

    print("===========================================")
    print(" Phone NFC AID Scanner (ACR122U)")
    print(" Hold your phone near the reader...")
    print("===========================================\n")

    # 리더기 검색
    reader_list = readers()
    if not reader_list:
        print("ERROR: No NFC reader found.")
        print("\nChecklist:")
        print("  1. Is ACR122U connected via USB?")
        print("  2. macOS: brew install pcsc-lite")
        print("  3. Linux: sudo apt-get install pcscd pcsc-tools libpcsclite-dev")
        print("  4. Windows: Install ACR122U driver from ACS website")
        sys.exit(1)

    reader = reader_list[0]
    print(f"Reader: {reader}")
    print("Waiting for phone... (Ctrl+C to quit)\n")

    last_uid = None

    try:
        while True:
            try:
                connection = reader.createConnection()
                connection.connect()

                # UID로 새 장치 감지
                try:
                    data, sw1, sw2 = connection.transmit([0xFF, 0xCA, 0x00, 0x00, 0x00])
                    uid = toHexString(data).replace(" ", "") if sw1 == 0x90 else "UNKNOWN"
                except:
                    uid = "UNKNOWN"

                if uid != last_uid:
                    last_uid = uid

                    if args.aid:
                        test_single_aid(connection, args.aid)
                    else:
                        scan_phone(connection, quick=args.quick)

                    if not args.loop:
                        print("\nScan complete. Remove device and tap again for re-scan...")
                        print("(or Ctrl+C to quit)")

                connection.disconnect()

            except NoCardException:
                if last_uid is not None:
                    print("\n[Device removed]")
                    last_uid = None
            except CardConnectionException:
                last_uid = None
            except Exception as e:
                if "connect" not in str(e).lower():
                    print(f"  Error: {e}")
                last_uid = None

            time.sleep(0.5)

    except KeyboardInterrupt:
        print("\n\nScanner stopped.")


if __name__ == "__main__":
    main()
