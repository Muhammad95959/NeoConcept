import { Request, Response, NextFunction } from "express";
import { AnalyticsService } from "./analytics.service";
import { HTTPStatusText } from "../../types/HTTPStatusText";

export const getInstructorAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId } = req.params;
    const userId = res.locals.user.id;

    const data = await AnalyticsService.getInstructorAnalytics(courseId as string, userId);
    res.status(200).json({ status: HTTPStatusText.SUCCESS, data });
  } catch (error: any) {
    if (error.message === "Forbidden") {
      res.status(403).json({ status: HTTPStatusText.FAIL, message: "You do not have permission to view analytics for this course." });
    } else {
      next(error);
    }
  }
};

export const getStudentAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId } = req.params;
    const userId = res.locals.user.id;

    const data = await AnalyticsService.getStudentAnalytics(courseId as string, userId);
    res.status(200).json({ status: HTTPStatusText.SUCCESS, data });
  } catch (error: any) {
    if (error.message === "Forbidden") {
      res.status(403).json({ status: HTTPStatusText.FAIL, message: "Only enrolled students can view this." });
    } else {
      next(error);
    }
  }
};
