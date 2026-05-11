-- ============================================================
-- SNS KPI管理アプリ — Supabase スキーマ
-- Supabase Dashboard > SQL Editor に貼り付けて実行してください
-- ============================================================

-- ユーザープロフィール（Supabase authと連携）
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  role text not null default 'member', -- 'admin' | 'member'
  created_at timestamptz default now()
);

-- RLS有効化
alter table public.profiles enable row level security;

-- プロフィールはログインユーザー全員が閲覧可能、自分のみ更新可
create policy "profiles_select" on public.profiles for select using (auth.role() = 'authenticated');
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- KPIデータテーブル
create table public.kpi_data (
  id uuid default gen_random_uuid() primary key,
  month text not null,          -- 'YYYY-MM' 形式
  region text not null,         -- '国内' | 'グローバル'
  brand text not null,          -- 'DS' | 'UNY'
  platform text not null,       -- 'X' | 'TikTok' | 'Instagram' | 'YouTube'
  views bigint default 0,
  view_budget bigint default 0,
  followers bigint default 0,
  follower_budget bigint default 0,
  posts integer default 0,
  post_budget integer default 0,
  ad_cost bigint default 0,
  ugc_count integer default 0,
  note text default '',
  updated_by uuid references auth.users,
  updated_at timestamptz default now(),
  created_at timestamptz default now(),
  unique(month, region, brand, platform)
);

alter table public.kpi_data enable row level security;

-- KPIはログインユーザー全員が閲覧・更新可能
create policy "kpi_select" on public.kpi_data for select using (auth.role() = 'authenticated');
create policy "kpi_insert" on public.kpi_data for insert with check (auth.role() = 'authenticated');
create policy "kpi_update" on public.kpi_data for update using (auth.role() = 'authenticated');

-- 更新日時の自動更新
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  new.updated_by = auth.uid();
  return new;
end;
$$ language plpgsql;

create trigger kpi_updated_at
  before update on public.kpi_data
  for each row execute function update_updated_at();

-- 新規ユーザー登録時に自動でprofilesレコードを作成
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', new.email), 'member');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- 初期データ（46期4月分サンプル）
-- ※ 実際のデータに置き換えてください
-- ============================================================
insert into public.kpi_data (month, region, brand, platform, views, view_budget, followers, follower_budget, posts) values
('2026-04', '国内', 'DS', 'X',         38317387, 31797656, 1301147, 1304187, 248),
('2026-04', '国内', 'DS', 'TikTok',    8612446,  19589907, 559608,  559608,  26),
('2026-04', '国内', 'DS', 'Instagram', 15223254, 18721719, 227306,  227225,  30),
('2026-04', '国内', 'DS', 'YouTube',   4204935,  16737479, 56858,   0,       6),
('2026-04', '国内', 'UNY', 'X',        363648,   0,        520650,  0,       389),
('2026-04', '国内', 'UNY', 'TikTok',   0,        0,        0,       0,       0),
('2026-04', '国内', 'UNY', 'Instagram',0,        0,        0,       0,       0),
('2026-04', '国内', 'UNY', 'YouTube',  856317,   0,        6160,    0,       6),
('2026-03', '国内', 'DS', 'X',         22392890, 28906960, 1305033, 1305503, 179),
('2026-03', '国内', 'DS', 'TikTok',    11950208, 17809006, 545415,  545415,  27),
('2026-03', '国内', 'DS', 'Instagram', 4206207,  17019744, 218489,  218408,  39),
('2026-03', '国内', 'DS', 'YouTube',   2698000,  15215890, 52935,   0,       18),
('2026-03', '国内', 'UNY', 'X',        256691,   0,        531789,  0,       163),
('2026-02', '国内', 'DS', 'X',         120000000,43360439, 1310000, 1521011, 240),
('2026-02', '国内', 'DS', 'TikTok',    30000000, 26713509, 555000,  628731,  42),
('2026-02', '国内', 'DS', 'Instagram', 17000000, 25529616, 254000,  267335,  95),
('2026-02', '国内', 'DS', 'YouTube',   3800000,  22823835, 58500,   82622,   62),
('2026-01', '国内', 'DS', 'X',         133558481,43360439, 1337464, 1590084, 256),
('2026-01', '国内', 'DS', 'TikTok',    33314319, 26713509, 566804,  645401,  45),
('2026-01', '国内', 'DS', 'Instagram', 18869886, 25529616, 261016,  276422,  103),
('2026-01', '国内', 'DS', 'YouTube',   4229891,  22823835, 59391,   90082,   69),
('2026-01', '国内', 'UNY', 'X',        2073321,  0,        514782,  0,       56),
('2026-01', '国内', 'UNY', 'TikTok',   167981,   0,        1173,    0,       14),
('2026-01', '国内', 'UNY', 'Instagram',68000,    0,        15455,   0,       13),
('2026-01', '国内', 'UNY', 'YouTube',  1177526,  0,        6341,    0,       8)
on conflict (month, region, brand, platform) do nothing;
