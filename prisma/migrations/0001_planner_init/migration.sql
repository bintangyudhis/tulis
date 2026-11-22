-- Tulis (planner pribadi): semua tabel berawalan Planner karena database
-- Supabase `dompetku` dipakai bersama repo lain.
CREATE TABLE "PlannerUser" (
  "id" TEXT NOT NULL,
  "username" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlannerUser_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PlannerUser_username_key" ON "PlannerUser"("username");

CREATE TABLE "PlannerSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlannerSession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PlannerSession_userId_idx" ON "PlannerSession"("userId");

ALTER TABLE "PlannerSession" ADD CONSTRAINT "PlannerSession_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "PlannerUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "PlannerSchedule" (
  "id" TEXT NOT NULL,
  "day" INTEGER NOT NULL,
  "kind" TEXT NOT NULL,
  "period" TEXT,
  "time" TEXT,
  "text" TEXT NOT NULL,
  "done" BOOLEAN NOT NULL DEFAULT false,
  "sort" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlannerSchedule_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PlannerSchedule_day_kind_sort_idx" ON "PlannerSchedule"("day", "kind", "sort");

CREATE TABLE "PlannerGymDay" (
  "day" INTEGER NOT NULL,
  "isRest" BOOLEAN NOT NULL DEFAULT false,
  "note" TEXT,
  CONSTRAINT "PlannerGymDay_pkey" PRIMARY KEY ("day")
);

CREATE TABLE "PlannerGymItem" (
  "id" TEXT NOT NULL,
  "day" INTEGER NOT NULL,
  "text" TEXT NOT NULL,
  "detail" TEXT,
  "sort" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlannerGymItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PlannerGymItem_day_sort_idx" ON "PlannerGymItem"("day", "sort");

CREATE TABLE "PlannerGoal" (
  "id" TEXT NOT NULL,
  "month" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "done" BOOLEAN NOT NULL DEFAULT false,
  "sort" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlannerGoal_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PlannerGoal_month_sort_idx" ON "PlannerGoal"("month", "sort");

CREATE TABLE "PlannerMark" (
  "date" TEXT NOT NULL,
  "color" TEXT NOT NULL,
  "note" TEXT NOT NULL,
  "reminder" TEXT NOT NULL DEFAULT 'none',
  CONSTRAINT "PlannerMark_pkey" PRIMARY KEY ("date")
);

CREATE TABLE "PlannerNote" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlannerNote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PlannerNote_updatedAt_idx" ON "PlannerNote"("updatedAt");

-- Seed pengguna awal: username admin, sandi sesuai permintaan pemilik
-- (hash bcrypt, bukan teks asli). Ganti lewat menu Pengaturan.
INSERT INTO "PlannerUser" ("id", "username", "passwordHash")
VALUES ('seed-admin', 'admin', '$2b$10$TvYJ2F/ki0oSzogh.bf6betuAk61r9pnxX4nIJHXAkyqRNCqET3rO');

-- Seed jadwal contoh hari Senin dari pemilik.
INSERT INTO "PlannerSchedule" ("id", "day", "kind", "period", "text", "sort") VALUES
  ('seed-sch-g1', 1, 'general', 'pagi', 'Bersihin kost', 0),
  ('seed-sch-g2', 1, 'general', 'siang', 'Main', 1),
  ('seed-sch-g3', 1, 'general', 'sore', 'Ngerjain produk digital', 2),
  ('seed-sch-g4', 1, 'general', 'malam', 'Livestream', 3),
  ('seed-sch-t1', 1, 'todo', NULL, 'Bersihin rumah', 0),
  ('seed-sch-j1', 1, 'time', NULL, 'Bangun', 0),
  ('seed-sch-j2', 1, 'time', NULL, 'Mandi', 1);

UPDATE "PlannerSchedule" SET "time" = '07:00' WHERE "id" = 'seed-sch-j1';
UPDATE "PlannerSchedule" SET "time" = '07:30' WHERE "id" = 'seed-sch-j2';

-- Seed hari gym: semua hari bukan istirahat, gerakan diisi pemilik.
INSERT INTO "PlannerGymDay" ("day", "isRest") VALUES (1, false), (2, false), (3, false), (4, false), (5, false), (6, false), (7, true);
