import CustomError from "../../types/customError";
import { HTTPStatusText } from "../../types/HTTPStatusText";
import { ErrorMessages } from "../../types/errorsMessages";
import { CreateCommentInput, GetCommentsInput, GetOrDeleteCommentInput, UpdateCommentInput } from "./comment.type";
import { CommentModel } from "./comment.model";
import { emitToPost } from "../../config/socket";
import { SocketEvents } from "../../types/socketEvents";

export class CommentService {
  static async getMany({ postId }: GetCommentsInput) {
    const comments = await CommentModel.findMany(postId);

    return comments;
  }

  static async get({ postId, id }: GetOrDeleteCommentInput) {
    const comment = await CommentModel.findById(postId, id);

    if (!comment) {
      throw new CustomError(ErrorMessages.COMMENT_NOT_FOUND, 404, HTTPStatusText.FAIL);
    }

    return comment;
  }

  static async create({ postId, userId, content }: CreateCommentInput) {
    const newComment = await CommentModel.create({ content, postId, userId });

    emitToPost(postId, SocketEvents.NEW_COMMENT, newComment);

    return newComment;
  }

  static async update({ postId, id, userId, content }: UpdateCommentInput) {
    const comment = await CommentModel.findById(postId, id);

    if (!comment) {
      throw new CustomError(ErrorMessages.COMMENT_NOT_FOUND, 404, HTTPStatusText.FAIL);
    }

    if (comment.userId !== userId) {
      throw new CustomError(ErrorMessages.UNAUTHORIZED, 403, HTTPStatusText.FAIL);
    }

    const updatedComment = await CommentModel.update(id, { content });

    emitToPost(postId, SocketEvents.UPDATED_COMMENT, updatedComment);

    return updatedComment;
  }

  static async delete({ postId, id }: GetOrDeleteCommentInput) {
    const comment = await CommentModel.findById(postId, id);

    if (!comment) {
      throw new CustomError(ErrorMessages.COMMENT_NOT_FOUND, 404, HTTPStatusText.FAIL);
    }

    await CommentModel.delete(id);

    emitToPost(postId, SocketEvents.DELETED_COMMENT, { id });
  }

  static async count({ postId }: GetCommentsInput) {
    const count = await CommentModel.count(postId);
    
    return count;
  }
}
