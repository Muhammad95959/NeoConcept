import { Request, Response } from "express";
import prisma from "../../config/db";

export async function getPosts(req: Request, res: Response) {
  try {
    const { search } = req.query;
    const { courseId } = req.params;
    const where: any = { courseId, course: { deletedAt: null } };
    if (search) {
      where.OR = [
        { title: { contains: String(search), mode: "insensitive" } },
        { content: { contains: String(search), mode: "insensitive" } },
      ];
    }
    const posts = await prisma.post.findMany({ where });
    res.status(200).json({ status: "success", data: posts });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function getPostById(req: Request, res: Response) {
  try {
    const { courseId, id } = req.params;
    const post = await prisma.post.findFirst({ where: { courseId, id, course: { deletedAt: null } } });
    if (!post) return res.status(404).json({ status: "fail", message: "Post not found" });
    res.status(200).json({ status: "success", data: post });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function createPost(req: Request, res: Response) {
  try {
    const { courseId } = req.params;
    const { title, content } = req.body;
    const course = await prisma.course.findFirst({ where: { id: courseId, deletedAt: null } });
    if (!course) return res.status(404).json({ status: "fail", message: "Course not found" });
    if (!title?.trim() || !content?.trim())
      return res.status(400).json({ status: "fail", message: "Title and content are required" });
    const newPost = await prisma.post.create({
      data: { title: title?.trim(), content: content?.trim(), courseId, uploadedBy: res.locals.user.id },
    });
    res.status(201).json({ status: "success", data: newPost });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function updatePost(req: Request, res: Response) {
  try {
    const { courseId, id } = req.params;
    const { title, content } = req.body;
    const post = await prisma.post.findFirst({ where: { courseId, id, course: { deletedAt: null } } });
    if (!post) return res.status(404).json({ status: "fail", message: "Post not found" });
    if (post.uploadedBy !== res.locals.user.id)
      return res.status(403).json({ status: "fail", message: "Unauthorized" });
    if (!title?.trim() && !content?.trim())
      return res.status(400).json({ status: "fail", message: "Title or content is required" });
    const data: any = {};
    if (title) data.title = title.trim();
    if (content) data.content = content.trim();
    const updatedPost = await prisma.post.update({ where: { id }, data });
    res.status(200).json({ status: "success", data: updatedPost });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function deletePost(req: Request, res: Response) {
  try {
    const { courseId, id } = req.params;
    const post = await prisma.post.findFirst({ where: { courseId, id, course: { deletedAt: null } } });
    if (!post) return res.status(404).json({ status: "fail", message: "Post not found" });
    if (post.uploadedBy !== res.locals.user.id)
      return res.status(403).json({ status: "fail", message: "Unauthorized" });
    await prisma.post.delete({ where: { id } });
    res.status(200).json({ status: "success", message: "Post deleted successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}
