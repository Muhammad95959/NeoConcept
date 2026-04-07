import { CourseModel } from "./course.model";
import { Role } from "../../generated/prisma";
import CustomError from "../../types/customError";
import { HTTPStatusText } from "../../types/HTTPStatusText";
import { ErrorMessages } from "../../types/errorsMessages";
import { SuccessMessages } from "../../types/successMessages";

export class CourseService {
  static async getMany(query: any) {
    const where: any = { deletedAt: null };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ];
    }

    if (query.track) {
      const track = await CourseModel.findTrackById(query.track);
      if (!track) throw new CustomError(ErrorMessages.TRACK_NOT_FOUND, 404, HTTPStatusText.FAIL);
      where.trackId = query.track;
    }

    const courses = await CourseModel.findMany(where);

    return courses.map((course) => ({
      ...course,
      staff: course.courseUsers,
      courseUsers: undefined,
    }));
  }

  static async get(id: string) {
    const course = await CourseModel.findById(id);
    if (!course) throw new CustomError(ErrorMessages.COURSE_NOT_FOUND, 404, HTTPStatusText.FAIL);

    return {
      ...course,
      staff: course.courseUsers,
      courseUsers: undefined,
    };
  }

  static async create(body: {
    name: string;
    description?: string;
    trackId: string;
    instructorIds?: string[];
    assistantIds?: string[];
  }) {
    const { name, description, trackId, instructorIds = [], assistantIds = [] } = body;

    const track = await CourseModel.findTrackById(trackId);
    if (!track) throw new CustomError(ErrorMessages.TRACK_NOT_FOUND, 404, HTTPStatusText.FAIL);

    let instructors: any[] = [];
    if (instructorIds.length > 0) {
      instructors = await CourseModel.findUsersByIds(instructorIds);

      if (instructors.length !== instructorIds.length)
        throw new CustomError(ErrorMessages.INVALID_INSTRUCTOR_IDS, 400, HTTPStatusText.FAIL);

      if (instructors.some((user) => user.role !== Role.INSTRUCTOR))
        throw new CustomError(ErrorMessages.NOT_AN_INSTRUCTOR, 400, HTTPStatusText.FAIL);

      const instructorsAssignedToTrack = await CourseModel.findUsersAssignedToTrack(instructorIds, trackId);
      if (instructorsAssignedToTrack.length !== instructorIds.length)
        throw new CustomError(
          ErrorMessages.INSTRUCTOR_NOT_ASSIGNED_TO_TRACK,
          400,
          HTTPStatusText.FAIL,
        );
    }

    let assistants: any[] = [];
    if (assistantIds.length > 0) {
      assistants = await CourseModel.findUsersByIds(assistantIds);

      if (assistants.length !== assistantIds.length)
        throw new CustomError(ErrorMessages.INVALID_ASSISTANT_IDS, 400, HTTPStatusText.FAIL);

      if (assistants.some((user) => user.role !== Role.ASSISTANT))
        throw new CustomError(ErrorMessages.NOT_AN_ASSISTANT, 400, HTTPStatusText.FAIL);

      const assistantsAssignedToTrack = await CourseModel.findUsersAssignedToTrack(assistantIds, trackId);
      if (assistantsAssignedToTrack.length !== assistantIds.length)
        throw new CustomError(
          ErrorMessages.ASSISTANT_NOT_ASSIGNED_TO_TRACK,
          400,
          HTTPStatusText.FAIL,
        );
    }

    const duplicate = await CourseModel.findDuplicate(trackId, name);
    if (duplicate) throw new CustomError(ErrorMessages.DUPLICATE_COURSE_NAME, 400, HTTPStatusText.FAIL);

    return CourseModel.transaction(async (tx: any) => {
      const newCourse = await tx.course.create({
        data: {
          name: name.trim(),
          description,
          trackId,
        },
      });

      const staffData = [
        ...instructorIds.map((id) => ({
          courseId: newCourse.id,
          userId: id,
          roleInCourse: Role.INSTRUCTOR,
        })),
        ...assistantIds.map((id) => ({
          courseId: newCourse.id,
          userId: id,
          roleInCourse: Role.ASSISTANT,
        })),
      ];

      if (staffData.length > 0) {
        await tx.userCourse.createMany({ data: staffData });
      }

      return newCourse;
    });
  }

  static async update(id: string, body: any) {
    const course = await CourseModel.findById(id);
    if (!course) throw new CustomError(ErrorMessages.COURSE_NOT_FOUND, 404, HTTPStatusText.FAIL);

    const data: any = {};
    if (body.name) data.name = body.name.trim();
    if (body.description) data.description = body.description.trim();

    if (body.name) {
      const duplicate = await CourseModel.findDuplicate(course.trackId, body.name, id);
      if (duplicate) throw new CustomError(ErrorMessages.DUPLICATE_COURSE_NAME, 400, HTTPStatusText.FAIL);
    }

    return CourseModel.update(id, data);
  }

  static async updateStaff(
    id: string,
    body: {
      trackId: string;
      instructorIds?: string[];
      assistantIds?: string[];
    },
  ) {
    const { trackId, instructorIds = [], assistantIds = [] } = body;

    const course = await CourseModel.findById(id);
    if (!course) throw new CustomError(ErrorMessages.COURSE_NOT_FOUND, 404, HTTPStatusText.FAIL);

    const track = await CourseModel.findTrackById(trackId);
    if (!track) throw new CustomError(ErrorMessages.TRACK_NOT_FOUND, 404, HTTPStatusText.FAIL);

    const instructors = instructorIds.length ? await CourseModel.findUsersByIds(instructorIds) : [];

    const assistants = assistantIds.length ? await CourseModel.findUsersByIds(assistantIds) : [];

    if (instructors.length !== instructorIds.length)
      throw new CustomError(ErrorMessages.INVALID_INSTRUCTOR_IDS, 400, HTTPStatusText.FAIL);

    if (assistants.length !== assistantIds.length)
      throw new CustomError(ErrorMessages.INVALID_ASSISTANT_IDS, 400, HTTPStatusText.FAIL);

    if (instructors.some((u) => u.role !== Role.INSTRUCTOR))
      throw new CustomError(ErrorMessages.NOT_AN_INSTRUCTOR, 400, HTTPStatusText.FAIL);

    if (assistants.some((u) => u.role !== Role.ASSISTANT))
      throw new CustomError(ErrorMessages.NOT_AN_ASSISTANT, 400, HTTPStatusText.FAIL);

    const instructorsAssignedToTrack = await CourseModel.findUsersAssignedToTrack(instructorIds, trackId);
    if (instructorsAssignedToTrack.length !== instructorIds.length)
      throw new CustomError(ErrorMessages.INSTRUCTOR_NOT_ASSIGNED_TO_TRACK, 400, HTTPStatusText.FAIL);

    const assistantsAssignedToTrack = await CourseModel.findUsersAssignedToTrack(assistantIds, trackId);
    if (assistantsAssignedToTrack.length !== assistantIds.length)
      throw new CustomError(ErrorMessages.ASSISTANT_NOT_ASSIGNED_TO_TRACK, 400, HTTPStatusText.FAIL);

    return CourseModel.transaction(async (tx: any) => {
      await tx.userCourse.updateMany({
        where: { courseId: id },
        data: { deletedAt: new Date() },
      });

      const staffData = [
        ...instructorIds.map((userId) => ({
          courseId: id,
          userId,
          roleInCourse: Role.INSTRUCTOR,
        })),
        ...assistantIds.map((userId) => ({
          courseId: id,
          userId,
          roleInCourse: Role.ASSISTANT,
        })),
      ];

      if (staffData.length > 0) {
        await tx.userCourse.createMany({ data: staffData });
      }

      return { message: SuccessMessages.COURSE_STAFF_UPDATED };
    });
  }

  static async delete(id: string) {
    const course = await CourseModel.findById(id);
    if (!course) throw new CustomError(ErrorMessages.COURSE_NOT_FOUND, 404, HTTPStatusText.FAIL);

    return CourseModel.transaction(async (tx: any) => {
      await tx.course.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      await tx.userCourse.updateMany({
        where: { courseId: id },
        data: { deletedAt: new Date() },
      });
    });
  }
}
