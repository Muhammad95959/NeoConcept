import { Readable } from "stream";
import { s3 } from "../resource.upload";
import CustomError from "../../../types/customError";
import { ErrorMessages } from "../../../types/errorsMessages";
import { ResourceModel } from "../resource.model";
import { ResourceService } from "../resource.service";

jest.mock("../resource.model", () => ({
  ResourceModel: {
    findCourseById: jest.fn(),
    findResourceById: jest.fn(),
    findManyByCourse: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock("../resource.upload", () => ({
  s3: {
    send: jest.fn(),
  },
}));

describe("ResourceService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AWS_S3_BUCKET = "bucket-test";
  });

  describe("getResources", () => {
    it("returns resources without fileKey", async () => {
      (ResourceModel.findCourseById as jest.Mock).mockResolvedValue({ id: "c-1" });
      (ResourceModel.findManyByCourse as jest.Mock).mockResolvedValue([
        {
          id: "r-1",
          fileName: "doc.pdf",
          fileKey: "resources/123-doc.pdf",
        },
      ]);

      const result = await ResourceService.getResources("c-1");

      expect(result).toEqual([
        {
          id: "r-1",
          fileName: "doc.pdf",
          fileKey: undefined,
        },
      ]);
    });
  });

  describe("getResourceById", () => {
    it("throws when resource does not belong to course", async () => {
      (ResourceModel.findCourseById as jest.Mock).mockResolvedValue({ id: "c-1" });
      (ResourceModel.findResourceById as jest.Mock).mockResolvedValue({ id: "r-1", courseId: "c-2" });

      await expect(ResourceService.getResourceById("c-1", "r-1")).rejects.toMatchObject<Partial<CustomError>>({
        message: ErrorMessages.RESOURCE_DOES_NOT_BELONG_TO_COURSE,
        statusCode: 400,
      });
    });
  });

  describe("uploadResource", () => {
    it("deletes S3 object when db create fails", async () => {
      (ResourceModel.findCourseById as jest.Mock).mockResolvedValue({ id: "c-1" });
      (ResourceModel.create as jest.Mock).mockRejectedValue(new Error("db failure"));

      await expect(
        ResourceService.uploadResource(
          "c-1",
          {
            originalname: "slides.pdf",
            mimetype: "application/pdf",
            location: "https://example.com/slides.pdf",
            key: "resources/slides.pdf",
          },
          "u-1",
        ),
      ).rejects.toThrow("db failure");

      expect(s3.send).toHaveBeenCalledTimes(1);
      expect(s3.send).toHaveBeenCalledWith(
        expect.objectContaining({ input: expect.objectContaining({ Key: "resources/slides.pdf" }) }),
      );
    });
  });

  describe("downloadResource", () => {
    it("throws when S3 body is not a readable stream", async () => {
      (ResourceModel.findCourseById as jest.Mock).mockResolvedValue({ id: "c-1" });
      (ResourceModel.findResourceById as jest.Mock).mockResolvedValue({
        id: "r-1",
        courseId: "c-1",
        fileKey: "resources/doc.pdf",
        fileName: "doc.pdf",
      });
      (s3.send as jest.Mock).mockResolvedValue({
        Body: { bad: true },
        ContentType: "application/pdf",
      });

      await expect(ResourceService.downloadResource("c-1", "r-1")).rejects.toMatchObject<Partial<CustomError>>({
        message: ErrorMessages.UNEXPECTED_S3_RESPONSE,
        statusCode: 500,
      });
    });

    it("returns stream payload when S3 responds correctly", async () => {
      const body = new Readable({
        read() {
          this.push(null);
        },
      });

      (ResourceModel.findCourseById as jest.Mock).mockResolvedValue({ id: "c-1" });
      (ResourceModel.findResourceById as jest.Mock).mockResolvedValue({
        id: "r-1",
        courseId: "c-1",
        fileKey: "resources/doc.pdf",
        fileName: "doc.pdf",
      });
      (s3.send as jest.Mock).mockResolvedValue({
        Body: body,
        ContentType: "application/pdf",
      });

      const result = await ResourceService.downloadResource("c-1", "r-1");

      expect(result).toEqual({
        stream: body,
        contentType: "application/pdf",
        fileName: "doc.pdf",
      });
    });
  });

  describe("deleteResource", () => {
    it("deletes object from s3 then removes db record", async () => {
      (ResourceModel.findCourseById as jest.Mock).mockResolvedValue({ id: "c-1" });
      (ResourceModel.findResourceById as jest.Mock).mockResolvedValue({
        id: "r-1",
        courseId: "c-1",
        fileKey: "resources/doc.pdf",
      });
      (s3.send as jest.Mock).mockResolvedValue({});

      await ResourceService.deleteResource("c-1", "r-1");

      expect(s3.send).toHaveBeenCalledTimes(1);
      expect(ResourceModel.delete).toHaveBeenCalledWith("r-1");
    });
  });
});
