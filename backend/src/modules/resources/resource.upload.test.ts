describe("uploadToS3", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      AWS_REGION: "eu-central-1",
      AWS_ACCESS_KEY_ID: "ak",
      AWS_SECRET_ACCESS_KEY: "sk",
      AWS_S3_BUCKET: "bucket-1",
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("builds multer single-file middleware", () => {
    const single = jest.fn().mockReturnValue("single-middleware");
    const multerFactory = jest.fn().mockReturnValue({ single });
    const multerS3Factory = jest.fn().mockReturnValue("storage-engine");
    const s3Ctor = jest.fn().mockReturnValue({});

    jest.doMock("@aws-sdk/client-s3", () => ({ S3Client: s3Ctor }));
    jest.doMock("multer", () => multerFactory);
    jest.doMock("multer-s3", () => multerS3Factory);

    const { uploadToS3 } = require("./resource.upload") as typeof import("./resource.upload");

    const middleware = uploadToS3();

    expect(s3Ctor).toHaveBeenCalledWith({
      region: "eu-central-1",
      credentials: {
        accessKeyId: "ak",
        secretAccessKey: "sk",
      },
    });
    expect(multerS3Factory).toHaveBeenCalled();
    expect(multerFactory).toHaveBeenCalledWith({ storage: "storage-engine" });
    expect(single).toHaveBeenCalledWith("file");
    expect(middleware).toBe("single-middleware");
  });
});
