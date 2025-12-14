import axios from "axios";
import type { Response, Event } from "../types/event";
import ical from "ical-generator";
import { htmlToText } from "html-to-text";

const MOODLE_URL =
  "https://moodle.maynoothuniversity.ie/webservice/rest/server.php";

async function fetchData(wstoken: string): Promise<Response> {
  const params = {
    wsfunction: "core_calendar_get_action_events_by_timesort",
    limittononsuspendedevents: 1,
    moodlewsrestformat: "json",
    wstoken,
  };

  const response = await axios.get<Response>(MOODLE_URL, { params });
  return response.data;
}

function generateICS(events: Event[], leadTime: number) {
  const calendar = ical({ name: "Moodle Events" });

  for (const event of events) {
    const description =
      `${event.course.fullname}\n\n` +
      `${event.description ? htmlToText(event.description) + "\n\n" : ""}` +
      `${event.action.name}: ${event.action.url}`;

    const summary = event.activityname || "No Title";

    const eventObj = calendar.createEvent({
      start: new Date(event.timestart * 1000),
      end: new Date((event.timestart + event.timeduration) * 1000),
      summary,
      description,
      location: event.location,
    });

    if (leadTime >= 0) {
      eventObj.createAlarm({
        trigger: leadTime * 60,
        description: `Reminder: ${summary} starts in ${leadTime} minutes.`,
      });
    }
  }

  return calendar;
}

export default async function getUserCalendar(token: string, leadTime: number) {
  const data = await fetchData(token);
  return generateICS(data.events, leadTime);
}
