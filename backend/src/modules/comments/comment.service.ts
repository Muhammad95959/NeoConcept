import { CreateCommentInput, GetCommentsInput, GetOrDeleteCommentInput, UpdateCommentInput } from "./comment.type";

export class CommentService {
  static async getMany({ courseId, postId }: GetCommentsInput) {}

  static async get({ courseId, postId, id }: GetOrDeleteCommentInput) {}

  static async create({courseId, postId, userId, content}: CreateCommentInput) {}

  static async update({courseId, postId, id, userId, content}: UpdateCommentInput) {}

  static async delete({courseId, postId, id}: GetOrDeleteCommentInput) {}
}
