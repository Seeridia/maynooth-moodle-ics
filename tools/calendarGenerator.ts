import axios from "axios";
import type { Response, Event, ErrorResponse } from "../types/event";
import ical from "ical-generator";
import { htmlToText } from "html-to-text";
import { MOODLE_TIMEOUT_MS, MOODLE_URL } from "../config";
import {
  InvalidMoodleResponseError,
  InvalidTokenError,
  UpstreamError,
} from "../types/errors";

const PAGE_SIZE = 50;
const MAX_PAGES = 20;
const INVALID_TOKEN_CODES = new Set(["invalidtoken", "accessexception"]);

/**
 * 从 Moodle 获取用户事件数据
 * @param wstoken Moodle Web Service Token
 * @returns Moodle API Response
 */
async function fetchPage(
  wstoken: string,
  afterEventId: number
): Promise<Response> {
  try {
    const params = {
      wsfunction: "core_calendar_get_action_events_by_timesort",
      limittononsuspendedevents: 1,
      moodlewsrestformat: "json",
      wstoken,
      aftereventid: afterEventId,
      limitnum: PAGE_SIZE,
    };

    const response = await axios.get<Response | ErrorResponse>(MOODLE_URL, {
      params,
      timeout: MOODLE_TIMEOUT_MS,
    });
    const data = response.data;

    // 检查是否为错误响应
    if (isErrorResponse(data)) {
      if (INVALID_TOKEN_CODES.has(data.errorcode)) {
        throw new InvalidTokenError(data.message);
      }
      throw new UpstreamError(
        `Moodle API error: ${data.errorcode} - ${data.message}`
      );
    }

    if (!isSuccessResponse(data)) throw new InvalidMoodleResponseError();
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const timedOut = error.code === "ECONNABORTED" || error.code === "ETIMEDOUT";
      throw new UpstreamError(
        timedOut ? "Moodle request timed out" : "Failed to fetch data from Moodle",
        timedOut ? 504 : 502
      );
    }
    throw error;
  }
}

export async function fetchMoodleEvents(wstoken: string): Promise<Event[]> {
  const events = new Map<number, Event>();
  let afterEventId = 0;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const data = await fetchPage(wstoken, afterEventId);
    for (const event of data.events) events.set(event.id, event);

    if (data.events.length < PAGE_SIZE) return [...events.values()];
    if (data.lastid <= afterEventId) {
      throw new InvalidMoodleResponseError("Moodle pagination did not advance");
    }
    afterEventId = data.lastid;
  }

  throw new InvalidMoodleResponseError("Moodle returned too many event pages");
}

/**
 * 检查数据是否为错误响应
 * @param data 待检查的数据
 * @returns 是否为错误响应
 */
function isErrorResponse(data: unknown): data is ErrorResponse {
  return (
    !!data &&
    typeof data === "object" &&
    "errorcode" in data &&
    "exception" in data &&
    "message" in data
  );
}

function isSuccessResponse(data: unknown): data is Response {
  if (!data || typeof data !== "object") return false;
  const candidate = data as Partial<Response>;
  return (
    Array.isArray(candidate.events) &&
    typeof candidate.firstid === "number" &&
    typeof candidate.lastid === "number"
  );
}

/**
 * 生成 ICS 日历
 * @param events 事件列表
 * @param leadTime 提前提醒时间（分钟）
 * @returns ICS 日历对象
 */
export function generateICS(events: Event[], leadTime: number) {
  const calendar = ical({ name: "Moodle Events" });

  for (const event of events) {
    const courseName = event.course?.fullname || "Moodle";
    const actionName = event.action?.name || "Open in Moodle";
    const actionUrl = event.action?.url || event.viewurl || event.url;
    const description =
      `${courseName}\n\n` +
      `${event.description ? htmlToText(event.description) + "\n\n" : ""}` +
      `${actionUrl ? `${actionName}: ${actionUrl}` : ""}`;

    const summary = event.activityname || event.name || "Untitled";
    const start = new Date(event.timestart * 1000);
    const duration = Number.isFinite(event.timeduration)
      ? event.timeduration
      : 0;

    const eventObj = calendar.createEvent({
      id: `moodle-${event.id}@maynooth-moodle-ics`,
      start,
      ...(duration > 0
        ? { end: new Date((event.timestart + duration) * 1000) }
        : {}),
      summary,
      description,
      location: event.location,
      url: actionUrl,
      lastModified: new Date(event.timemodified * 1000),
    });

    if (leadTime >= 0) {
      eventObj.createAlarm({
        trigger: leadTime * 60,
        description: `Reminder: ${summary} is due in ${leadTime} minutes.`,
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
  const events = await fetchMoodleEvents(token);
  return generateICS(events, leadTime);
}
