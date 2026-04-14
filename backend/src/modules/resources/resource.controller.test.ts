import { Request, Response } from "express";
import { Readable } from "stream";
import { HTTPStatusText } from "../../types/HTTPStatusText";
import { SuccessMessages } from "../../types/successMessages";
import { ResourceController } from "./resource.controller";
import { ResourceService } from "./resource.service";

jest.mock("./resource.service", () => ({
  ResourceService: {
    getResources: jest.fn(),
    getResourceById: jest.fn(),
    uploadResource: jest.fn(),
    downloadResource: jest.fn(),
    deleteResource: jest.fn(),
  },
}));

const createMockRes = () => {
  const res: Partial<Response> = {
    locals: {},
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
  };

  return res as Response;
};

describe("ResourceController", () => {
  const next = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getMany returns resources", async () => {
    const req = {} as Request;
    const res = createMockRes();
    const data = [{ id: "r-1" }];
    res.locals = { params: { courseId: "c-1" } };
    (ResourceService.getResources as jest.Mock).mockResolvedValue(data);

    await ResourceController.getMany(req, res, next);

    expect(ResourceService.getResources).toHaveBeenCalledWith("c-1");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: HTTPStatusText.SUCCESS, data });
  });

  it("get returns a single resource", async () => {
    const req = {} as Request;
    const res = createMockRes();
    const data = { id: "r-1" };
    res.locals = { params: { courseId: "c-1", id: "r-1" } };
    (ResourceService.getResourceById as jest.Mock).mockResolvedValue(data);

    await ResourceController.get(req, res, next);

    expect(ResourceService.getResourceById).toHaveBeenCalledWith("c-1", "r-1");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: HTTPStatusText.SUCCESS, data });
  });

  it("upload returns created resource", async () => {
    const req = {
      file: { originalname: "doc.pdf", mimetype: "application/pdf" },
    } as Request;
    const res = createMockRes();
    const data = { id: "r-2" };
    res.locals = { params: { courseId: "c-1" }, user: { id: "u-1" } };
    (ResourceService.uploadResource as jest.Mock).mockResolvedValue(data);

    await ResourceController.upload(req, res, next);

    expect(ResourceService.uploadResource).toHaveBeenCalledWith(
      "c-1",
      { originalname: "doc.pdf", mimetype: "application/pdf" },
      "u-1",
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ status: HTTPStatusText.SUCCESS, data });
  });

  it("download sets headers and pipes stream", async () => {
    const req = {} as Request;
    const res = createMockRes();
    res.locals = { params: { courseId: "c-1", id: "r-1" } };

    const stream = new Readable({ read() {} });
    const pipeSpy = jest.spyOn(stream, "pipe").mockReturnValue(res as any);

    (ResourceService.downloadResource as jest.Mock).mockResolvedValue({
      stream,
      contentType: "application/pdf",
      fileName: "my file.pdf",
    });

    await ResourceController.download(req, res, next);

    expect(ResourceService.downloadResource).toHaveBeenCalledWith("c-1", "r-1");
    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "application/pdf");
    expect(res.setHeader).toHaveBeenCalledWith("Content-Disposition", 'attachment; filename="my%20file.pdf"');
    expect(pipeSpy).toHaveBeenCalledWith(res);
  });

  it("delete returns success message", async () => {
    const req = {} as Request;
    const res = createMockRes();
    res.locals = { params: { courseId: "c-1", id: "r-1" } };

    await ResourceController.delete(req, res, next);

    expect(ResourceService.deleteResource).toHaveBeenCalledWith("c-1", "r-1");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: HTTPStatusText.SUCCESS,
      message: SuccessMessages.RESOURCE_DELETED,
    });
  });

  it("forwards service errors to next", async () => {
    const req = {} as Request;
    const res = createMockRes();
    const error = new Error("upload failed");
    res.locals = { params: { courseId: "c-1" }, user: { id: "u-1" } };
    (ResourceService.uploadResource as jest.Mock).mockRejectedValue(error);

    await ResourceController.upload({ file: {} } as Request, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
