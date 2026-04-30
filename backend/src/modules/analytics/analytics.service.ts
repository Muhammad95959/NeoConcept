import prisma from "../../config/db";

export class AnalyticsService {
  static async getInstructorAnalytics(courseId: string, userId: string) {
    // 2. Data fetching (concurrently)
    const [totalStudents, activeStudentsResult, enrollmentTrend, quizPerformance, messagesThisWeek, mostActiveResult] = await Promise.all([
      // totalStudents
      prisma.userCourse.count({ where: { courseId, roleInCourse: "STUDENT", deletedAt: null } }),
      
      // activeStudentsThisWeek
      prisma.$queryRaw<any[]>`
        SELECT COUNT(DISTINCT "userId")::int as active_count FROM (
          SELECT "studentId" as "userId" FROM "quiz_attempts" qa
          JOIN "quizzes" q ON qa."quizId" = q."id"
          WHERE q."courseId" = ${courseId} AND qa."startedAt" >= NOW() - INTERVAL '7 days'
          UNION
          SELECT "userId" FROM "community_messages"
          WHERE "courseId" = ${courseId} AND "createdAt" >= NOW() - INTERVAL '7 days'
        ) AS active_users;
      `,

      // enrollmentTrend
      prisma.$queryRaw<any[]>`
        SELECT DATE_TRUNC('day', "joinedAt") as date, COUNT(*)::int as count
        FROM "user_courses"
        WHERE "courseId" = ${courseId} 
          AND "roleInCourse" = 'STUDENT'
          AND "joinedAt" >= NOW() - INTERVAL '30 days'
        GROUP BY date
        ORDER BY date ASC;
      `,

      // quizPerformance & averages
      prisma.$queryRaw<any[]>`
        SELECT 
          q.id as "quizId", 
          q.title as "quizTitle", 
          AVG(qa.score) as "averageScore", 
          COUNT(qa.id)::int as "totalAttempts"
        FROM "quizzes" q
        LEFT JOIN "quiz_attempts" qa ON q.id = qa."quizId"
        WHERE q."courseId" = ${courseId} AND qa.score IS NOT NULL
        GROUP BY q.id, q.title;
      `,

      // messagesThisWeek
      prisma.communityMessage.count({
        where: { courseId, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
      }),

      // mostActiveStudent
      prisma.communityMessage.groupBy({
        by: ['userId'],
        where: { courseId, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 1
      })
    ]);

    let mostActiveStudent = null;
    if (mostActiveResult.length > 0) {
      const topUserId = mostActiveResult[0].userId;
      const user = await prisma.user.findUnique({ where: { id: topUserId }, select: { id: true, username: true } });
      if (user) {
        mostActiveStudent = {
          userId: user.id,
          userName: user.username,
          messageCount: mostActiveResult[0]._count.id
        };
      }
    }

    const activeStudentsThisWeek = activeStudentsResult[0]?.active_count || 0;
    
    // Average Quiz Score & Completion Rate
    let sumAverageScore = 0;
    let completedQuizzes = 0;

    quizPerformance.forEach(q => {
      sumAverageScore += q.averageScore || 0;
    });

    const averageQuizScore = quizPerformance.length > 0 ? (sumAverageScore / quizPerformance.length) : 0;
    
    // Proper average completion rate:
    const completionRateQuery = await prisma.$queryRaw<any[]>`
      SELECT AVG(
        CASE 
          WHEN total_count = 0 THEN 0 
          ELSE completed_count::float / total_count::float 
        END
      ) * 100 as avg_completion
      FROM (
        SELECT uc."userId", 
          (SELECT COUNT(*) FROM "quizzes" WHERE "courseId" = ${courseId}) as total_count,
          (SELECT COUNT(DISTINCT qa."quizId") FROM "quiz_attempts" qa JOIN "quizzes" q ON q.id = qa."quizId" WHERE qa."studentId" = uc."userId" AND q."courseId" = ${courseId} AND qa."completedAt" IS NOT NULL) as completed_count
        FROM "user_courses" uc
        WHERE uc."courseId" = ${courseId} AND uc."roleInCourse" = 'STUDENT'
      ) as sub;
    `;

    const averageCompletionRate = completionRateQuery[0]?.avg_completion || 0;

    return {
      overview: {
        totalStudents,
        activeStudentsThisWeek,
        averageCompletionRate: parseFloat(Number(averageCompletionRate).toFixed(2)),
        averageQuizScore: parseFloat(Number(averageQuizScore).toFixed(2))
      },
      enrollmentTrend: enrollmentTrend.map(e => ({
        date: e.date.toISOString().split('T')[0],
        count: e.count
      })),
      quizPerformance: quizPerformance.map(q => ({
        quizId: q.quizId,
        quizTitle: q.quizTitle,
        averageScore: parseFloat(Number(q.averageScore).toFixed(2)),
        totalAttempts: q.totalAttempts
      })),
      communityEngagement: {
        messagesThisWeek,
        mostActiveStudent
      }
    };
  }

  static async getStudentAnalytics(courseId: string, userId: string) {
    const studentQuizData = await prisma.$queryRaw<any[]>`
      SELECT 
        q.id as "quizId", 
        q.title as "quizTitle", 
        qa.score as "score",
        CASE 
          WHEN qa."completedAt" IS NOT NULL THEN 'COMPLETED'
          WHEN qa."startedAt" IS NOT NULL THEN 'IN_PROGRESS'
          ELSE 'NOT_STARTED'
        END as status
      FROM "quizzes" q
      LEFT JOIN "quiz_attempts" qa ON q.id = qa."quizId" AND qa."studentId" = ${userId}
      WHERE q."courseId" = ${courseId}
      ORDER BY q."createdAt" ASC;
    `;

    let completed = 0;
    let sumScore = 0;
    let scoredCount = 0;

    studentQuizData.forEach(q => {
      if (q.status === 'COMPLETED') completed++;
      if (q.score !== null) {
        sumScore += q.score;
        scoredCount++;
      }
    });

    const completionRate = studentQuizData.length > 0 ? (completed / studentQuizData.length) * 100 : 0;
    const averageQuizScore = scoredCount > 0 ? sumScore / scoredCount : 0;

    const myMessagesThisWeek = await prisma.communityMessage.count({
      where: {
        courseId,
        userId,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }
    });

    const totalMessagesThisWeek = await prisma.communityMessage.count({
      where: {
        courseId,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }
    });

    const totalStudents = await prisma.userCourse.count({ where: { courseId, roleInCourse: "STUDENT", deletedAt: null } });
    const classAverageMessagesThisWeek = totalStudents > 0 ? totalMessagesThisWeek / totalStudents : 0;

    return {
      overview: {
        completionRate: parseFloat(Number(completionRate).toFixed(2)),
        averageQuizScore: parseFloat(Number(averageQuizScore).toFixed(2))
      },
      quizPerformance: studentQuizData.map(q => ({
        quizId: q.quizId,
        quizTitle: q.quizTitle,
        score: q.score,
        status: q.status
      })),
      communityEngagement: {
        myMessagesThisWeek,
        classAverageMessagesThisWeek: parseFloat(Number(classAverageMessagesThisWeek).toFixed(2))
      }
    };
  }
}
