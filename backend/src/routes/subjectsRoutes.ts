import express from "express";
import * as subjectsController from "../controllers/subjectsController";

const router = express.Router();

router.get("/get-rooms", subjectsController.getRooms);

router.get("/get-room/:id", subjectsController.getRoomById);

router.post("/create-room", subjectsController.createRoom);

router.patch("/update-room/:id", subjectsController.updateRoom);

router.delete("/delete-room", subjectsController.deleteRoom);

export default router;
