-- 투자 모아보기 웹 — 초기 스키마
-- 모든 테이블은 RLS 로 "본인 행만" 접근하도록 잠근다.
-- auth.users 는 Supabase Auth 가 관리한다.
--
-- 이 스크립트는 재실행해도 안전하다(idempotent):
--   - 테이블/인덱스: create ... if not exists
--   - 정책: drop policy if exists → create policy

-- ============================================================
-- profiles : 사용자 프로필 (auth.users 1:1)
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "본인 프로필 조회" on public.profiles;
create policy "본인 프로필 조회" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "본인 프로필 수정" on public.profiles;
create policy "본인 프로필 수정" on public.profiles
  for update using (auth.uid() = id);
drop policy if exists "본인 프로필 생성" on public.profiles;
create policy "본인 프로필 생성" on public.profiles
  for insert with check (auth.uid() = id);

-- 신규 가입 시 프로필 자동 생성
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- api_credentials : 증권사/거래소 API 키 (암호화 저장)
--   secret_enc 컬럼들은 앱 서버가 AES-256-GCM 으로 암호화한 문자열.
--   DB 평문 저장 금지.
-- ============================================================
create table if not exists public.api_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  broker text not null,          -- 'upbit' | 'kis' | 'tossSecurities' | 'finnhub' | 'ecos' | 'nhInvestment'
  label text,                    -- 사용자 지정 별칭
  -- 암호화된 자격증명(JSON 문자열을 통째로 암호화). 키 종류는 broker 마다 다름.
  secret_enc text not null,
  -- 토큰 캐시(OAuth2/KIS 접근토큰). 만료시간과 함께 보관, 평문 아님(암호화 저장).
  token_cache_enc text,
  token_expires_at timestamptz,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, broker, label)
);

create index if not exists api_credentials_user_idx
  on public.api_credentials (user_id);

alter table public.api_credentials enable row level security;

drop policy if exists "본인 자격증명 조회" on public.api_credentials;
create policy "본인 자격증명 조회" on public.api_credentials
  for select using (auth.uid() = user_id);
drop policy if exists "본인 자격증명 삽입" on public.api_credentials;
create policy "본인 자격증명 삽입" on public.api_credentials
  for insert with check (auth.uid() = user_id);
drop policy if exists "본인 자격증명 수정" on public.api_credentials;
create policy "본인 자격증명 수정" on public.api_credentials
  for update using (auth.uid() = user_id);
drop policy if exists "본인 자격증명 삭제" on public.api_credentials;
create policy "본인 자격증명 삭제" on public.api_credentials
  for delete using (auth.uid() = user_id);

-- ============================================================
-- asset_snapshots : 일별 총자산 스냅샷 (추이/기간 분석 기반)
-- ============================================================
create table if not exists public.asset_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  snapshot_date date not null,
  total_value_krw double precision not null,
  principal_krw double precision not null,
  created_at timestamptz not null default now(),
  unique (user_id, snapshot_date)
);

create index if not exists asset_snapshots_user_date_idx
  on public.asset_snapshots (user_id, snapshot_date);

alter table public.asset_snapshots enable row level security;

drop policy if exists "본인 스냅샷 조회" on public.asset_snapshots;
create policy "본인 스냅샷 조회" on public.asset_snapshots
  for select using (auth.uid() = user_id);
drop policy if exists "본인 스냅샷 삽입" on public.asset_snapshots;
create policy "본인 스냅샷 삽입" on public.asset_snapshots
  for insert with check (auth.uid() = user_id);
drop policy if exists "본인 스냅샷 수정" on public.asset_snapshots;
create policy "본인 스냅샷 수정" on public.asset_snapshots
  for update using (auth.uid() = user_id);

-- ============================================================
-- holdings_cache : 최근 조회된 보유 종목 스냅샷 (NH 브릿지 포함 모든 소스 공용)
--   웹은 실시간 조회를 우선하되, NH 처럼 PC 브릿지가 밀어넣는 소스는 여기에 UPSERT 한다.
-- ============================================================
create table if not exists public.holdings_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  broker text not null,
  account_name text not null,
  symbol text not null,
  name text not null,
  market text not null,         -- 'crypto' | 'usStock' | 'krStock'
  quantity double precision not null,
  average_cost double precision not null,
  current_price double precision not null,
  currency text not null,       -- 'krw' | 'usd'
  synced_at timestamptz not null default now(),
  unique (user_id, broker, account_name, symbol)
);

create index if not exists holdings_cache_user_idx
  on public.holdings_cache (user_id, broker);

alter table public.holdings_cache enable row level security;

drop policy if exists "본인 보유종목 조회" on public.holdings_cache;
create policy "본인 보유종목 조회" on public.holdings_cache
  for select using (auth.uid() = user_id);
drop policy if exists "본인 보유종목 삽입" on public.holdings_cache;
create policy "본인 보유종목 삽입" on public.holdings_cache
  for insert with check (auth.uid() = user_id);
drop policy if exists "본인 보유종목 수정" on public.holdings_cache;
create policy "본인 보유종목 수정" on public.holdings_cache
  for update using (auth.uid() = user_id);
drop policy if exists "본인 보유종목 삭제" on public.holdings_cache;
create policy "본인 보유종목 삭제" on public.holdings_cache
  for delete using (auth.uid() = user_id);
