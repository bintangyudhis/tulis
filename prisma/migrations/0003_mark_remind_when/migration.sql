-- Waktu pengingat tanda kalender: pagi (hari-H) atau sebelum (5 jam sebelum).
ALTER TABLE "PlannerMark" ADD COLUMN "remindWhen" TEXT NOT NULL DEFAULT 'pagi';
