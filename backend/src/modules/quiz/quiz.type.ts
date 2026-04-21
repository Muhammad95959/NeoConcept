import { QuestionType } from "../../generated/prisma/client";

export interface GetQuizzesInput {
  courseId: string;
  userId: string;
  role: string;
  search?: string;
}

export interface GetQuizInput {
  courseId: string;
  id: string;
  userId: string;
  role: string;
}

export interface OptionInput {
  text: string;
  isCorrect?: boolean;
}

export interface QuestionInput {
  questionText: string;
  type?: QuestionType;
  order?: number;
  options?: OptionInput[];
}

export interface CreateQuizInputService {
  courseId: string;
  userId: string;
  title: string;
  description?: string;
  durationMinutes: number;
  isPublished?: boolean;
  questions?: QuestionInput[];
}

export interface UpdateQuizInputService {
  courseId: string;
  id: string;
  userId: string;
  title?: string;
  description?: string;
  durationMinutes?: number;
  isPublished?: boolean;
  // Intentionally leaving out questions update for complex nested logic unless specifically handled
}

export interface DeleteQuizInput {
  courseId: string;
  id: string;
  userId: string;
}

// ── Attempt & Submission ──────────────────────────────────────────────────────

export interface AnswerInput {
  questionId: string;
  selectedOptionId?: string;
  textAnswer?: string;
}

export interface StartAttemptInput {
  courseId: string;
  quizId: string;
  studentId: string;
}

export interface SubmitAttemptInput {
  courseId: string;
  quizId: string;
  studentId: string;
  answers: AnswerInput[];
}

export interface GetMyAttemptInput {
  quizId: string;
  studentId: string;
}

export interface GetAttemptsInput {
  courseId: string;
  quizId: string;
}

export interface ManualGradeInput {
  attemptId: string;
  score: number;
}

export interface DeleteAttemptInput {
  attemptId: string;
  quizId: string;
}
