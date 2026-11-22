-- PENGUNCIAN DATABASE BERSAMA (project Supabase dompetku).
-- Mengaktifkan RLS di semua tabel skema public. Tanpa kebijakan,
-- peran anon dan authenticated tidak bisa membaca apa pun; hanya
-- service_role dan pemilik tabel (koneksi Prisma semua aplikasi)
-- yang tetap bisa. Konten portfolio memang publik, jadi enam tabel
-- kontennya diberi kebijakan SELECT untuk anon, dan portfolio_messages
-- hanya boleh ditulisi anon (form kontak), tidak dibaca.
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r.tablename);
  END LOOP;
END $$;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables
           WHERE schemaname = 'public'
             AND tablename IN ('portfolio_certifications','portfolio_experiences','portfolio_profile','portfolio_projects','portfolio_publications','portfolio_skills')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS anon_read ON public.%I;', r.tablename);
    EXECUTE format('CREATE POLICY anon_read ON public.%I FOR SELECT TO anon USING (true);', r.tablename);
  END LOOP;
END $$;

DROP POLICY IF EXISTS anon_insert ON public.portfolio_messages;
CREATE POLICY anon_insert ON public.portfolio_messages FOR INSERT TO anon WITH CHECK (true);

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
