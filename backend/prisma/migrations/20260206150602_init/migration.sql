-- CreateEnum
CREATE TYPE "ProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'ERROR');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'MINING', 'JUDGING', 'ANALYZING', 'SHADOW_ANALYSIS', 'SYNTHESIZING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('user', 'assistant', 'system');

-- CreateEnum
CREATE TYPE "MiuSource" AS ENUM ('COSMIC', 'PSYCHOMETRIC', 'NARRATIVE', 'INTERACTION');

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "birth_date" TIMESTAMP(3) NOT NULL,
    "birth_time" TEXT NOT NULL,
    "birth_place" TEXT NOT NULL,
    "birth_city" TEXT,
    "birth_state" TEXT,
    "birth_country" TEXT,
    "birth_timezone" TEXT,
    "birth_latitude" DOUBLE PRECISION,
    "birth_longitude" DOUBLE PRECISION,
    "astro_map_raw" JSONB,
    "psychometric_answers" JSONB,
    "narrative_decisive_moment" TEXT,
    "narrative_frustration" TEXT,
    "narrative_dream" TEXT,
    "higher_self_profile" JSONB,
    "processing_status" "ProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "processing_job_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processing_jobs" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "current_node" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error_log" JSONB,
    "miner_output" JSONB,
    "judge_output" JSONB,
    "psycho_output" JSONB,
    "shadow_output" JSONB,
    "synthesizer_output" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "processing_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mius" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "source" "MiuSource" NOT NULL,
    "raw_data" TEXT NOT NULL,
    "interpretation" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "is_validated" BOOLEAN NOT NULL DEFAULT false,
    "validation_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mius_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_user_id_key" ON "profiles"("user_id");

-- CreateIndex
CREATE INDEX "chat_messages_profile_id_created_at_idx" ON "chat_messages"("profile_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "processing_jobs_status_idx" ON "processing_jobs"("status");

-- CreateIndex
CREATE INDEX "mius_profile_id_idx" ON "mius"("profile_id");

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processing_jobs" ADD CONSTRAINT "processing_jobs_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mius" ADD CONSTRAINT "mius_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
