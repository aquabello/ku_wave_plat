"""
NFC AID Reader Test Script (Python)
ACR122U USB NFC Reader를 사용하여 카드의 AID를 읽는 테스트 스크립트

설치: pip install pyscard
실행: python tools/nfc-test/read-aid.py
"""

from smartcard.System import readers
from smartcard.util import toHexString, toBytes
from smartcard.Exceptions import NoCardException, CardConnectionException
import time
import sys


def select_aid(connection, aid_hex: str) -> tuple[bool, str]:
    """AID SELECT 명령 전송"""
    aid_bytes = toBytes(aid_hex)
    # ISO 7816-4 SELECT: CLA=00, INS=A4, P1=04 (by AID), P2=00
    apdu = [0x00, 0xA4, 0x04, 0x00, len(aid_bytes)] + aid_bytes + [0x00]

    try:
        data, sw1, sw2 = connection.transmit(apdu)
        if sw1 == 0x90 and sw2 == 0x00:
            return True, toHexString(data) if data else ""
        else:
            return False, f"SW={sw1:02X}{sw2:02X}"
    except Exception as e:
        return False, str(e)


def get_uid(connection) -> str:
    """카드 UID 조회 (ACR122U)"""
    apdu = [0xFF, 0xCA, 0x00, 0x00, 0x00]
    data, sw1, sw2 = connection.transmit(apdu)
    if sw1 == 0x90:
        return toHexString(data).replace(" ", "")
    return "N/A"


def scan_card(connection):
    """카드 정보 및 AID 스캔"""
    print("\n--- 카드 감지 ---")

    # UID 조회
    uid = get_uid(connection)
    print(f"  카드 UID: {uid}")

    # ATR 조회
    atr = connection.getATR()
    print(f"  ATR: {toHexString(atr)}")

    # 공통 AID 테스트
    test_aids = [
        ("NDEF",              "D2 76 00 00 85 01 01"),
        ("T-Money",           "D4 10 00 00 03 00 01"),
        ("Mifare DESFire",    "A0 00 00 00 04 01"),
        ("Korean ID",         "D4 10 00 00 01"),
        ("University (예시)",  "F0 4B 4F 4E 4B 55 4B"),  # "KONKUK" hex
    ]

    print("\n--- AID 스캔 ---")
    found_aids = []

    for name, aid in test_aids:
        success, response = select_aid(connection, aid)
        if success:
            print(f"  ✅ {name} ({aid}): 존재함")
            if response:
                print(f"     응답: {response}")
            found_aids.append((name, aid))
        else:
            print(f"  ❌ {name} ({aid}): 없음 ({response})")

    if found_aids:
        print(f"\n  📋 발견된 AID: {len(found_aids)}개")
        for name, aid in found_aids:
            print(f"     - {name}: {aid.replace(' ', '')}")
    else:
        print("\n  ⚠️  알려진 AID가 발견되지 않았습니다.")
        print("     카드의 AID를 카드 발급처에 확인하세요.")

    return uid, found_aids


def main():
    print("===========================================")
    print(" NFC AID Reader Test (ACR122U) - Python")
    print("===========================================\n")

    # 리더기 검색
    reader_list = readers()

    if not reader_list:
        print("❌ NFC 리더기를 찾을 수 없습니다.")
        print("\n확인사항:")
        print("1. ACR122U가 USB에 연결되어 있는지 확인")
        print("2. macOS: brew install pcsc-lite")
        print("3. Linux: sudo apt-get install pcscd pcsc-tools")
        print("4. Windows: 드라이버 설치 확인")
        sys.exit(1)

    print(f"발견된 리더기: {len(reader_list)}개")
    for i, r in enumerate(reader_list):
        print(f"  [{i}] {r}")

    # 첫 번째 리더기 사용
    reader = reader_list[0]
    print(f"\n사용 리더기: {reader}")
    print("카드를 리더기에 올려주세요... (Ctrl+C로 종료)\n")

    last_uid = None

    try:
        while True:
            try:
                connection = reader.createConnection()
                connection.connect()

                uid = get_uid(connection)

                # 새 카드 감지 시에만 스캔
                if uid != last_uid:
                    last_uid = uid
                    scan_card(connection)
                    print("\n카드를 제거하고 다른 카드를 올려주세요...")

                connection.disconnect()

            except NoCardException:
                if last_uid is not None:
                    print(f"\n[카드 제거]")
                    last_uid = None
            except CardConnectionException:
                last_uid = None
            except Exception as e:
                print(f"  오류: {e}")
                last_uid = None

            time.sleep(0.5)

    except KeyboardInterrupt:
        print("\n\n프로그램을 종료합니다.")


if __name__ == "__main__":
    main()
