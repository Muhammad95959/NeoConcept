import { DeleteObjectCommand, GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Request, Response } from "express";
import multer from "multer";
import multerS3 from "multer-s3";
import { Readable } from "stream";
import prisma from "../../config/db";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

async function verifyParams(res: Response, id: string, courseId: string) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  const resource = await prisma.resource.findUnique({ where: { id } });
  if (!course) {
    res.status(404).json({ status: "fail", message: "Course not found" });
    return null;
  }
  if (!resource) {
    res.status(404).json({ status: "fail", message: "Resource not found" });
    return null;
  }
  if (resource.courseId !== course.id) {
    res.status(400).json({ status: "fail", message: "Resource does not belong to this course" });
    return null;
  }
  return { course, resource };
}

export async function getResources(req: Request, res: Response) {
  const { courseId } = req.params as { courseId: string };
  try {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return res.status(404).json({ status: "fail", message: "Course not found" });
    const resources = await prisma.resource.findMany({ where: { courseId } });
    res.status(200).json({ status: "success", data: resources.map((r) => ({ ...r, fileKey: undefined })) });
  } catch (err) {
    console.log((err as Error).message);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function getResourceById(req: Request, res: Response) {
  const { courseId, id } = req.params as { courseId: string; id: string };
  try {
    const { resource } = (await verifyParams(res, id, courseId))!;
    res.status(200).json({ status: "success", data: { ...resource, fileKey: undefined } });
  } catch (err) {
    console.log((err as Error).message);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export function uploadToS3() {
  const upload = multer({
    storage: multerS3({
      s3,
      bucket: process.env.AWS_S3_BUCKET!,
      key: (_req, file, cb) => cb(null, `resources/${Date.now().toString()}-${file.originalname}`),
    }),
  });
  return upload.single("file");
}

export async function uploadResource(req: Request, res: Response) {
  const { courseId } = req.params as { courseId: string };
  const file = req.file!;
  try {
    const resource = await prisma.resource.create({
      data: {
        fileName: file.originalname,
        fileType: file.mimetype,
        fileUrl: (file as any).location,
        fileKey: (file as any).key,
        uploadedBy: res.locals.user.id,
        courseId,
      },
    });
    res.status(201).json({ status: "success", data: { ...resource, fileKey: undefined } });
  } catch (err) {
    console.log((err as Error).message);
    try {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: (file as any).key,
        }),
      );
      console.log(`Rolled back uploaded file: ${(file as any).key}`);
    } catch (cleanupErr) {
      console.error("Failed to delete uploaded file:", (cleanupErr as Error).message);
    }
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function downloadResource(req: Request, res: Response) {
  const { courseId, id } = req.params as { courseId: string; id: string };
  try {
    const { resource } = (await verifyParams(res, id, courseId))!;
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: resource.fileKey,
    });
    const { Body, ContentType } = await s3.send(command);
    if (Body instanceof Readable) {
      res.setHeader("Content-Type", ContentType || "application/octet-stream");
      res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(resource.fileName)}"`);
      Body.pipe(res);
    } else res.status(500).json({ status: "fail", message: "Unexpected response type from S3" });
  } catch (err) {
    console.log((err as Error).message);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function deleteResource(req: Request, res: Response) {
  const { courseId, id } = req.params as { courseId: string; id: string };
  try {
    const { resource } = (await verifyParams(res, id, courseId))!;
    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: resource.fileKey,
      }),
    );
    await prisma.resource.delete({ where: { id } });
    res.status(200).json({ status: "success", message: "Resource deleted successfully" });
  } catch (err) {
    console.log((err as Error).message);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}
