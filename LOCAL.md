# 로컬에서 실행하기 (localhost)

배포 없이 내 컴퓨터에서 `http://localhost:3000` 으로 띄우는 방법.
**코드는 수정할 필요 없습니다.** 환경변수만 채우고 명령어 3개면 됩니다.

## 0. 준비물
- **Node.js 20+** 설치 ([nodejs.org](https://nodejs.org) LTS)
- 이 저장소를 컴퓨터에 받기 (git clone 또는 GitHub "Download ZIP")
- 이미 만들어 둔 **Supabase 프로젝트** (테이블 4개 생성 완료된 상태)

## 1. 환경변수 파일 만들기
프로젝트 루트(=`package.json` 있는 폴더)에 **`.env.local`** 파일을 만들고 아래를 붙여넣기.
`<...>` 부분만 Supabase 대시보드 → Settings → API 값으로 채우세요.

```
NEXT_PUBLIC_SUPABASE_URL=<Project URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public 키>
SUPABASE_SERVICE_ROLE_KEY=<service_role 키>
APP_ENCRYPTION_KEY=<32바이트 base64 키>
CRON_SECRET=<아무 임의 문자열>
```

> `APP_ENCRYPTION_KEY` 는 한 번 정하면 바꾸지 마세요(저장한 API 키 복호화에 쓰임).

## 2. 설치 & 실행
프로젝트 폴더에서 터미널을 열고:
```bash
npm install
npm run dev
```
→ 브라우저에서 **http://localhost:3000** 접속.

## 3. Supabase 로그인 설정 (한 번만)
Supabase 대시보드 → **Authentication → URL Configuration**:
- **Site URL**: `http://localhost:3000`
- **Redirect URLs** 에 추가: `http://localhost:3000/**`

이제 회원가입 → 로그인 → 설정에서 API 키 입력 → 홈에서 자산 확인까지 로컬에서 됩니다.

## 참고
- 자동 스냅샷 크론(`vercel.json`)은 배포(Vercel) 환경에서만 동작합니다. 로컬에서는
  추이 그래프용 스냅샷이 자동으로 쌓이지 않아요(배포하면 매일 자동 기록됨).
- NH(나무) 연동은 별도의 Windows 브릿지가 필요합니다 → `nh-bridge/README.md`.
