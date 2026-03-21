# 운영 셋업 계획 (인덱스)

> **작성일**: 2026-03-22
> **방식**: PM2 + systemd 직접 설치, Docker 미사용, 고정 IP, SSL 없음

---

## 문서 구성

| 문서 | 대상 | 설명 |
|------|------|------|
| [plan_ku_wave_plat.md](./plan_ku_wave_plat.md) | **ku_wave_plat** 운영 서버 | Node.js + PM2 (API+Console+NFC) + Nginx + MariaDB (외부접근) |
| [plan_ku_ai_pc.md](./plan_ku_ai_pc.md) | **ku_ai_pc** 강의실 클라이언트 | Python + systemd + 호실별 배포 |

---

## 전체 아키텍처

```
┌─────────────────────────────────────────┐
│  운영 서버 (ku_wave_plat)                │
│  PM2: API(:8000) + Console(:3000) + NFC │
│  Nginx(:80) + MariaDB(:3306)            │
│  USB: ACR122U NFC 리더 연결              │
└──────────┬───────────┬──────────────────┘
           │           │
     HTTP :80    MySQL :3306
           │           │
    ┌──────┴──┐  ┌─────┴──────┐
    │ 브라우저 │  │ DBeaver 등 │
    └─────────┘  └────────────┘
           │
     REST API
           │
┌──────────┴───────────────────┐
│  ku_ai_pc (강의실 클라이언트)  │
│  systemd: 녹음 + STT + 업로드 │
│  호실별 설치 (101호, 102호...) │
└──────────────────────────────┘
```

---

## 셋업 순서 요약

### 1단계: 운영 서버 (plan_ku_wave_plat.md)

```
01-base-setup.sh     → Node.js + PM2 + pcscd(NFC) + 방화벽
02-mariadb-setup.sh  → MariaDB + 외부접근 + 스키마
03-app-build.sh      → pnpm build (API+Console+NFC) + PM2 시작
04-nginx-setup.sh    → 리버스 프록시
05-backup-cron.sh    → DB 백업
```

> NFC Agent(apps/nfc)는 모노레포에 포함되어 PM2로 함께 관리.
> 서버에 ACR122U USB 리더를 연결해야 NFC 태깅이 동작합니다.

### 2단계: ku_ai_pc (plan_ku_ai_pc.md)

```
01-base-setup.sh     → Python + 시스템 패키지
02-app-install.sh    → venv + 의존성 + .env
03-service-setup.sh  → systemd + 헬스모니터 cron
04-gpu-setup.sh      → GPU 가속 (선택)
```
