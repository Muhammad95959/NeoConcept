describe("createCalendarEvent", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("creates calendar event and returns response data", async () => {
    process.env.CALENDAR_ID = "cal-1";
    process.env.TIMEZONE = "UTC";

    const insertMock = jest.fn().mockResolvedValue({ data: { id: "event-1" } });
    const calendarMock = jest.fn().mockReturnValue({ events: { insert: insertMock } });
    const googleAuthMock = jest.fn();

    jest.doMock("googleapis", () => ({
      google: {
        auth: { GoogleAuth: googleAuthMock },
        calendar: calendarMock,
      },
    }));

    const { createCalendarEvent } = require("../googleCalendar") as typeof import("../googleCalendar");

    const result = await createCalendarEvent({
      summary: "Lecture",
      description: "Chapter 1",
      startDate: new Date("2026-01-01T10:00:00.000Z"),
      endDate: new Date("2026-01-01T11:00:00.000Z"),
    });

    expect(result).toEqual({ id: "event-1" });
    expect(insertMock).toHaveBeenCalledWith({
      calendarId: "cal-1",
      requestBody: {
        summary: "Lecture",
        description: "Chapter 1",
        start: {
          dateTime: "2026-01-01T10:00:00.000Z",
          timeZone: "UTC",
        },
        end: {
          dateTime: "2026-01-01T11:00:00.000Z",
          timeZone: "UTC",
        },
      },
    });
  });

  it("returns null when google api insert fails", async () => {
    process.env.CALENDAR_ID = "cal-2";
    delete process.env.TIMEZONE;

    const insertMock = jest.fn().mockRejectedValue(new Error("boom"));
    const calendarMock = jest.fn().mockReturnValue({ events: { insert: insertMock } });
    const googleAuthMock = jest.fn();
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

    jest.doMock("googleapis", () => ({
      google: {
        auth: { GoogleAuth: googleAuthMock },
        calendar: calendarMock,
      },
    }));

    const { createCalendarEvent } = require("../googleCalendar") as typeof import("../googleCalendar");

    const result = await createCalendarEvent({
      summary: "Lecture",
      startDate: new Date("2026-01-01T10:00:00.000Z"),
      endDate: new Date("2026-01-01T11:00:00.000Z"),
    });

    expect(result).toBeNull();
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        requestBody: expect.objectContaining({
          description: null,
          start: expect.objectContaining({ timeZone: "Africa/Cairo" }),
        }),
      }),
    );

    consoleErrorSpy.mockRestore();
  });
});
