-- ตาราง accounts (รายชื่อคน + บัญชี) — รันใน Supabase > SQL Editor
-- ใช้โปรเจกต์เดียวกับ task-tracker ได้เลย (คนละตาราง ไม่ชนกัน)

create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  nickname   text,            -- ชื่อเรียก (ไม่บังคับ)
  fullname   text not null,   -- ชื่อจริง-สกุล
  bank       text,            -- ธนาคาร
  account_no text,            -- เลขบัญชี
  created_at timestamptz default now()
);

-- RLS: เฉพาะคน login แล้วเท่านั้นอ่าน/เขียนได้ (เลขบัญชีคนจริง — ห้ามเปิด public)
alter table accounts enable row level security;
drop policy if exists "auth all" on accounts;
create policy "auth all" on accounts for all to authenticated using (true) with check (true);
