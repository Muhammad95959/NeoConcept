import express from "express";
import { Role } from "../../generated/prisma";
import { protect } from "../../middlewares/protect";
import { restrict } from "../../middlewares/restrict";
import { validate } from "../../middlewares/validate";
import { TrackController } from "./tracks.controller";
import { TrackValidationSchemas } from "./tracks.validation";

const router = express.Router();

router.get("/", validate({ query: TrackValidationSchemas.getManyQuery }), TrackController.getTracks);

router.get("/:id", validate({ params: TrackValidationSchemas.idParams }), TrackController.getTrackById);

router.get(
  "/:id/staff",
  protect,
  restrict(Role.ADMIN),
  validate({ params: TrackValidationSchemas.idParams }),
  TrackController.getTrackStaff,
);

router.post(
  "/",
  protect,
  restrict(Role.ADMIN),
  validate({ body: TrackValidationSchemas.createBody }),
  TrackController.createTrack,
);

router.patch(
  "/:id",
  protect,
  restrict(Role.ADMIN),
  validate({ params: TrackValidationSchemas.idParams, body: TrackValidationSchemas.updateBody }),
  TrackController.updateTrack,
);

router.delete(
  "/:id",
  protect,
  restrict(Role.ADMIN),
  validate({ params: TrackValidationSchemas.idParams }),
  TrackController.deleteTrack,
);

export default router;
