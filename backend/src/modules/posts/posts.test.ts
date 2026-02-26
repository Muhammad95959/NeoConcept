import request from "supertest";
import { PostService } from "./posts.service";

jest.mock("./posts.service");

import app from '../../app';

app.use((req: any, res: any, next: any) => {
  res.locals.user = { id: "user1" };
  next();
});



describe("PostController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /courses/:courseId/posts", () => {
    it("should return posts", async () => {
      (PostService.getPosts as jest.Mock).mockResolvedValue([
        { id: "1", title: "test" },
      ]);

      const res = await request(app).get("/api/v1/courses/course1/posts");

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data).toHaveLength(1);
    });

    it("should handle errors", async () => {
      (PostService.getPosts as jest.Mock).mockRejectedValue(
        new Error("Something went wrong")
      );

      const res = await request(app).get("/api/v1/courses/course1/posts");

      expect(res.status).toBe(500);
    });
  });

  describe("GET /courses/:courseId/posts/:id", () => {
    it("should return a post", async () => {
      (PostService.getPostById as jest.Mock).mockResolvedValue({
        id: "1",
      });

      const res = await request(app).get("/api/v1/courses/course1/posts/1");

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe("1");
    });

    it("should return 404 if not found", async () => {
      (PostService.getPostById as jest.Mock).mockRejectedValue(
        new Error("Post not found")
      );

      const res = await request(app).get("/api/v1/courses/course1/posts/1");

      expect(res.status).toBe(404);
    });
  });

  describe("POST /courses/:courseId/posts", () => {
    it("should create a post", async () => {
      (PostService.createPost as jest.Mock).mockResolvedValue({
        id: "1",
      });

      const res = await request(app)
        .post("/api/v1/courses/course1/posts")
        .send({ title: "Title", content: "Content" });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBe("1");
    });

    it("should return 400 for invalid input", async () => {
      (PostService.createPost as jest.Mock).mockRejectedValue(
        new Error("Title and content are required")
      );

      const res = await request(app)
        .post("/api/v1/courses/course1/posts")
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /courses/:courseId/posts/:id", () => {
    it("should update post", async () => {
      (PostService.updatePost as jest.Mock).mockResolvedValue({
        id: "1",
        title: "updated",
      });

      const res = await request(app)
        .patch("/api/v1/courses/course1/posts/1")
        .send({ title: "updated" });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe("updated");
    });

    it("should return 403 if unauthorized", async () => {
      (PostService.updatePost as jest.Mock).mockRejectedValue(
        new Error("Unauthorized")
      );

      const res = await request(app)
        .patch("api/v1/courses/course1/posts/1")
        .send({ title: "updated" });

      expect(res.status).toBe(403);
    });
  });

  describe("DELETE /courses/:courseId/posts/:id", () => {
    it("should delete post", async () => {
      (PostService.deletePost as jest.Mock).mockResolvedValue(undefined);

      const res = await request(app).delete("/courses/course1/posts/1");

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Post deleted successfully");
    });

    it("should return 404 if not found", async () => {
      (PostService.deletePost as jest.Mock).mockRejectedValue(
        new Error("Post not found")
      );

      const res = await request(app).delete("/courses/course1/posts/1");

      expect(res.status).toBe(404);
    });
  });
});