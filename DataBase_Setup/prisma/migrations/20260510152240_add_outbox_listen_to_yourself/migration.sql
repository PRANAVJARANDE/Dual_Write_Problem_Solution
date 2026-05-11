-- CreateTable
CREATE TABLE "Outbox_Listen_To_yourself" (
    "id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "simulationMode" TEXT NOT NULL DEFAULT 'PROBABILISTIC',
    "failureRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "requestIndex" INTEGER,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Outbox_Listen_To_yourself_pkey" PRIMARY KEY ("id")
);
