import prisma from "../../config/db";
import CustomError from "../../types/customError";
import { ErrorMessages } from "../../types/errorsMessages";
import { HTTPStatusText } from "../../types/HTTPStatusText";
import { PostModel } from "./post.model";
import { CreatePostInputService, DeletePostInput, GetPostsInput, UpdatePostInputService } from "./post.type";
import { PostIdParam } from "./post.validation";

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

    if (!post) throw new CustomError(ErrorMessages.POST_NOT_FOUND, 404, HTTPStatusText.FAIL);

    return post;
  }

  static async create({ courseId, userId, title, content }: CreatePostInputService) {
    const course = await prisma.course.findFirst({
      where: { id: courseId, deletedAt: null },
    });

    if (!course) throw new CustomError(ErrorMessages.COURSE_NOT_FOUND, 404, HTTPStatusText.FAIL);

    if (!title?.trim() || !content?.trim()) {
      throw new CustomError(ErrorMessages.POST_TITLE_AND_CONTENT_REQUIRED, 400, HTTPStatusText.FAIL);
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

    if (!post) throw new CustomError(ErrorMessages.POST_NOT_FOUND, 404, HTTPStatusText.FAIL);

    if (post.uploadedBy !== userId) throw new CustomError(ErrorMessages.UNAUTHORIZED, 401, HTTPStatusText.FAIL);

    if (!title?.trim() && !content?.trim()) {
      throw new CustomError(ErrorMessages.POST_TITLE_OR_CONTENT_REQUIRED, 400, HTTPStatusText.FAIL);
    }

    const data: any = {};
    if (title) data.title = title.trim();
    if (content) data.content = content.trim();

    return PostModel.update(id, data);
  }

  static async delete({ courseId, id, userId }: DeletePostInput) {
    const post = await PostModel.findFirst({
      courseId,
      id,
      course: { deletedAt: null },
    });

    if (!post) throw new CustomError(ErrorMessages.POST_NOT_FOUND, 404, HTTPStatusText.FAIL);

    if (post.uploadedBy !== userId) throw new CustomError(ErrorMessages.UNAUTHORIZED, 401, HTTPStatusText.FAIL);

    await PostModel.delete(id);
  }
}
