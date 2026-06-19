# nh-bridge — NH투자증권(나무증권) 잔고 → 웹 대시보드 브릿지

## 이게 왜 필요한가요?

NH투자증권의 **QV/WMCA OpenAPI 는 Windows 전용 DLL(`wmca.dll`, ActiveX 류)** 로만
제공됩니다. 웹 대시보드는 클라우드(Linux/Vercel)에서 동작하므로 NH API 를 **직접
호출할 수 없습니다.**

그래서 이 작은 프로그램(`nh-bridge`)을 **사용자 본인의 Windows PC** 에서 실행합니다.
브릿지는

1. NH 에 로그인하고,
2. 주식잔고(c8201)를 조회한 뒤,
3. 그 결과 "행"만 Supabase DB(`holdings_cache` 테이블)로 밀어넣습니다.

이후 웹 앱은 NH 데이터를 다른 증권사/거래소 데이터와 **똑같이** 읽어 표시합니다.

### 보안 (중요)

- **NH 로그인 ID/비밀번호, 공인인증서, 인증서 비밀번호, 계좌 비밀번호는 절대 본인
  PC 밖으로 나가지 않습니다.** DB 로 전송되는 것은 (종목코드/종목명/수량/평단/현재가
  등) **잔고 행 뿐**입니다.
- 계좌 비밀번호는 NH SDK 가 PC 안에서 44자 해시로 변환해 사용합니다.
- `SUPABASE_SERVICE_ROLE_KEY` 와 `.env` 파일은 절대 외부에 공유/커밋하지 마세요.

---

## 요구사항

- **Windows** (NH WMCA DLL 은 Windows 전용. Linux/Mac 불가)
- **Python 3.10+** — pynamuh 는 **32비트 Python** 을 요구합니다(`wmca.dll` 이 32비트).
  - 예: `py -3.11-32`
- **NH OpenAPI DLL** (`wmca.dll` 등) — [나무증권 홈페이지](https://www.mynamuh.com/)에서
  OpenAPI 를 내려받아 DLL 을 추출한 뒤, pynamuh 설치 경로의 `dll/` 폴더(또는
  `C:\Windows\System32\`)에 직접 배치해야 합니다.
- **공인인증서** 가 하드디스크에 설치되어 있어야 합니다.
- **NH(나무증권) 계좌** + OpenAPI 사용 등록.
- 본인 **Supabase 프로젝트**(웹 대시보드 백엔드)와 그 `service_role` 키.

> 참고: 매핑 로직과 테스트(`test_mapping.py`)는 Windows/DLL 없이 **어떤 OS 에서도**
> 실행됩니다. 라이브 잔고 조회만 Windows 가 필요합니다.

---

## 설치

1) 이 폴더(`nh-bridge/`)를 본인 Windows PC 로 복사합니다.

2) 32비트 Python 가상환경을 만들고 의존성을 설치합니다.

```powershell
# 32비트 Python 가상환경
py -3.11-32 -m venv .venv
.\.venv\Scripts\activate

# 의존성 설치 (pynamuh 는 PyPI 에 없으므로 GitHub 에서 설치)
pip install requests python-dotenv
pip install "git+https://github.com/odumag99/pynamuh.git"
```

> `pip install -e .` (pyproject.toml 사용)도 가능하지만, pynamuh 는 GitHub 의존성
> 이라 위처럼 명시적으로 설치하는 편이 확실합니다.

3) **NH DLL 배치** — pynamuh README 안내에 따라 `wmca.dll` 등 NH OpenAPI DLL 을
   pynamuh 설치 경로의 `dll/` 폴더에 복사합니다.

```
<site-packages>\pynamuh\dll\*.dll   ← 여기에 NH DLL 복사
```

---

## 설정

`.env.example` 을 복사해 `.env` 를 만들고 값을 채웁니다.

```powershell
Copy-Item .env.example .env
notepad .env
```

| 변수 | 설명 |
|------|------|
| `SUPABASE_URL` | 본인 Supabase 프로젝트 URL |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role 키. **RLS 를 우회**하므로 지정 사용자 대신 쓸 수 있음. PC 밖으로 유출 금지 |
| `DASHBOARD_USER_ID` | 데이터를 기록할 웹 대시보드 로그인 계정의 auth UUID |
| `NH_ID` / `NH_PW` / `NH_CERT_PW` | NH 로그인 ID / 비밀번호 / 인증서 비밀번호 |
| `NH_ACCOUNT_NO` | 계좌번호 |
| `NH_ACCOUNT_PW` | 계좌 비밀번호(평문, PC 안에서만 해시 처리) |
| `NH_ACCOUNT_INDEX` (선택) | 계좌가 여러 개일 때 인덱스(1부터). 기본 1 |
| `NH_ACCOUNT_NAME` (선택) | DB 의 account_name 표시값. 미지정 시 계좌번호 사용 |

---

## 실행

```powershell
# 실제 동기화 (Windows, NH 로그인 + DB push)
python bridge.py

# 매핑만 확인 (DB push 없음). 어떤 OS 에서도 동작.
python bridge.py --dry-run

# 저장해 둔 c8201 응답 JSON 으로 매핑 확인
python bridge.py --dry-run --sample sample_c8201.json
```

동작:
1. NH 로그인 → c8201(주식잔고) 조회.
2. `holdings_cache` 컬럼 형태로 매핑(`broker='nhInvestment'`, `market='krStock'`,
   `currency='krw'`).
3. PostgREST 로 **upsert**(`on_conflict=user_id,broker,account_name,symbol`,
   `Prefer: resolution=merge-duplicates`) 후, 이번 조회에 없는 종목 행을 **삭제**해
   청산된 종목이 대시보드에서 사라지도록 합니다.

### 테스트

```bash
python test_mapping.py     # pytest 없이도 실행됨
# 또는
pytest test_mapping.py
```

---

## 주기적 실행 (Windows 작업 스케줄러)

장중에 자동으로 잔고를 동기화하려면 **작업 스케줄러(Task Scheduler)** 에 등록합니다.

1. `Win + R` → `taskschd.msc` 실행.
2. **작업 만들기(Create Task)** 클릭.
3. **일반** 탭: 이름 `nh-bridge`, "사용자가 로그온할 때만 실행" 선택(인증서/콘솔
   접근을 위해 보통 대화형 세션이 필요).
4. **트리거** 탭: 새로 만들기 → 예: "매일", 반복 간격 30분, 기간 8시간(장중).
5. **동작** 탭: 새로 만들기 →
   - 프로그램/스크립트: `C:\경로\nh-bridge\.venv\Scripts\python.exe`
   - 인수 추가: `bridge.py`
   - 시작 위치: `C:\경로\nh-bridge`
6. 저장.

> 또는 아래 같은 배치파일(`run.bat`)을 만들어 동작에 등록해도 됩니다.

```bat
@echo off
cd /d C:\경로\nh-bridge
call .venv\Scripts\activate
python bridge.py
```

명령줄로 등록하려면(관리자 PowerShell):

```powershell
schtasks /Create /TN "nh-bridge" /SC MINUTE /MO 30 ^
  /TR "C:\경로\nh-bridge\run.bat" /RL LIMITED
```

---

## 참고

- pynamuh: https://github.com/odumag99/pynamuh (MIT, 비공식 NH 래퍼)
- c8201 = 주식잔고조회 TR. 본 브릿지는 `c8201OutBlock`(예수금)과
  `c8201OutBlock1`(보유종목 반복)을 사용합니다.
