-- CreateTable
CREATE TABLE "Provider" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "specialization" TEXT NOT NULL,
    "experience" TEXT NOT NULL,
    "image" TEXT,
    "availability" TEXT,
    "price" INTEGER NOT NULL,
    "trustScore" INTEGER NOT NULL,
    "totalAssignments" INTEGER NOT NULL,
    "completedAssignments" INTEGER NOT NULL,
    "onTimeCount" INTEGER NOT NULL,
    "frequentClientCount" INTEGER NOT NULL,
    "emergencyAvailable" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Provider_pkey" PRIMARY KEY ("id")
);
