import bcrypt from "bcryptjs";
import { Role, Status } from "../../generated/prisma";
import CustomError from "../../types/customError";
import { ErrorMessages } from "../../types/errorsMessages";
import { SuccessMessages } from "../../types/successMessages";
import { UserModel } from "./user.model";
import { UserService } from "./user.service";

jest.mock("./user.model", () => ({
  UserModel: {
    updateById: jest.fn(),
    findCourseWithInstructors: jest.fn(),
    findUserEnrollment: jest.fn(),
    createUserCourse: jest.fn(),
    findUserTracks: jest.fn(),
    findUserCoursesUserTrackRequest: jest.fn(),
    findStudentRequestsUserTrackRequest: jest.fn(),
    findStaffRequestsUserTrackRequest: jest.fn(),
    deleteUserWithRelations: jest.fn(),
    findTrackById: jest.fn(),
    transaction: jest.fn(),
    upsertUserTrack: jest.fn(),
    deleteUserTrack: jest.fn(),
    deleteUserCourse: jest.fn(),
    getUserCoursesModel: jest.fn(),
    findStudentRequests: jest.fn(),
    findStaffRequests: jest.fn(),
  },
}));

describe("UserService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("updateUser", () => {
    it("throws when user is soft deleted", async () => {
      await expect(
        UserService.updateUser({
          userId: "u-1",
          username: "Neo",
          password: undefined,
          deletedAt: new Date(),
        }),
      ).rejects.toMatchObject<Partial<CustomError>>({
        message: ErrorMessages.USER_NOT_FOUND,
        statusCode: 404,
      });
    });

    it("throws when username and password are both missing", async () => {
      await expect(
        UserService.updateUser({
          userId: "u-1",
          username: "   ",
          password: undefined,
          deletedAt: null,
        }),
      ).rejects.toMatchObject<Partial<CustomError>>({
        message: ErrorMessages.USERNAME_OR_PASSWORD_REQUIRED,
        statusCode: 400,
      });
    });

    it("updates trimmed username only", async () => {
      await UserService.updateUser({
        userId: "u-2",
        username: "  Clementine  ",
        password: undefined,
        deletedAt: null,
      });

      expect(UserModel.updateById).toHaveBeenCalledWith("u-2", { username: "Clementine" });
    });

    it("hashes password and returns password updated message", async () => {
      jest.spyOn(bcrypt, "hash").mockResolvedValue("hashed-password" as never);

      const result = await UserService.updateUser({
        userId: "u-3",
        username: undefined,
        password: "new-pass",
        deletedAt: null,
      });

      expect(UserModel.updateById).toHaveBeenCalledWith(
        "u-3",
        expect.objectContaining({
          password: "hashed-password",
          passwordChangedAt: expect.any(Date),
        }),
      );
      expect(result).toEqual({ message: SuccessMessages.PASSWORD_UPDATED });
    });
  });

  describe("joinCourse", () => {
    const studentUser = { id: "stu-1", role: Role.STUDENT };

    it("throws forbidden for non-student user", async () => {
      await expect(
        UserService.joinCourse({
          user: { id: "adm-1", role: Role.ADMIN },
          courseId: "c-1",
        }),
      ).rejects.toMatchObject<Partial<CustomError>>({
        message: ErrorMessages.FORBIDDEN,
        statusCode: 403,
      });
    });

    it("throws when course does not exist", async () => {
      (UserModel.findCourseWithInstructors as jest.Mock).mockResolvedValue(null);

      await expect(UserService.joinCourse({ user: studentUser, courseId: "c-404" })).rejects.toMatchObject<
        Partial<CustomError>
      >({
        message: ErrorMessages.COURSE_NOT_FOUND,
        statusCode: 404,
      });
    });

    it("throws when course has no instructor", async () => {
      (UserModel.findCourseWithInstructors as jest.Mock).mockResolvedValue({
        id: "c-1",
        protected: false,
        courseUsers: [],
      });

      await expect(UserService.joinCourse({ user: studentUser, courseId: "c-1" })).rejects.toMatchObject<
        Partial<CustomError>
      >({
        message: ErrorMessages.COURSE_HAS_NO_INSTRUCTOR,
        statusCode: 400,
      });
    });

    it("throws when user is already enrolled", async () => {
      (UserModel.findCourseWithInstructors as jest.Mock).mockResolvedValue({
        id: "c-2",
        protected: false,
        courseUsers: [{ roleInCourse: Role.INSTRUCTOR }],
      });
      (UserModel.findUserEnrollment as jest.Mock).mockResolvedValue({ id: "enroll-1" });

      await expect(UserService.joinCourse({ user: studentUser, courseId: "c-2" })).rejects.toMatchObject<
        Partial<CustomError>
      >({
        message: ErrorMessages.USER_ALREADY_ENROLLED_IN_COURSE,
        statusCode: 400,
      });
    });

    it("throws when course is protected", async () => {
      (UserModel.findCourseWithInstructors as jest.Mock).mockResolvedValue({
        id: "c-3",
        protected: true,
        courseUsers: [{ roleInCourse: Role.INSTRUCTOR }],
      });
      (UserModel.findUserEnrollment as jest.Mock).mockResolvedValue(null);

      await expect(UserService.joinCourse({ user: studentUser, courseId: "c-3" })).rejects.toMatchObject<
        Partial<CustomError>
      >({
        message: ErrorMessages.COURSE_IS_PROTECTED,
        statusCode: 403,
      });
    });

    it("creates enrollment when all validations pass", async () => {
      (UserModel.findCourseWithInstructors as jest.Mock).mockResolvedValue({
        id: "c-4",
        protected: false,
        courseUsers: [{ roleInCourse: Role.INSTRUCTOR }],
      });
      (UserModel.findUserEnrollment as jest.Mock).mockResolvedValue(null);

      await UserService.joinCourse({ user: studentUser, courseId: "c-4" });

      expect(UserModel.createUserCourse).toHaveBeenCalledWith("stu-1", "c-4", Role.STUDENT);
    });
  });

  describe("getUserTracks", () => {
    it("returns tracks with hasJoined and studentRequestStatus", async () => {
      (UserModel.findUserTracks as jest.Mock).mockResolvedValue([
        {
          track: {
            id: "t-1",
            name: "Frontend",
            courses: [
              { id: "c-1", title: "React" },
              { id: "c-2", title: "TypeScript" },
            ],
          },
        },
      ]);
      (UserModel.findUserCoursesUserTrackRequest as jest.Mock).mockResolvedValue([{ courseId: "c-1" }]);
      (UserModel.findStudentRequestsUserTrackRequest as jest.Mock).mockResolvedValue([
        { courseId: "c-2", status: Status.PENDING },
      ]);

      const result = await UserService.getUserTracks({ id: "u-7", role: Role.STUDENT });

      expect(result).toEqual([
        {
          id: "t-1",
          name: "Frontend",
          courses: [
            {
              id: "c-1",
              title: "React",
              hasJoined: true,
              studentRequestStatus: null,
            },
            {
              id: "c-2",
              title: "TypeScript",
              hasJoined: false,
              studentRequestStatus: Status.PENDING,
            },
          ],
        },
      ]);
    });
  });

  describe("deleteUser", () => {
    it("throws when user is already deleted", async () => {
      await expect(
        UserService.deleteUser({ id: "u-1", deletedAt: new Date() }),
      ).rejects.toMatchObject<Partial<CustomError>>({
        message: ErrorMessages.USER_NOT_FOUND,
        statusCode: 404,
      });
    });

    it("calls deleteUserWithRelations for active user", async () => {
      const user = { id: "u-2", deletedAt: null };
      await UserService.deleteUser(user);
      expect(UserModel.deleteUserWithRelations).toHaveBeenCalledWith(user);
    });
  });

  describe("selectTrack", () => {
    const user = { id: "u-3", role: Role.STUDENT };

    it("throws forbidden for admin user", async () => {
      await expect(
        UserService.selectTrack({ user: { id: "a-1", role: Role.ADMIN }, trackId: "t-1" }),
      ).rejects.toMatchObject<Partial<CustomError>>({
        message: ErrorMessages.FORBIDDEN,
        statusCode: 403,
      });
    });

    it("throws when track does not exist", async () => {
      (UserModel.findTrackById as jest.Mock).mockResolvedValue(null);

      await expect(UserService.selectTrack({ user, trackId: "t-404" })).rejects.toMatchObject<
        Partial<CustomError>
      >({
        message: ErrorMessages.TRACK_NOT_FOUND,
        statusCode: 404,
      });
    });

    it("upserts user track when track exists", async () => {
      const track = { id: "t-2" };
      const tx = {};
      (UserModel.findTrackById as jest.Mock).mockResolvedValue(track);
      (UserModel.transaction as jest.Mock).mockImplementation(async (cb: any) => cb(tx));

      await UserService.selectTrack({ user, trackId: "t-2" });

      expect(UserModel.upsertUserTrack).toHaveBeenCalledWith(tx, user.id, "t-2");
    });
  });

  describe("quitTrack", () => {
    const user = { id: "u-4", role: Role.STUDENT };

    it("throws forbidden for admin user", async () => {
      await expect(
        UserService.quitTrack({ user: { id: "a-2", role: Role.ADMIN }, trackId: "t-3" }),
      ).rejects.toMatchObject<Partial<CustomError>>({
        message: ErrorMessages.FORBIDDEN,
        statusCode: 403,
      });
    });

    it("throws when track not found", async () => {
      const tx = {};
      (UserModel.transaction as jest.Mock).mockImplementation(async (cb: any) => {
        await cb(tx);
      });
      (UserModel.deleteUserTrack as jest.Mock).mockResolvedValue({ count: 0 });

      await expect(UserService.quitTrack({ user, trackId: "t-404" })).rejects.toMatchObject<
        Partial<CustomError>
      >({
        message: ErrorMessages.TRACK_NOT_FOUND,
        statusCode: 404,
      });
    });

    it("deletes user track when found", async () => {
      const tx = {};
      (UserModel.transaction as jest.Mock).mockImplementation(async (cb: any) => {
        await cb(tx);
      });
      (UserModel.deleteUserTrack as jest.Mock).mockResolvedValue({ count: 1 });

      await UserService.quitTrack({ user, trackId: "t-3" });

      expect(UserModel.deleteUserTrack).toHaveBeenCalledWith(tx, user.id, "t-3");
    });
  });

  describe("getUserCourses", () => {
    it("returns user courses", async () => {
      const courses = [{ id: "c-1", title: "React" }];
      (UserModel.getUserCoursesModel as jest.Mock).mockResolvedValue(courses);

      const result = await UserService.getUserCourses({ userId: "u-5" });

      expect(result).toEqual(courses);
      expect(UserModel.getUserCoursesModel).toHaveBeenCalledWith("u-5");
    });
  });

  describe("getUserStudentRequests", () => {
    const studentUser = { id: "u-6", role: Role.STUDENT };
    const instructorUser = { id: "i-1", role: Role.INSTRUCTOR };

    it("throws when user is not a student", async () => {
      await expect(
        UserService.getUserStudentRequests(instructorUser, Status.PENDING, "math"),
      ).rejects.toMatchObject<Partial<CustomError>>({
        message: ErrorMessages.ONLY_STUDENTS_CAN_HAVE_STUDENT_REQUESTS,
        statusCode: 403,
      });
    });

    it("returns student requests with filters", async () => {
      const requests = [{ id: "sr-1", status: Status.PENDING }];
      (UserModel.findStudentRequests as jest.Mock).mockResolvedValue(requests);

      const result = await UserService.getUserStudentRequests(studentUser, Status.PENDING, "math");

      expect(result).toEqual(requests);
      expect(UserModel.findStudentRequests).toHaveBeenCalledWith(studentUser.id, Status.PENDING, "math");
    });
  });

  describe("quitCourse", () => {
    const studentUser = { id: "u-7", role: Role.STUDENT };

    it("throws when user is not a student", async () => {
      await expect(
        UserService.quitCourse({ user: { id: "a-3", role: Role.ADMIN }, courseId: "c-1" }),
      ).rejects.toMatchObject<Partial<CustomError>>({
        message: ErrorMessages.FORBIDDEN,
        statusCode: 403,
      });
    });

    it("throws when course not found", async () => {
      (UserModel.deleteUserCourse as jest.Mock).mockResolvedValue({ count: 0 });

      await expect(UserService.quitCourse({ user: studentUser, courseId: "c-404" })).rejects.toMatchObject<
        Partial<CustomError>
      >({
        message: ErrorMessages.COURSE_NOT_FOUND,
        statusCode: 404,
      });
    });

    it("deletes user course enrollment", async () => {
      (UserModel.deleteUserCourse as jest.Mock).mockResolvedValue({ count: 1 });

      await UserService.quitCourse({ user: studentUser, courseId: "c-2" });

      expect(UserModel.deleteUserCourse).toHaveBeenCalledWith(studentUser.id, "c-2");
    });
  });

  describe("getUserStaffRequests", () => {
    const instructorUser = { id: "i-2", role: Role.INSTRUCTOR };
    const assistantUser = { id: "as-1", role: Role.ASSISTANT };
    const studentUser = { id: "u-8", role: Role.STUDENT };

    it("throws when user is not instructor or assistant", async () => {
      await expect(
        UserService.getUserStaffRequests({ user: studentUser, status: Status.APPROVED, search: "physics" }),
      ).rejects.toMatchObject<Partial<CustomError>>({
        message: ErrorMessages.ONLY_INSTRUCTORS_AND_ASSISTANTS_CAN_HAVE_STAFF_REQUESTS,
        statusCode: 403,
      });
    });

    it("returns staff requests for instructor", async () => {
      const requests = [{ id: "st-1", status: Status.PENDING }];
      (UserModel.findStaffRequests as jest.Mock).mockResolvedValue(requests);

      const result = await UserService.getUserStaffRequests({
        user: instructorUser,
        status: Status.PENDING,
        search: "student",
      });

      expect(result).toEqual(requests);
      expect(UserModel.findStaffRequests).toHaveBeenCalledWith(instructorUser.id, Status.PENDING, "student");
    });

    it("returns staff requests for assistant", async () => {
      const requests = [{ id: "st-2", status: Status.APPROVED }];
      (UserModel.findStaffRequests as jest.Mock).mockResolvedValue(requests);

      const result = await UserService.getUserStaffRequests({
        user: assistantUser,
        status: Status.APPROVED,
        search: undefined,
      });

      expect(result).toEqual(requests);
    });
  });

  describe("getUserTracks with staff role", () => {
    it("returns tracks with staffRequestStatus for staff users", async () => {
      (UserModel.findUserTracks as jest.Mock).mockResolvedValue([
        {
          track: {
            id: "t-2",
            name: "Backend",
            courses: [
              { id: "c-3", title: "Node" },
              { id: "c-4", title: "Express" },
            ],
          },
        },
      ]);
      (UserModel.findUserCoursesUserTrackRequest as jest.Mock).mockResolvedValue([{ courseId: "c-3" }]);
      (UserModel.findStaffRequestsUserTrackRequest as jest.Mock).mockResolvedValue([
        { courseId: "c-4", status: Status.APPROVED },
      ]);

      const result = await UserService.getUserTracks({ id: "i-3", role: Role.INSTRUCTOR });

      expect(result).toEqual([
        {
          id: "t-2",
          name: "Backend",
          courses: [
            {
              id: "c-3",
              title: "Node",
              hasJoined: true,
              staffRequestStatus: null,
            },
            {
              id: "c-4",
              title: "Express",
              hasJoined: false,
              staffRequestStatus: Status.APPROVED,
            },
          ],
        },
      ]);
    });
  });
});