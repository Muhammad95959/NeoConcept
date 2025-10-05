import express from "express";
import * as postsController from "../controllers/postsController";

const router = express.Router();

router.get("/get-posts", postsController.getPosts);

router.get("/get-post/:id", postsController.getPost);

router.post("/create-post", postsController.createPost);

router.patch("/update-post/:id", postsController.updatePost);

router.delete("/delete-post/:id", postsController.deletePost);

export default router;
