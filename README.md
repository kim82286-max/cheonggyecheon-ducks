# 🦆 청계천 아기오리 트래커

청계천 아기오리를 발견하면 위치와 사진을 공유하는 커뮤니티 웹앱

## 배포 방법

### 1. Supabase 테이블 만들기

Supabase 대시보드 → **SQL Editor** 에서 아래 쿼리를 실행하세요:

```sql
-- 제보 테이블
create table sightings (
  id bigint generated always as identity primary key,
  landmark_id int not null,
  landmark_name text not null,
  duck_count int not null default 5,
  comment text not null,
  username text default '익명',
  photo_url text,
  likes int default 0,
  created_at timestamptz default now()
);

-- 누구나 읽기 가능
alter table sightings enable row level security;
create policy "누구나 읽기 가능" on sightings for select using (true);
create policy "누구나 쓰기 가능" on sightings for insert with check (true);
create policy "누구나 좋아요 가능" on sightings for update using (true);

-- 사진 저장소
insert into storage.buckets (id, name, public) values ('duck-photos', 'duck-photos', true);
create policy "누구나 사진 업로드" on storage.objects for insert with check (bucket_id = 'duck-photos');
create policy "누구나 사진 보기" on storage.objects for select using (bucket_id = 'duck-photos');
```

### 2. Vercel 배포

1. 이 코드를 GitHub 저장소에 push
2. [vercel.com](https://vercel.com) → **Add New Project** → GitHub 저장소 선택
3. **Environment Variables** 에 추가:
   - `NEXT_PUBLIC_SUPABASE_URL` → Supabase Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Supabase anon public key
4. **Deploy** 클릭!

## 기술 스택

- Next.js 14 (App Router)
- Supabase (DB + Storage)
- Vercel (배포)
