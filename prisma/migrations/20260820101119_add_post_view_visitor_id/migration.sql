-- Add the anonymous first-party identity used for distinct visitor analytics.
ALTER TABLE "PostView" ADD COLUMN "visitorId" TEXT;

CREATE INDEX "PostView_visitorId_viewedAt_idx" ON "PostView"("visitorId", "viewedAt");
