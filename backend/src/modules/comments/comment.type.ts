export type GetCommentsInput = {
  postId: string;
};

export type GetOrDeleteCommentInput = {
  postId: string;
  id: string;
};

export type CreateCommentInput = {
  postId: string;
  userId: string;
  content: string;
}

export type UpdateCommentInput = {
  postId: string;
  id: string;
  userId: string;
  content: string;
}
