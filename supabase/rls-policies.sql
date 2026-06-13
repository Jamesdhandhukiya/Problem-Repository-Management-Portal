-- Supabase RLS policies for Problem Repository & Analytics Portal
-- Run this in Supabase SQL Editor after prisma migrate

-- Enable RLS on all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Topic" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subtopic" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Question" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Bookmark" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SolvedQuestion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS; app uses Prisma with direct DB connection.
-- These policies protect Supabase Data API access if enabled.

CREATE POLICY "Topics are viewable by authenticated users"
  ON "Topic" FOR SELECT TO authenticated USING (true);

CREATE POLICY "Subtopics are viewable by authenticated users"
  ON "Subtopic" FOR SELECT TO authenticated USING (true);

CREATE POLICY "Published questions viewable by authenticated"
  ON "Question" FOR SELECT TO authenticated
  USING (status = 'PUBLISHED');

CREATE POLICY "Users can view own notifications"
  ON "Notification" FOR SELECT TO authenticated
  USING (
    "userId" IN (
      SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text
    )
  );

CREATE POLICY "Users can update own notifications"
  ON "Notification" FOR UPDATE TO authenticated
  USING (
    "userId" IN (
      SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text
    )
  );

-- Storage bucket for question attachments (optional)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('question-attachments', 'question-attachments', false);
