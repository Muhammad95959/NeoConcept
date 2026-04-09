import { DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import { ResourceModel } from "./resource.model";
import { s3 } from "./resource.upload";
import CustomError from "../../types/customError";
import { HTTPStatusText } from "../../types/HTTPStatusText";
import { ErrorMessages } from "../../types/errorsMessages";

export class ResourceService {
  private static async verify(courseId: string): Promise<{ course: any }>;
  private static async verify(courseId: string, id: string): Promise<{ course: any; resource: any }>;

  private static async verify(courseId: string, id?: string) {
    const course = await ResourceModel.findCourseById(courseId);
    if (!course) {
      throw new CustomError(ErrorMessages.COURSE_NOT_FOUND, 404, HTTPStatusText.FAIL);
    }

    if (!id) {
      return { course };
    }

    const resource = await ResourceModel.findResourceById(id);
    if (!resource) {
      throw new CustomError(ErrorMessages.RESOURCE_NOT_FOUND, 404, HTTPStatusText.FAIL);
    }

    if (resource.courseId !== course.id) {
      throw new CustomError(ErrorMessages.RESOURCE_DOES_NOT_BELONG_TO_COURSE, 400, HTTPStatusText.FAIL);
    }

    return { course, resource };
  }

  static async getResources(courseId: string) {
    await this.verify(courseId);
    const resources = await ResourceModel.findManyByCourse(courseId);

    return resources.map((r) => ({
      ...r,
      fileKey: undefined,
    }));
  }

  static async getResourceById(courseId: string, id: string) {
    const { resource } = await this.verify(courseId, id);

    return {
      ...resource,
      fileKey: undefined,
    };
  }

  static async uploadResource(courseId: string, file: any, userId: string) {
    await this.verify(courseId);

    try {
      const resource = await ResourceModel.create({
        fileName: file.originalname,
        fileType: file.mimetype,
        fileUrl: file.location,
        fileKey: file.key,
        uploadedBy: userId,
        courseId,
      });

      return {
        ...resource,
        fileKey: undefined,
      };
    } catch (err) {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: file.key,
        }),
      );

      throw err;
    }
  }

  static async downloadResource(courseId: string, id: string) {
    const { resource } = await this.verify(courseId, id);

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: resource.fileKey,
    });

    const { Body, ContentType } = await s3.send(command);

    if (!(Body instanceof Readable))
      throw new CustomError(ErrorMessages.UNEXPECTED_S3_RESPONSE, 500, HTTPStatusText.ERROR);

    return {
      stream: Body,
      contentType: ContentType || "application/octet-stream",
      fileName: resource.fileName,
    };
  }

  static async deleteResource(courseId: string, id: string) {
    const { resource } = await this.verify(courseId, id);

    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: resource.fileKey,
      }),
    );

    await ResourceModel.delete(id);
  }
}
