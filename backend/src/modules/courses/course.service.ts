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
    protect?: boolean;
    trackId: string;
    prerequisiteIds?: string[];
    instructorIds?: string[];
    assistantIds?: string[];
  }) {
    const { name, description, protect, trackId, prerequisiteIds = [], instructorIds = [], assistantIds = [] } = body;

    const track = await CourseModel.findTrackById(trackId);
    if (!track) throw new CustomError(ErrorMessages.TRACK_NOT_FOUND, 404, HTTPStatusText.FAIL);

    let prerequisites: any[] = [];
    prerequisites = await CourseModel.findPrerequisites(prerequisiteIds);
    if (prerequisites.length !== prerequisiteIds.length)
      throw new CustomError(ErrorMessages.INVALID_PREREQUISITES, 400, HTTPStatusText.FAIL);

    let instructors: any[] = [];
    if (instructorIds.length > 0) {
      instructors = await CourseModel.findUsersByIds(instructorIds);

      if (instructors.length !== instructorIds.length)
        throw new CustomError(ErrorMessages.INVALID_INSTRUCTOR_IDS, 400, HTTPStatusText.FAIL);

      if (instructors.some((user) => user.role !== Role.INSTRUCTOR))
        throw new CustomError(ErrorMessages.NOT_AN_INSTRUCTOR, 400, HTTPStatusText.FAIL);

      const instructorsAssignedToTrack = await CourseModel.findUsersAssignedToTrack(instructorIds, trackId);
      if (instructorsAssignedToTrack.length !== instructorIds.length)
        throw new CustomError(ErrorMessages.INSTRUCTOR_NOT_ASSIGNED_TO_TRACK, 400, HTTPStatusText.FAIL);
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
        throw new CustomError(ErrorMessages.ASSISTANT_NOT_ASSIGNED_TO_TRACK, 400, HTTPStatusText.FAIL);
    }

    const duplicate = await CourseModel.findDuplicate(trackId, name);
    if (duplicate) throw new CustomError(ErrorMessages.DUPLICATE_COURSE_NAME, 400, HTTPStatusText.FAIL);

    return CourseModel.transaction(async (tx: any) => {
      const newCourse = await tx.course.create({
        data: {
          name: name.trim(),
          description,
          trackId,
          protected: protect,
        },
      });

      let prerequisitesData: any[] = [];
      if (prerequisiteIds.length > 0) {
        prerequisitesData = prerequisiteIds.map((id: string) => {
          return { courseId: newCourse.id, prerequisiteId: id };
        });
        await tx.coursePrerequisite.createMany({ data: prerequisitesData });
      }

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
    if (body.protect !== undefined) data.protected = body.protect;

    if (body.name) {
      const duplicate = await CourseModel.findDuplicate(course.trackId, body.name, id);
      if (duplicate) throw new CustomError(ErrorMessages.DUPLICATE_COURSE_NAME, 400, HTTPStatusText.FAIL);
    }

    return CourseModel.update(id, data);
  }

  static async updatePrerequisites(
    id: string,
    body: {
      prerequisiteIds?: string[];
    },
  ) {
    const { prerequisiteIds = [] } = body;

    const course = await CourseModel.findById(id);
    if (!course) throw new CustomError(ErrorMessages.COURSE_NOT_FOUND, 404, HTTPStatusText.FAIL);

    const prerequisites = await CourseModel.findPrerequisites(prerequisiteIds);

    if (prerequisites.length !== prerequisiteIds.length)
      throw new CustomError(ErrorMessages.INVALID_PREREQUISITES, 400, HTTPStatusText.FAIL);

    if (prerequisiteIds.includes(id))
      throw new CustomError(ErrorMessages.CANNOT_PREREQUISITE_SELF, 400, HTTPStatusText.FAIL);

    CourseModel.transaction(async (tx: any) => {
      await tx.coursePrerequisite.deleteMany({ where: { courseId: id } });
      if (prerequisiteIds && prerequisiteIds.length > 0) {
        const prerequisitesData = prerequisiteIds.map((prereqId: string) => {
          return { courseId: id, prerequisiteId: prereqId };
        });
        await tx.coursePrerequisite.createMany({ data: prerequisitesData });
      }
    });

    return { message: SuccessMessages.PREREQUISITES_UPDATED };
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
