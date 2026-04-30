# Instructor Dashboard Analytics API Specification

This document outlines the required backend endpoint for the Instructor Analytics Dashboard. The frontend relies on this single endpoint to render performance metrics, enrollment trends, and student engagement graphs without heavy client-side computation.

---

## 1. Endpoint Details

- **Route:** `GET /api/v1/courses/:courseId/analytics`
- **Method:** `GET`
- **Authentication:** Required (Bearer Token)
- **Authorization:** Only the Instructor or Assistant assigned to this `courseId` should be able to access this data.

---

## 2. Expected Calculation Logic (Backend Requirements)

To ensure frontend performance, all aggregations **must** be done at the database level.
1. **`totalStudents`**: `COUNT` of distinct users enrolled in the course.
2. **`activeStudentsThisWeek`**: `COUNT` of enrolled users who have generated any activity (e.g., viewed a lesson, took a quiz, posted a message) in the last 7 days.
3. **`averageCompletionRate`**: The average of `(completedModules / totalModules) * 100` across all enrolled students.
4. **`averageQuizScore`**: The overall average score of all graded quiz attempts for quizzes associated with this `courseId`.
5. **`enrollmentTrend`**: A grouped count of new enrollments by `createdAt` date for the last 30 days.
6. **`quizPerformance`**: A list of all quizzes in the course, alongside the average score achieved on each specific quiz.

---

## 3. Expected JSON Response

The frontend expects an HTTP `200 OK` response matching the following strict JSON schema:

```json
{
  "status": "success",
  "data": {
    "overview": {
      "totalStudents": 156,
      "activeStudentsThisWeek": 42,
      "averageCompletionRate": 45.5,
      "averageQuizScore": 78.2
    },
    "enrollmentTrend": [
      {
        "date": "2026-04-24",
        "count": 2
      },
      {
        "date": "2026-04-25",
        "count": 5
      },
      {
        "date": "2026-04-26",
        "count": 0
      }
      // ... up to 30 days of data
    ],
    "quizPerformance": [
      {
        "quizId": "60d5ecb8b392d700155b8e9a",
        "quizTitle": "Introduction to Flutter Basics",
        "averageScore": 88.5,
        "totalAttempts": 140
      },
      {
        "quizId": "60d5ecb8b392d700155b8e9b",
        "quizTitle": "Advanced State Management",
        "averageScore": 54.2,
        "totalAttempts": 125
      }
    ],
    "communityEngagement": {
      "messagesThisWeek": 340,
      "mostActiveStudent": {
        "userId": "5f8f8c44b54764421b7156d3",
        "userName": "JohnDoe",
        "messageCount": 45
      }
    }
  }
}
```

---

## 4. Error Responses

**401 Unauthorized**
```json
{
  "status": "error",
  "message": "Authentication token is missing or invalid."
}
```

**403 Forbidden**
```json
{
  "status": "error",
  "message": "You do not have permission to view analytics for this course."
}
```

**404 Not Found**
```json
{
  "status": "error",
  "message": "Course not found."
}
```
