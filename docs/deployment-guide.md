# 배포 가이드

> **프로젝트**: KU-WAVE-PLAT
> **생성일**: 2026-03-22
> **문서 유형**: BMAD 배포 가이드

---

## 1. 개요

KU-WAVE-PLAT은 두 가지 배포 대상으로 구성된다:

| 대상 | 역할 | 관리 | 상세 문서 |
|------|------|------|----------|
| **운영 서버** | API + Console + NFC + DB | PM2 + Nginx | [`docs/dev/plan_ku_wave_plat.md`](./dev/plan_ku_wave_plat.md) |
| **강의실 PC (ku_ai_pc)** | 음성 녹음 + STT + 명령 매칭 | systemd | [`docs/dev/plan_ku_ai_pc.md`](./dev/plan_ku_ai_pc.md) |

이 문서는 두 환경의 아키텍처를 요약한다. 구체적인 스크립트와 절차는 상세 문서를 참조한다.

---

## 2. 운영 서버 아키텍처

### 구성도

```
┌──────────────────────────────────────────────────────────────┐
│                운영 서버 (Ubuntu 24.04)                        │
│                                                              │
│  ┌──────────┐    ┌─────────────┐    ┌───────────────────┐    │
│  │  Nginx   │───▶│  API        │───▶│  MariaDB          │    │
│  │  :80     │    │  :8000 (PM2)│    │  :3306            │    │
│  │          │    └─────────────┘    └───────────────────┘    │
│  │          │    ┌─────────────┐                              │
│  │          │───▶│  Console    │                              │
│  │          │    │  :3000 (PM2)│                              │
│  └──────────┘    └─────────────┘                              │
│                  ┌─────────────┐                              │
│                  │  NFC Agent  │                              │
│                  │  (PM2)      │                              │
│                  └─────────────┘                              │
└──────────────────────────────────────────────────────────────┘
```

### 요구사항

| 항목 | 최소 | 권장 |
|------|------|------|
| OS | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |
| CPU | 2 vCPU | 4 vCPU |
| RAM | 4 GB | 8 GB |
| Disk | 40 GB SSD | 80 GB SSD |
| 포트 | 22, 80, 3306 | 22, 80, 3306 |

### 셋업 순서 (~28분)

| 단계 | 스크립트 | 소요 | 설명 |
|------|----------|------|------|
| 1 | `01-base-setup.sh` | ~5분 | OS + Node.js + pnpm + PM2 |
| 2 | `02-mariadb-setup.sh` | ~5분 | MariaDB + 외부 접근 + DB 생성 |
| 3 | `.env` 편집 | ~5분 | DB, JWT, 서버 IP 설정 |
| 4 | `03-app-build.sh` | ~10분 | 빌드 + PM2 실행 |
| 5 | `04-nginx-setup.sh` | ~2분 | Nginx 리버스 프록시 |
| 6 | `05-backup-cron.sh` | ~1분 | DB 백업 cron (매일 03:00) |

### PM2 프로세스

| 이름 | 경로 | 스크립트 | 메모리 제한 |
|------|------|----------|-----------|
| `ku-api` | apps/api | `dist/main.js` | 512M |
| `ku-console` | apps/console | `next start -p 3000` | 512M |
| `ku-nfc` | apps/nfc | `dist/index.js` | 256M |

### Nginx 설정 요약

| Location | 대상 | Rate Limit |
|----------|------|-----------|
| `/api/*` | API :8000 | 30req/s, burst 50 |
| `/api/v1/auth/login` | API :8000 | 5req/min, burst 3 |
| `/uploads/*` | API :8000 | 캐시 1시간 |
| `/*` | Console :3000 | 없음 |

### 보안 헤더

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`

### DB 백업

- **주기**: 매일 03:00 (cron)
- **보관**: 7일 (이전 파일 자동 삭제)
- **형식**: gzip 압축 SQL 덤프
- **위치**: `/opt/ku_wave_plat/backups/`

---

## 3. 강의실 PC (ku_ai_pc) 아키텍처

### 구성도

```
┌─────────────────────────────────────────────┐
│          강의실 ku_ai_pc (Ubuntu 24.04)       │
│                                             │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐ │
│  │ 마이크    │─▶│ STT       │─▶│ Voice    │ │
│  │ (PyAudio) │  │ (whisper) │  │ Detect   │ │
│  └──────────┘  └───────────┘  └──────────┘ │
│       │                            │        │
│       ▼                            ▼        │
│  ┌──────────┐              ┌────────────┐   │
│  │ 파일 관리 │              │ API Client │───┼──▶ 운영 서버
│  └────┬─────┘              └────────────┘   │
│       │                                     │
│       ▼                                     │
│  ┌──────────────┐  ┌───────────────────┐    │
│  │ Uploader     │  │ Offline Queue     │    │
│  └──────────────┘  └───────────────────┘    │
└─────────────────────────────────────────────┘
```

### 요구사항

| 항목 | 최소 | 권장 |
|------|------|------|
| OS | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |
| CPU | Intel i5 | Intel i7 |
| RAM | 8 GB | 16 GB |
| Disk | 128 GB SSD | 256 GB SSD |
| Audio | 마이크 (3.5mm) | USB 마이크 |
| GPU | 없어도 됨 (CPU STT) | NVIDIA (STT 가속) |
| Node.js | v24.4.1 | v24.4.1 |

### 셋업 순서 (~15분, GPU 제외)

| 단계 | 스크립트 | 소요 | 설명 |
|------|----------|------|------|
| 1 | `01-base-setup.sh` | ~5분 | OS + Python + 시스템 패키지 |
| 2 | `02-app-install.sh` | ~5분 | venv + 의존성 + .env 생성 |
| 3 | `.env` 편집 | ~3분 | 호실 정보, 서버 연결 설정 |
| 4 | `03-service-setup.sh` | ~2분 | systemd + 헬스 모니터 cron |
| 5 | `04-gpu-setup.sh` (선택) | ~10분 | NVIDIA GPU 가속 |

### systemd 서비스

```
서비스명: ku-ai-pc
실행: /opt/ku_ai_pc/.venv/bin/python main.py --headless
유저: ku (audio 그룹)
메모리 제한: 2G
CPU 제한: 80%
자동 재시작: always (5초 딜레이)
```

### STT 설정 (CPU vs GPU)

| 설정 | CPU 모드 | GPU 모드 |
|------|---------|---------|
| `STT_MODEL` | tiny | large-v3 |
| `STT_DEVICE` | cpu | cuda |
| `STT_COMPUTE_TYPE` | int8 | float16 |

### cron 작업

| 주기 | 스크립트 | 역할 |
|------|----------|------|
| 5분마다 | `health-monitor.sh` | 서비스 다운 시 자동 재시작 (최대 3회) |
| 매일 04:00 | `cleanup-recordings.sh` | 3일 이상 녹음 파일 정리 |

### 호실별 환경변수 (`.env`)

| 변수 | 호실별 다름 | 예시 |
|------|-----------|------|
| `ROOM_CODE` | Y | `ROOM-101` |
| `DEVICE_CODE` | Y | `PC-101` |
| `SPACE_SEQ` | Y | `1` |
| `WAVE_PLAT_URL` | N | `http://운영서버IP/api/v1` |
| `AI_WORKER_URL` | N | `http://GPU서버IP:9000` |

### 다수 호실 일괄 배포

```bash
# 개발PC에서 원격 배포
for IP in 50 51 52; do
    ./scripts/deploy-prod.sh 192.168.1.$IP ku
done
```

---

## 4. 업데이트 절차

### 운영 서버

```bash
cd /opt/ku_wave_plat
./scripts/server/update.sh
```

내부 동작:
1. `git pull origin main`
2. `pnpm install --frozen-lockfile`
3. 공유 패키지 빌드 (@ku/types, @ku/contracts)
4. API + Console + NFC 빌드
5. `pm2 reload ecosystem.config.js` (무중단)

### 강의실 PC

```bash
# 원격 일괄 배포
./scripts/deploy-prod.sh <KU_AI_PC_IP> ku
```

---

## 5. 모니터링

### 운영 서버

```bash
# PM2 상태
pm2 status
pm2 monit              # 실시간 CPU/메모리

# 로그
pm2 logs               # 전체
pm2 logs ku-api        # API만
pm2 logs ku-console    # Console만
pm2 logs ku-nfc        # NFC만

# 헬스체크
curl http://localhost:8000/api/v1/health
```

### 강의실 PC

```bash
# systemd 상태
sudo systemctl status ku-ai-pc

# 로그
journalctl -u ku-ai-pc -f           # 실시간
journalctl -u ku-ai-pc --since today # 오늘

# 마이크 확인
arecord -l
```

---

## 6. 트러블슈팅

상세 트러블슈팅은 각 상세 문서를 참조한다:

- 운영 서버: [`docs/dev/plan_ku_wave_plat.md`](./dev/plan_ku_wave_plat.md) 섹션 10
- 강의실 PC: [`docs/dev/plan_ku_ai_pc.md`](./dev/plan_ku_ai_pc.md) 섹션 9

### 주요 체크리스트

| 증상 | 운영 서버 | 강의실 PC |
|------|----------|----------|
| 서비스 안 뜸 | `pm2 logs` | `journalctl -u ku-ai-pc` |
| DB 연결 실패 | `systemctl status mariadb` | N/A |
| 빌드 실패 | `pnpm --filter @ku/api build` | `pip install -e ".[stt]"` |
| 메모리 부족 | `free -h`, `pm2 monit` | `free -h` |
| NFC 미감지 | `lsusb \| grep 072f` | N/A |
| 마이크 미감지 | N/A | `arecord -l` |
