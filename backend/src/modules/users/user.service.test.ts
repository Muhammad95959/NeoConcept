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
});