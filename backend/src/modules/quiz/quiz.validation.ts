import { z } from "zod";
import { QuestionType } from "../../generated/prisma/client";

export class QuizValidationSchemas {
  static getManyQuery = z.object({
    search: z.string().optional(),
  });

  static courseIdParams = z.object({
    courseId: z.string().uuid("Invalid course ID"),
  });

  static idParams = z.object({
    courseId: z.string().uuid("Invalid course ID"),
    id: z.string().uuid("Invalid quiz ID"),
  });

  static quizIdParams = z.object({
    courseId: z.string().uuid("Invalid course ID"),
    quizId: z.string().uuid("Invalid quiz ID"),
  });

  static attemptIdParams = z.object({
    courseId: z.string().uuid("Invalid course ID"),
    quizId: z.string().uuid("Invalid quiz ID"),
    attemptId: z.string().uuid("Invalid attempt ID"),
  });

  static optionSchema = z.object({
    text: z.string().min(1, "Option text cannot be empty").trim(),
    isCorrect: z.boolean().optional().default(false),
  });

  static questionSchema = z.object({
    questionText: z.string().min(1, "Question text cannot be empty").trim(),
    type: z.nativeEnum(QuestionType).optional(),
    order: z.number().int().optional().default(0),
    options: z.array(this.optionSchema).optional(),
  });

  static createBody = z.object({
    title: z.string().min(1).max(255).trim(),
    description: z.string().trim().optional(),
    durationMinutes: z.number().int().min(1, "Duration must be at least 1 minute"),
    isPublished: z.boolean().optional().default(false),
    questions: z.array(this.questionSchema).optional(),
  });

  static updateBody = z
    .object({
      title: z.string().min(1).max(255).trim().optional(),
      description: z.string().trim().optional(),
      durationMinutes: z.number().int().min(1).optional(),
      isPublished: z.boolean().optional(),
    })
    .refine(
      (data) =>
        data.title !== undefined ||
        data.description !== undefined ||
        data.durationMinutes !== undefined ||
        data.isPublished !== undefined,
      {
        message: "At least one field (title, description, durationMinutes, isPublished) is required to update",
      }
    );

  static submitAttemptBody = z.object({
    answers: z
      .array(
        z
          .object({
            questionId: z.string().uuid("Invalid question ID"),
            selectedOptionId: z.string().uuid("Invalid option ID").optional(),
            textAnswer: z.string().trim().optional(),
          })
          .refine((d) => d.selectedOptionId !== undefined || d.textAnswer !== undefined, {
            message: "Each answer must include either selectedOptionId or textAnswer",
          })
      )
      .min(1, "At least one answer is required"),
  });

  static manualGradeBody = z.object({
    score: z.number().min(0, "Score cannot be negative").max(100, "Score cannot exceed 100"),
  });
}

export type GetManyQuery = z.infer<typeof QuizValidationSchemas.getManyQuery>;
export type CourseIdParams = z.infer<typeof QuizValidationSchemas.courseIdParams>;
export type IdParams = z.infer<typeof QuizValidationSchemas.idParams>;
export type QuizIdParams = z.infer<typeof QuizValidationSchemas.quizIdParams>;
export type AttemptIdParams = z.infer<typeof QuizValidationSchemas.attemptIdParams>;
export type CreateQuizBody = z.infer<typeof QuizValidationSchemas.createBody>;
export type UpdateQuizBody = z.infer<typeof QuizValidationSchemas.updateBody>;
export type SubmitAttemptBody = z.infer<typeof QuizValidationSchemas.submitAttemptBody>;
export type ManualGradeBody = z.infer<typeof QuizValidationSchemas.manualGradeBody>;
