import { z } from "zod";

export class ResourceValidationSchemas {
  static getManyQuery = z.object({
    courseId: z.string(),
  });

  static idParams = z.object({
    courseId: z.string(),
    id: z.string(),
  });

  static uploadBody = z.object({
    courseId: z.string(),
  });
}

export type GetManyQuery = z.infer<typeof ResourceValidationSchemas.getManyQuery>;
export type IdParams = z.infer<typeof ResourceValidationSchemas.idParams>;
export type UploadBody = z.infer<typeof ResourceValidationSchemas.uploadBody>;
