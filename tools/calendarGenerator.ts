import axios from "axios";
import type { Response, Event, ErrorResponse } from "../types/event";
import ical from "ical-generator";
import { htmlToText } from "html-to-text";
import { MOODLE_URL } from "../config";

/**
 * 从 Moodle 获取用户事件数据
 * @param wstoken Moodle Web Service Token
 * @returns Moodle API Response
 */
async function fetchData(wstoken: string): Promise<Response> {
  try {
    const params = {
      wsfunction: "core_calendar_get_action_events_by_timesort",
      limittononsuspendedevents: 1,
      moodlewsrestformat: "json",
      wstoken,
    };

    const response = await axios.get<Response | ErrorResponse>(MOODLE_URL, {
      params,
    });
    const data = response.data;

    // 检查是否为错误响应
    if (isErrorResponse(data)) {
      throw new Error(`Moodle API Error: ${data.errorcode} - ${data.message}`);
    }

    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to fetch data from Moodle: ${error.message}`);
    }
    throw error;
  }
}

/**
 * 检查数据是否为错误响应
 * @param data 待检查的数据
 * @returns 是否为错误响应
 */
function isErrorResponse(data: any): data is ErrorResponse {
  return (
    data &&
    typeof data === "object" &&
    "errorcode" in data &&
    "exception" in data &&
    "message" in data
  );
}

/**
 * 生成 ICS 日历
 * @param events 事件列表
 * @param leadTime 提前提醒时间（分钟）
 * @returns ICS 日历对象
 */
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

/**
 * 获取用户 ICS 日历
 * @param token Moodle Web Service Token
 * @param leadTime 提前提醒时间（分钟）
 * @returns ICS 日历对象
 */
export default async function getUserCalendar(token: string, leadTime: number) {
  const data = await fetchData(token);
  return generateICS(data.events, leadTime);
}
