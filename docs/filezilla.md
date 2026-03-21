# FileZilla Server 설정 가이드

> BON 녹화기(Windows) 에서 녹화된 파일을 FTP로 제공하기 위한 FileZilla Server 설정 가이드입니다.
> KU WAVE PLAT 시스템에서 녹화 파일 미리보기/다운로드 기능에 필요합니다.

---

## 1. 사전 준비

### 1.1 FileZilla Server 설치
- 다운로드: https://filezilla-project.org/download.php?type=server
- 버전: **FileZilla Server 1.12.5** (이상)
- 설치 경로: 기본값 사용

### 1.2 고정 IP 및 포트 포워딩
- 녹화기 PC에 **고정 IP** 할당 (예: `192.168.1.2`)
- 공유기/방화벽에서 **포트 포워딩** 설정:

| 외부 포트 | 내부 포트 | 프로토콜 | 대상 IP |
|-----------|-----------|----------|---------|
| 21 | 21 | TCP | 192.168.1.2 |
| 50000-50100 | 50000-50100 | TCP | 192.168.1.2 |

---

## 2. Windows 방화벽 설정

### 2.1 인바운드 규칙 추가

1. **Windows Defender 방화벽** → **고급 설정** 열기
2. **인바운드 규칙** → **새 규칙** 클릭

**규칙 1: FTP 포트**
- 규칙 유형: **포트**
- 프로토콜: **TCP**
- 특정 로컬 포트: **21**
- 작업: **연결 허용**
- 이름: `FTP Port 21`

**규칙 2: 패시브 모드 포트**
- 규칙 유형: **포트**
- 프로토콜: **TCP**
- 특정 로컬 포트: **50000-50100**
- 작업: **연결 허용**
- 이름: `FTP Passive Ports 50000-50100`

### 2.2 아웃바운드 규칙 추가

1. **아웃바운드 규칙** → **새 규칙** 클릭
2. 위 인바운드와 동일하게 2개 규칙 추가:
   - `FTP Outbound 21` (TCP 21)
   - `FTP Passive Outbound 50000-50100` (TCP 50000-50100)

---

## 3. FileZilla Server 설정

FileZilla Server 관리 콘솔을 실행하고 `localhost:14148`로 연결합니다.

### 3.1 Server Listeners (접속 프로토콜)

1. **Server** → **Configure...** 클릭
2. 좌측 **Server listeners** 선택
3. 21번 포트 항목의 **Protocol** 설정:
   - **`Explicit FTP over TLS and insecure plain FTP`** 선택
   - (TLS와 일반 FTP 모두 허용)

### 3.2 Protocols Settings (프로토콜 상세)

1. 좌측 **Protocols settings** 선택
2. **FTP and FTP over TLS (FTPS)** 섹션:

**Welcome Message:**
```
Hello KU_WAVE_PLAT
```

**Passive Mode:**
- **Use custom port range** 체크
  - From: `50000`
  - To: `50100`

**Public IP:**
- **Retrieve public IP** 선택 (자동 감지)
- 또는 수동 입력: 녹화기의 공인 IP (예: `117.16.145.227`)

### 3.3 TLS 세션 설정 (중요)

1. **Protocols settings** → **FTP** → **TLS** 섹션
2. **"Require TLS session resumption on data connection"** → **체크 해제**
   - (해제하지 않으면 패시브 모드 데이터 전송 실패)

---

## 4. 사용자 계정 생성

1. 좌측 **Rights management** → **Users** 선택
2. **Add** 클릭

**계정 정보:**
| 항목 | 값 |
|------|-----|
| Username | `kuwave` |
| Password | `kuwave` |

3. 생성된 `kuwave` 사용자 선택 → **Mount points** 설정:

**Mount Point:**
| 항목 | 값 |
|------|-----|
| Virtual path | `/` |
| Native path | `D:\녹화` |

4. **권한 설정:**
   - Files: Read, Write
   - Directories: List, +Subdirs

5. **Apply** 클릭

---

## 5. 설정 확인

### 5.1 연결 테스트 (터미널)

```bash
# 파일 목록 조회
curl -s 'ftp://kuwave:kuwave@{녹화기_IP}:21/' --list-only

# 예상 출력:
# 녹화_260321_0000
# 녹화_260321_0001
# ...
```

### 5.2 파일 다운로드 테스트

```bash
# 특정 녹화 폴더 내 파일 확인
curl -s 'ftp://kuwave:kuwave@{녹화기_IP}:21/녹화_260321_0007/' --list-only

# 파일 다운로드
curl -s 'ftp://kuwave:kuwave@{녹화기_IP}:21/녹화_260321_0007/출력.mp4' -o test.mp4
```

### 5.3 KU WAVE PLAT에서 확인

1. **녹화기관리 → FTP 설정** 페이지
2. 산학협동관 220호 FTP 설정:
   - 호스트: `{녹화기_IP}`
   - 포트: `21`
   - 프로토콜: `FTP`
   - 사용자명: `kuwave`
   - 비밀번호: `kuwave`
   - 경로: `/`
   - 패시브 모드: 사용
3. **연결 테스트** 버튼 클릭 → "FTP 연결 성공" 확인

---

## 6. 문제 해결

| 증상 | 원인 | 해결 |
|------|------|------|
| `503 Use AUTH first` | TLS 필수 설정됨 | Server listeners에서 `insecure plain FTP` 허용 |
| 로그인 성공 후 목록 안 보임 | 패시브 포트 방화벽 차단 | 50000-50100 인바운드/아웃바운드 허용 |
| `425 Use PORT, PASV first` | TLS 세션 재사용 문제 | TLS session resumption 체크 해제 |
| 연결 타임아웃 | 방화벽/포트포워딩 미설정 | 21번 포트 포워딩 및 방화벽 확인 |

---

## 7. 녹화 파일 구조

```
D:\녹화\                          ← FileZilla FTP 루트 (Virtual path: /)
├── 녹화_260321_0000\
│   └── 출력.mp4                  ← 녹화 영상 파일
├── 녹화_260321_0001\
│   └── 출력.mp4
├── 녹화_260321_0007\
│   └── 출력.mp4                  ← 85.7MB (3분 5초)
└── ...
```

- 녹화 시작 시 REST API(`POST /api/record`)가 반환하는 `filepath`로 폴더명 확인
- 예: `D:\녹화\녹화_260321_0007\\출력.mp4` → FTP 경로: `/녹화_260321_0007/출력.mp4`
