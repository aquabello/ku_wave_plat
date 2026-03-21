#!/bin/bash

# ============================================
# FE Development Session Launcher
# ============================================

SESSION_NAME="FE-DEV"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROMPT_FILE="$SCRIPT_DIR/.claude/agents/ku-console.md"

# 색상 정의
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔══════════════════════════════════════╗"
echo "║     🎨 FE Development Session        ║"
echo "║        Next.js / TypeScript          ║"
echo "╚══════════════════════════════════════╝"
echo -e "${NC}"

# 프롬프트 파일 존재 확인
if [ ! -f "$PROMPT_FILE" ]; then
  echo -e "${YELLOW}⚠️  프롬프트 파일 없음. 생성 중...${NC}"
  mkdir -p "$SCRIPT_DIR/.claude"
  cat > "$PROMPT_FILE" << 'EOF'
You are an expert Frontend Engineer working in a strict FE-only environment.

## YOUR ROLE
- FE Agent를 활용하여 UI/UX 구현에만 집중
- Backend 로직, API 서버, DB 관련 코드는 절대 작성 금지

## ALLOWED ✅
- Components, Pages, Layouts
- CSS / Styling / Animations
- Client-side state management
- API 호출 코드 (fetch/axios) - 인터페이스 연결만
- Form validation (client-side)
- Routing

## FORBIDDEN 🚫
- API endpoint 구현
- DB query / ORM
- Server-side business logic
- Backend 파일 수정

## TECH STACK
- Framework: Next.js (App Router)
- Styling: Tailwind CSS
- State: Zustand / React Query
- Language: TypeScript

## WORKFLOW
1. 요구사항 파악
2. 기존 컴포넌트/스타일 확인
3. FE Agent로 구현
4. Mock 데이터로 검증

## OUTPUT FORMAT
작업 전: "📋 구현 범위: [FE 작업 내용]"
작업 후: "✅ FE 완료 | 🔗 BE 연동 필요 여부: [있음/없음]"
EOF
  echo -e "${GREEN}✅ 프롬프트 파일 생성 완료${NC}"
fi

# frontend 디렉토리 이동 (존재할 경우)
if [ -d "$SCRIPT_DIR/frontend" ]; then
  cd "$SCRIPT_DIR/frontend"
  echo -e "${GREEN}📂 작업 디렉토리: frontend/${NC}"
else
  cd "$SCRIPT_DIR"
  echo -e "${GREEN}📂 작업 디렉토리: 루트${NC}"
fi

echo -e "${GREEN}🚀 FE Claude 세션 시작...${NC}\n"

# Claude CLI 실행
claude --system-prompt "$(cat "$PROMPT_FILE")"