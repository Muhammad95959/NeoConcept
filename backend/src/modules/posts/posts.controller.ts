import { Request, Response } from "express";
import prisma from "../../config/db";

export async function getPosts(req: Request, res: Response) {
  const { search } = req.query;
  const { courseId } = req.params;
  try {
    if (search) {
      const posts = await prisma.post.findMany({
        where: {
          courseId,
          OR: [
            { title: { contains: String(search), mode: "insensitive" } },
            { content: { contains: String(search), mode: "insensitive" } },
          ],
        },
      });
      return res.status(200).json({ status: "success", data: posts });
    }
    const posts = await prisma.post.findMany({ where: { courseId } });
    res.status(200).json({ status: "success", data: posts });
  } catch (err) {
    console.log((err as Error).message);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function getPostById(req: Request, res: Response) {
  const { courseId, id } = req.params;
  try {
    const post = await prisma.post.findUnique({
      where: { courseId, id },
    });
    if (!post) return res.status(404).json({ status: "fail", message: "Post not found" });
    res.status(200).json({ status: "success", data: post });
  } catch (err) {
    console.log((err as Error).message);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function createPost(req: Request, res: Response) {
  const { title, content } = req.body;
  const { courseId } = req.params;
  try {
    const newPost = await prisma.post.create({
      data: { title, content, courseId, uploadedBy: res.locals.user.id },
    });
    res.status(201).json({ status: "success", data: newPost });
  } catch (err) {
    console.log((err as Error).message);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function updatePost(req: Request, res: Response) {
  const { courseId, id } = req.params;
  try {
    const post = await prisma.post.findUnique({
      where: { courseId, id },
    });
    if (!post) return res.status(404).json({ status: "fail", message: "Post not found" });
    const { title, content } = req.body;
    const updatedData: any = {};
    if (title) updatedData.title = title;
    if (content) updatedData.title = content;
    const updatedPost = await prisma.post.update({
      where: { courseId, id },
      data: updatedData,
    });
    res.status(200).json({ status: "success", data: updatedPost });
  } catch (err) {
    console.log((err as Error).message);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function deletePost(req: Request, res: Response) {
  const { courseId, id } = req.params;
  try {
    const post = await prisma.post.findUnique({
      where: { courseId, id },
    });
    if (!post) return res.status(404).json({ status: "fail", message: "Post not found" });
    await prisma.post.delete({ where: { courseId, id } });
    res.status(200).json({ status: "success", message: "Post deleted successfully" });
  } catch (err) {
    console.log((err as Error).message);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}
