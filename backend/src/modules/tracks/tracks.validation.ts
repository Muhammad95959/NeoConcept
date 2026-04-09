import { z } from "zod";

export class TrackValidationSchemas {
  static getManyQuery = z.object({
    search: z.string().optional(),
  });

  static getByIdParams = z.object({
    id: z.string().uuid("Invalid track ID"),
  });

  static createBody = z.object({
    name: z.string().min(1, "Track name is required"),
    shortDescription: z.string().min(1, "Short description is required"),
    longDescription: z.string().min(1, "Long description is required"),
    domain: z.string().min(1, "Domain is required"),
    level: z.string().min(1, "Level is required"),
    language: z.string().min(1, "Language is required"),
    targetAudience: z.string().min(1, "Target audience is required"),
    learningOutcomes: z.array(z.string()).optional(),
    relatedJobs: z.array(z.string()).optional(),
    pricingModel: z.string().min(1, "Pricing model is required"),
  });

  static updateBody = z
    .object({
      name: z.string().optional(),
      shortDescription: z.string().optional(),
      longDescription: z.string().optional(),
      domain: z.string().optional(),
      level: z.string().optional(),
      language: z.string().optional(),
      targetAudience: z.string().optional(),
      learningOutcomes: z.array(z.string()).optional(),
      relatedJobs: z.array(z.string()).optional(),
      pricingModel: z.string().optional(),
    })
    .refine((data) => Object.values(data).some((value) => value !== undefined), {
      message: "You must provide at least one field to update",
    });
}

export type GetTracksQuery = z.infer<typeof TrackValidationSchemas.getManyQuery>;
export type GetTrackByIdParams = z.infer<typeof TrackValidationSchemas.getByIdParams>;
export type CreateTrackBody = z.infer<typeof TrackValidationSchemas.createBody>;
export type UpdateTrackBody = z.infer<typeof TrackValidationSchemas.updateBody>;
