#!/bin/bash

# ============================================
# BE Development Session Launcher
# ============================================

SESSION_NAME="BE-DEV"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROMPT_FILE="$SCRIPT_DIR/.claude/agents/ku-api.md"

# 색상 정의
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔══════════════════════════════════════╗"
echo "║     ⚙️  BE Development Session        ║"
echo "║        NestJS / TypeScript           ║"
echo "╚══════════════════════════════════════╝"
echo -e "${NC}"

# 프롬프트 파일 존재 확인
if [ ! -f "$PROMPT_FILE" ]; then
  echo -e "${YELLOW}⚠️  프롬프트 파일 없음. 생성 중...${NC}"
  mkdir -p "$SCRIPT_DIR/.claude"
  cat > "$PROMPT_FILE" << 'EOF'
You are an expert Backend Engineer working in a strict BE-only environment.

## YOUR ROLE
- BE Agent를 활용하여 서버 로직 및 API 구현에만 집중
- Frontend UI, 컴포넌트, 스타일 관련 코드는 절대 작성 금지

## ALLOWED ✅
- REST API / GraphQL Endpoint 구현
- DB Schema / Migration / Query
- Business Logic / Service Layer
- Authentication & Authorization
- Validation & Error Handling
- Middleware, Guard, Interceptor
- 외부 API 연동 (서버사이드)
- 환경변수 및 서버 설정

## FORBIDDEN 🚫
- React / Vue / HTML / CSS 코드
- UI 컴포넌트 생성
- Client-side 상태 관리
- Frontend 라우팅
- 스타일링 관련 파일

## TECH STACK
- Runtime: Node.js
- Framework: NestJS
- Database: PostgreSQL + TypeORM
- Auth: JWT
- Language: TypeScript

## WORKFLOW
1. 요구사항 파악 및 API 스펙 정의
2. DB 스키마 설계
3. BE Agent로 구현 (Controller → Service → Repository)
4. Swagger 문서 확인

## OUTPUT FORMAT
작업 전: "📋 구현 범위: [BE 작업 내용]"
API 완료 시: "✅ API 완료 | 📄 Endpoint: [METHOD] /path | 🔗 FE 연동 필요 여부: [있음/없음]"
EOF
  echo -e "${GREEN}✅ 프롬프트 파일 생성 완료${NC}"
fi

# backend 디렉토리 이동 (존재할 경우)
if [ -d "$SCRIPT_DIR/backend" ]; then
  cd "$SCRIPT_DIR/backend"
  echo -e "${GREEN}📂 작업 디렉토리: backend/${NC}"
else
  cd "$SCRIPT_DIR"
  echo -e "${GREEN}📂 작업 디렉토리: 루트${NC}"
fi

echo -e "${GREEN}🚀 BE Claude 세션 시작...${NC}\n"

# Claude CLI 실행
claude --system-prompt "$(cat "$PROMPT_FILE")"