-- Roadmap harian per goal bulanan.
CREATE TABLE "PlannerGoalDay" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "text" TEXT NOT NULL DEFAULT '',
    "done" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "PlannerGoalDay_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PlannerGoalDay_goalId_date_key" ON "PlannerGoalDay"("goalId", "date");
CREATE INDEX "PlannerGoalDay_goalId_idx" ON "PlannerGoalDay"("goalId");
