import { Router } from "express";
import { getInstructorAnalytics, getStudentAnalytics } from "./analytics.controller";
import { protect } from "../../middlewares/protect";
import verifyCourseMember from "../../middlewares/verifyCourseMember";
import { restrict } from "../../middlewares/restrict";

const router = Router({ mergeParams: true });

router.use(protect);
router.use(verifyCourseMember);

router.get("/", restrict("INSTRUCTOR", "ASSISTANT"), getInstructorAnalytics);
router.get("/student", restrict("STUDENT"), getStudentAnalytics);

export default router;
