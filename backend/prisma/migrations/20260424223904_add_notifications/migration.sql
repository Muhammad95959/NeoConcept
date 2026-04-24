-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_POST', 'NEW_COMMENT', 'PENDING_STAFF_REQUEST', 'ANSWERED_STAFF_REQUEST', 'PENDING_STUDENT_REQUEST', 'ANSWERED_STUDENT_REQUEST', 'SCHEDULED_MEETING', 'LIVE_MEETING', 'ENDED_MEETING', 'OTHER');

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "data" JSONB,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationRecipient" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "NotificationRecipient_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "NotificationRecipient" ADD CONSTRAINT "NotificationRecipient_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationRecipient" ADD CONSTRAINT "NotificationRecipient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
