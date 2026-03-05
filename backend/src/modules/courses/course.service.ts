import { CourseModel } from "./course.model";
import { Role } from "../../generated/prisma";
import CustomError from "../../types/customError";
import { HttpStatusText } from "../../types/HTTPStatusText";

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
      if (!track) throw new CustomError("Track not found", 404, HttpStatusText.FAIL);
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
    if (!course) throw new CustomError("Course not found", 404, HttpStatusText.FAIL);

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
    if (!track) throw new CustomError("Track not found", 404, HttpStatusText.FAIL);

    let instructors: any[] = [];
    if (instructorIds.length > 0) {
      instructors = await CourseModel.findUsersByIds(instructorIds);

      if (instructors.length !== instructorIds.length)
        throw new CustomError("One or more instructorIds are invalid", 400, HttpStatusText.FAIL);

      if (instructors.some((user) => user.role !== Role.INSTRUCTOR))
        throw new CustomError("One or more users in instructorIds is not an instructor", 400, HttpStatusText.FAIL);

      if (instructors.some((user) => user.currentTrackId !== trackId))
        throw new CustomError(
          "One or more instructors is not assigned to the specified track",
          400,
          HttpStatusText.FAIL,
        );
    }

    let assistants: any[] = [];
    if (assistantIds.length > 0) {
      assistants = await CourseModel.findUsersByIds(assistantIds);

      if (assistants.length !== assistantIds.length)
        throw new CustomError("One or more assistantIds are invalid", 400, HttpStatusText.FAIL);

      if (assistants.some((user) => user.role !== Role.ASSISTANT))
        throw new CustomError("One or more users in assistantIds is not an assistant", 400, HttpStatusText.FAIL);

      if (assistants.some((user) => user.currentTrackId !== trackId))
        throw new CustomError(
          "One or more assistants is not assigned to the specified track",
          400,
          HttpStatusText.FAIL,
        );
    }

    const duplicate = await CourseModel.findDuplicate(trackId, name);
    if (duplicate) throw new CustomError("Duplicate course name. Please choose another.", 400, HttpStatusText.FAIL);

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
    if (!course) throw new CustomError("Course not found", 404, HttpStatusText.FAIL);

    const data: any = {};
    if (body.name) data.name = body.name.trim();
    if (body.description) data.description = body.description.trim();

    if (body.name) {
      const duplicate = await CourseModel.findDuplicate(course.trackId, body.name, id);
      if (duplicate) throw new CustomError("Duplicate course name", 400, HttpStatusText.FAIL);
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
    if (!course) throw new CustomError("Course not found", 404, HttpStatusText.FAIL);

    const track = await CourseModel.findTrackById(trackId);
    if (!track) throw new CustomError("Track not found", 404, HttpStatusText.FAIL);

    const instructors = instructorIds.length ? await CourseModel.findUsersByIds(instructorIds) : [];

    const assistants = assistantIds.length ? await CourseModel.findUsersByIds(assistantIds) : [];

    if (instructors.length !== instructorIds.length)
      throw new CustomError("One or more instructorIds are invalid", 400, HttpStatusText.FAIL);

    if (assistants.length !== assistantIds.length)
      throw new CustomError("One or more assistantIds are invalid", 400, HttpStatusText.FAIL);

    if (instructors.some((u) => u.role !== Role.INSTRUCTOR))
      throw new CustomError("One or more users is not an instructor", 400, HttpStatusText.FAIL);

    if (assistants.some((u) => u.role !== Role.ASSISTANT))
      throw new CustomError("One or more users is not an assistant", 400, HttpStatusText.FAIL, HttpStatusText.FAIL);

    if (instructors.some((u) => u.currentTrackId !== trackId))
      throw new CustomError("One or more instructors is not assigned to this track", 400, HttpStatusText.FAIL);

    if (assistants.some((u) => u.currentTrackId !== trackId))
      throw new CustomError("One or more assistants is not assigned to this track", 400, HttpStatusText.FAIL);

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

      return { message: "Course staff updated successfully" };
    });
  }

  static async delete(id: string) {
    const course = await CourseModel.findById(id);
    if (!course) throw new CustomError("Course not found", 404, HttpStatusText.FAIL);

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
