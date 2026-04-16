import { z } from "zod";

export class ResourceValidationSchemas {
  static getManyQuery = z.object({
    courseId: z.string(),
  });

  static getByIdParams = z.object({
    courseId: z.string(),
    id: z.string(),
  });

  static uploadBody = z.object({
    courseId: z.string(),
  });

  static downloadParams = z.object({
    courseId: z.string(),
    id: z.string(),
  });

  static deleteParams = z.object({
    courseId: z.string(),
    id: z.string(),
  });
}

export type GetManyQuery = z.infer<typeof ResourceValidationSchemas.getManyQuery>;
export type GetByIdParams = z.infer<typeof ResourceValidationSchemas.getByIdParams>;
export type UploadBody = z.infer<typeof ResourceValidationSchemas.uploadBody>;
export type DownloadParams = z.infer<typeof ResourceValidationSchemas.downloadParams>;
export type DeleteParams = z.infer<typeof ResourceValidationSchemas.deleteParams>;
