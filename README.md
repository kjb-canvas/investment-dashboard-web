# 투자 모아보기 — Web

업비트(코인) + 국내외 증권사 자산을 한 화면에서 모아보는 **웹 투자 대시보드**.
[iOS 앱](https://github.com/ocsmaterialsworkflow-dotcom/investment-dashboard-ios)을 웹으로 포팅한 버전입니다.

- **스택**: Next.js 16 (App Router) · TypeScript · Tailwind 4 · Recharts
- **인증/DB**: Supabase (Auth + Postgres + RLS)
- **성격**: 로그인 후 **본인 API 키를 입력 → 암호화되어 DB 저장 → 같은 기능을 웹에서**

---

## 핵심 설계

| iOS | → | Web |
|-----|---|-----|
| Keychain 키 저장 | → | Postgres 에 **AES-256-GCM 암호화** 저장 + RLS |
| 앱이 직접 API 호출 | → | **Next.js 서버가 프록시** (CORS·키 노출 차단) |
| SwiftData 일별 스냅샷(미완성) | → | Postgres + **서버 크론**으로 자동 스냅샷 |
| 5탭 SwiftUI | → | 홈/분석/배당/추이/포트폴리오 + 설정 |

**보안 원칙**: 증권사 API 키는 브라우저로 절대 내려가지 않습니다. 서버(Route
Handler/Server Action)에서만 마스터키로 복호화해 사용하고, 결과 데이터만
클라이언트로 전달합니다.

### 데이터 소스
| 소스 | 인증 | 상태 |
|------|------|------|
| 업비트 (코인) | Access/Secret (JWT) | ✅ |
| 한국투자증권 (KIS) | AppKey/Secret → 토큰 | ✅ |
| 토스증권 | OAuth2 Client Credentials | ✅ |
| Finnhub | API Key | ✅ |
| 한국은행 ECOS | 인증키 | ✅ |
| NH투자증권 (나무) | Windows WMCA DLL | 🟡 PC 브릿지 전제 (아래 참고) |

### NH투자증권(나무) 연동 방향
NH QV API 는 **Windows DLL 전용**이라 클라우드에서 직접 호출할 수 없습니다.
대신 사용자의 Windows PC 에서 도는 작은 **브릿지 프로그램**
([pynamuh](https://github.com/odumag99/pynamuh) 기반)이 `c8201`(주식잔고조회)로
잔고를 읽어 Supabase `holdings_cache` 에 올려주고, 웹은 그걸 다른 소스처럼 읽기만
합니다. NH 로그인정보·공인인증서는 PC 밖으로 나가지 않습니다. (별도 Phase)

---

## 로컬 실행

```bash
npm install
cp .env.local.example .env.local   # 값 채우기 (아래)
npm run dev                        # http://localhost:3000
```

### 환경변수 (`.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
APP_ENCRYPTION_KEY=...   # 32바이트 base64
CRON_SECRET=...
```
암호화 마스터키 생성:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### DB 마이그레이션
`supabase/migrations/0001_init.sql` 을 Supabase SQL Editor 에 붙여넣어 실행하거나,
Supabase CLI(`supabase db push`)로 적용합니다. 테이블: `profiles`,
`api_credentials`, `asset_snapshots`, `holdings_cache` (모두 RLS 적용).

---

## 스크립트
```bash
npm run dev     # 개발 서버
npm run build   # 프로덕션 빌드
npm test        # vitest (도메인/유스케이스/암호화 단위 테스트)
npm run lint    # eslint
```

---

## 진행 현황
- [x] 프로젝트 셋업 (Next.js + Supabase + Tailwind)
- [x] 도메인·유스케이스 포팅 + 단위 테스트 (손익/배당/추이/비중/총자산)
- [x] API 키 암호화(AES-256-GCM) + 테스트
- [x] Supabase 인증 + 세션 미들웨어 + 로그인/회원가입
- [x] DB 스키마(RLS) + 설정 화면(키 암호화 저장)
- [x] 대시보드 5탭 셸
- [ ] 증권사 API 클라이언트 (업비트/KIS/토스/Finnhub/ECOS) + 서버 프록시
- [ ] 홈·분석·배당·추이·포트폴리오 데이터 연동 + 차트
- [ ] 자동 스냅샷 크론
- [ ] NH 브릿지 (Windows, pynamuh)
