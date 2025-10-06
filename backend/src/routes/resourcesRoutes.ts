import express from "express";
import * as resourcesController from "../controllers/resourcesController";

const router = express.Router({ mergeParams: true });

router.get("/", resourcesController.getResources);

router.get("/:id", resourcesController.getResourceById);

router.post("/upload", resourcesController.uploadResource);

router.delete("/:id/delete", resourcesController.deleteResource);

export default router;
