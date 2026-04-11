import { google } from "googleapis";

const GOOGLE_CALENDAR_ID = process.env.CALENDAR_ID;
const TIMEZONE = process.env.TIMEZONE;

const auth = new google.auth.GoogleAuth({
  keyFile: "service-account.json",
  scopes: ["https://www.googleapis.com/auth/calendar"],
});

const calendar = google.calendar({
  version: "v3",
  auth,
});

export const createCalendarEvent = async ({
  summary,
  description,
  startDate,
  endDate,
}: {
  summary: string;
  description?: string;
  startDate: Date;
  endDate: Date;
}) => {
  try {
    const event = {
      summary,
      description: description ? description : null,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: TIMEZONE ?? "Africa/Cairo",
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: TIMEZONE ?? "Africa/Cairo",
      },
    };
    const response = await calendar.events.insert({
      calendarId: GOOGLE_CALENDAR_ID!,
      requestBody: event,
    });

    return response.data;
  } catch (error) {
    console.error("Google Calendar Error:", error);
    return null;
  }
};
