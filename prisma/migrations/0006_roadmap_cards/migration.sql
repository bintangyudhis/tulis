-- Roadmap goals menjadi kartu per hari dengan banyak butir per hari,
-- dan rentang roadmap bebas per goal (lintas bulan, sampai 366 hari).
ALTER TABLE "PlannerGoal" ADD COLUMN "roadmapStart" TEXT;
ALTER TABLE "PlannerGoal" ADD COLUMN "roadmapDays" INTEGER;

CREATE TABLE "PlannerGoalDayItem" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "sort" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "PlannerGoalDayItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PlannerGoalDayItem_goalId_date_idx" ON "PlannerGoalDayItem"("goalId", "date");
ALTER TABLE "PlannerGoalDayItem" ENABLE ROW LEVEL SECURITY;

-- Pindahkan rencana lama (satu teks per hari) menjadi butir pertama hari itu.
INSERT INTO "PlannerGoalDayItem" ("id", "goalId", "date", "text", "done", "sort")
SELECT "id", "goalId", "date", "text", "done", 0 FROM "PlannerGoalDay" WHERE "text" <> '';

DROP TABLE "PlannerGoalDay";
