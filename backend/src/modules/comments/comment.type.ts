export type GetCommentsInput = {
  courseId: string;
  postId: string;
};

export type GetOrDeleteCommentInput = {
  courseId: string;
  postId: string;
  id: string;
};

export type CreateCommentInput = {
  courseId: string;
  postId: string;
  userId: string;
  content: string;
}

export type UpdateCommentInput = {
  courseId: string;
  postId: string;
  id: string;
  userId: string;
  content: string;
}
