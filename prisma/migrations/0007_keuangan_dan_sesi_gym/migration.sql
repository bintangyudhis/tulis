-- Nama sesi gym + modul keuangan pribadi.
ALTER TABLE "PlannerGymDay" ADD COLUMN "title" TEXT;

CREATE TABLE "PlannerMoneyTx" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "recurringId" TEXT,
    "period" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlannerMoneyTx_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PlannerMoneyTx_recurringId_period_key" ON "PlannerMoneyTx"("recurringId", "period");
CREATE INDEX "PlannerMoneyTx_date_idx" ON "PlannerMoneyTx"("date");
ALTER TABLE "PlannerMoneyTx" ENABLE ROW LEVEL SECURITY;

CREATE TABLE "PlannerMoneyRule" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "day" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlannerMoneyRule_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "PlannerMoneyRule" ENABLE ROW LEVEL SECURITY;

CREATE TABLE "PlannerMoneyShortcut" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" INTEGER,
    "sort" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "PlannerMoneyShortcut_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PlannerMoneyShortcut_kind_sort_idx" ON "PlannerMoneyShortcut"("kind", "sort");
ALTER TABLE "PlannerMoneyShortcut" ENABLE ROW LEVEL SECURITY;

CREATE TABLE "PlannerMoneySkip" (
    "id" TEXT NOT NULL,
    "recurringId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    CONSTRAINT "PlannerMoneySkip_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PlannerMoneySkip_recurringId_period_key" ON "PlannerMoneySkip"("recurringId", "period");
ALTER TABLE "PlannerMoneySkip" ENABLE ROW LEVEL SECURITY;

INSERT INTO "PlannerMoneyShortcut" ("id", "kind", "name", "amount", "sort") VALUES
  ('seed-galon', 'out', 'Galon', NULL, 0),
  ('seed-laundry', 'out', 'Laundry', NULL, 1),
  ('seed-bensin', 'out', 'Bensin', NULL, 2);
