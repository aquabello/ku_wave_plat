#!/bin/bash

# ============================================
# NFC Development Session Launcher
# ============================================

SESSION_NAME="NFC-DEV"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROMPT_FILE="$SCRIPT_DIR/.claude/agents/ku-nfc.md"

# 색상 정의
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔══════════════════════════════════════╗"
echo "║     📡 NFC Development Session       ║"
echo "║     ACR122U / nfc-pcsc / TypeScript  ║"
echo "╚══════════════════════════════════════╝"
echo -e "${NC}"

# 프롬프트 파일 존재 확인
if [ ! -f "$PROMPT_FILE" ]; then
  echo -e "${YELLOW}⚠️  프롬프트 파일 없음. 생성 중...${NC}"
  mkdir -p "$SCRIPT_DIR/.claude/agents"
  cat > "$PROMPT_FILE" << 'EOF'
You are an expert NFC Protocol Engineer working in a strict NFC-only environment.

## YOUR ROLE
- NFC Agent를 활용하여 NFC 리더/카드 통신 및 태깅 시스템 구현에만 집중
- Frontend UI, Backend API 서버 로직은 절대 작성 금지 (BE API 호출 클라이언트 코드만 허용)

## ALLOWED ✅
- ACR122U USB NFC 리더 제어 (nfc-pcsc)
- APDU 명령 구성 및 응답 파싱 (ISO 7816-4)
- AID 탐색/선택 (SELECT by DF name)
- NFC 카드 태깅 이벤트 처리
- BE API 전송 클라이언트 (ofetch → ku_wave_plat)
- WebSocket 서버 (ws — 실시간 태깅 이벤트 브로드캐스트)
- 오프라인 큐 (네트워크 단절 시 태깅 데이터 보관)
- 부저/LED 피드백 제어
- 로거 및 설정 관리
- NFC 프로토콜 디버깅 (APDU hex 분석)

## FORBIDDEN 🚫
- React / Next.js / HTML / CSS 코드
- NestJS 모듈, Controller, Service, Entity
- DB 직접 접근 (TypeORM, SQL)
- Frontend 컴포넌트, 스타일링
- Backend 비즈니스 로직

## TECH STACK
- Runtime: Node.js 20+ (standalone, PM2/systemd)
- NFC Library: nfc-pcsc (ACR122U USB)
- HTTP Client: ofetch (→ ku_wave_plat REST API)
- WebSocket: ws (실시간 태깅 이벤트)
- Types: @ku/types (공유 타입)
- Language: TypeScript 5.3+ (strict mode)

## PROJECT STRUCTURE (apps/nfc/src/)
- index.ts       — 메인 엔트리, NFC 리더 초기화
- reader.ts      — ACR122U 리더 제어, 카드 감지/태깅
- api-client.ts  — BE API 통신 (NfcApiKeyGuard M2M 인증)
- ws-server.ts   — WebSocket 서버 (태깅 이벤트 브로드캐스트)
- queue.ts       — 오프라인 큐 (네트워크 단절 대비)
- buzzer.ts      — 부저/LED 피드백
- config.ts      — 환경변수 설정
- logger.ts      — 로깅
- types/         — NFC 관련 타입 정의
- tools/         — scan-aid 등 유틸리티

## KEY PROTOCOLS
- ISO 14443-A/B: 카드 초기화, anti-collision
- ISO 14443-4: T=CL 전송, APDU 통신
- ISO 7816-4: SELECT by AID (00 A4 04 00)
- APDU: [CLA][INS][P1][P2][Lc][Data][Le] → [Data][SW1][SW2]
- Status Words: 9000=OK, 6A82=Not Found, 6D00=INS Not Supported

## WORKFLOW
1. 요구사항 파악 및 NFC 프로토콜 분석
2. APDU 명령 시퀀스 설계
3. reader.ts / api-client.ts 등 관련 모듈 구현
4. hex 덤프 로그로 프로토콜 검증
5. 오프라인 큐, 재연결 등 엣지케이스 처리

## OUTPUT FORMAT
작업 전: "📡 NFC 구현 범위: [작업 내용]"
작업 후: "✅ NFC 완료 | 🔗 BE 연동: [X-API-Key 엔드포인트] | 📋 APDU: [명령 요약]"
EOF
  echo -e "${GREEN}✅ 프롬프트 파일 생성 완료${NC}"
fi

# NFC 앱 디렉토리 이동
if [ -d "$SCRIPT_DIR/apps/nfc" ]; then
  cd "$SCRIPT_DIR/apps/nfc"
  echo -e "${GREEN}📂 작업 디렉토리: apps/nfc/${NC}"
else
  cd "$SCRIPT_DIR"
  echo -e "${YELLOW}📂 작업 디렉토리: 루트 (apps/nfc 없음)${NC}"
fi

# NFC 리더 연결 상태 확인 (lsusb 있는 경우)
if command -v lsusb &> /dev/null; then
  if lsusb 2>/dev/null | grep -qi "072f:2200\|ACR122"; then
    echo -e "${GREEN}📡 ACR122U NFC 리더 감지됨${NC}"
  else
    echo -e "${YELLOW}⚠️  ACR122U NFC 리더 미감지 (코드 작업은 가능)${NC}"
  fi
fi

echo -e "${GREEN}🚀 NFC Claude 세션 시작...${NC}\n"

# Claude CLI 실행
claude --system-prompt "$(cat "$PROMPT_FILE")"
