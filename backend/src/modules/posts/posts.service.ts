import prisma from "../../config/db";
import CustomError from "../../types/customError";
import { HttpStatusText } from "../../types/HTTPStatusText";
import { PostModel } from "./posts.model";
import { CreatePostInputService, DeletePostInput, GetPostsInput, UpdatePostInputService } from "./posts.type";
import { PostIdParam } from "./posts.validation";

export class PostService {
  static async getPosts({ courseId, search }: GetPostsInput) {
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
  }

  static async getPost({ courseId, id }: PostIdParam) {
    const post = await PostModel.findFirst({
      courseId,
      id,
      course: { deletedAt: null },
    });

    if (!post) throw new CustomError("Post not found", 404, HttpStatusText.FAIL);

    return post;
  }

  static async create({ courseId, userId, title, content }: CreatePostInputService) {
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
  }

  static async update({ courseId, id, userId, content, title }: UpdatePostInputService) {
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
  }

  static async delete({courseId, id, userId} : DeletePostInput) {
    const post = await PostModel.findFirst({
      courseId,
      id,
      course: { deletedAt: null },
    });

    if (!post) throw new CustomError("Post not found", 404, HttpStatusText.FAIL);

    if (post.uploadedBy !== userId) throw new CustomError("Unauthorized", 401, HttpStatusText.FAIL);

    await PostModel.delete(id);
  }
}
