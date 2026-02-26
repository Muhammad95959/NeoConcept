import { PostModel } from "./posts.model";
import prisma from "../../config/db";
import CustomError from "../../types/customError";
import { HttpStatusText } from "../../types/HTTPStatusText";

export const PostService = {
  async getPosts(courseId: string, search?: string) {
    const where: any = {
      courseId,
      course: { deletedAt: null },
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    return PostModel.findMany(where);
  },

  async getPostById(courseId: string, id: string) {
    const post = await PostModel.findFirst({
      courseId,
      id,
      course: { deletedAt: null },
    });

    if (!post) throw new CustomError("Post not found", 404, HttpStatusText.FAIL);

    return post;
  },

  async createPost(courseId: string, userId: string, title: string, content: string) {
    const course = await prisma.course.findFirst({
      where: { id: courseId, deletedAt: null },
    });

    if (!course) throw new CustomError("Course not found", 404, HttpStatusText.FAIL);

    if (!title?.trim() || !content?.trim()) {
      throw new CustomError("Title and content are required", 400, HttpStatusText.FAIL);
    }

    return PostModel.create({
      title: title.trim(),
      content: content.trim(),
      courseId,
      uploadedBy: userId,
    });
  },

  async updatePost(courseId: string, id: string, userId: string, title?: string, content?: string) {
    const post = await PostModel.findFirst({
      courseId,
      id,
      course: { deletedAt: null },
    });

    if (!post) throw new CustomError("Post not found", 404, HttpStatusText.FAIL);

    if (post.uploadedBy !== userId) throw new CustomError("Unauthorized", 401, HttpStatusText.FAIL);

    if (!title?.trim() && !content?.trim()) {
      throw new CustomError("Title or content is required", 400, HttpStatusText.FAIL);
    }

    const data: any = {};
    if (title) data.title = title.trim();
    if (content) data.content = content.trim();

    return PostModel.update(id, data);
  },

  async deletePost(courseId: string, id: string, userId: string) {
    const post = await PostModel.findFirst({
      courseId,
      id,
      course: { deletedAt: null },
    });

    if (!post) throw new CustomError("Post not found", 404, HttpStatusText.FAIL);

    if (post.uploadedBy !== userId) throw new CustomError("Unauthorized", 401, HttpStatusText.FAIL);

    await PostModel.delete(id);
  },
};
