-- Tugas dengan tenggat + log pengingat deadline.
CREATE TABLE "PlannerTask" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "deadline" TIMESTAMP(3) NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PlannerTask_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PlannerTask_deadline_idx" ON "PlannerTask"("deadline");

CREATE TABLE "PlannerReminderLog" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "threshold" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlannerReminderLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PlannerReminderLog_taskId_threshold_key" ON "PlannerReminderLog"("taskId", "threshold");
CREATE INDEX "PlannerReminderLog_taskId_idx" ON "PlannerReminderLog"("taskId");
