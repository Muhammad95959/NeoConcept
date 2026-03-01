export type GetPostsInput = {
  courseId: string;
  search?: string;
};

export type CreatePostInputService = {
  courseId: string;
  userId: string;
  content: string;
  title: string;
};

export type UpdatePostInputService = {
  courseId: string;
  userId: string;
  content: string;
  title: string;
  id: string;
};

export type DeletePostInput = {
  userId: string;
  courseId: string;
  id: string;
};
