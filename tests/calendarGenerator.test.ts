import { afterEach, describe, expect, it, spyOn } from "bun:test";
import axios from "axios";
import type { Event, Response } from "../types/event";
import {
  fetchMoodleEvents,
  generateICS,
  default as getUserCalendar,
} from "../tools/calendarGenerator";
import {
  InvalidMoodleResponseError,
  InvalidTokenError,
  UpstreamError,
} from "../types/errors";

function createEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 1,
    name: "Test Event",
    activityname: "Test Assignment",
    description: "<p>Test Description</p>",
    location: "Test Location",
    timestart: 1_702_800_000,
    timeduration: 3_600,
    timemodified: 1_702_700_000,
    course: {
      id: 1,
      fullname: "Test Course",
      shortname: "TEST101",
    },
    action: {
      name: "View submission",
      url: "https://example.com/assignment/1",
    },
    ...overrides,
  } as Event;
}

function createResponse(events: Event[], lastid = events.at(-1)?.id ?? 0): Response {
  return {
    events,
    firstid: events.at(0)?.id ?? 0,
    lastid,
  };
}

describe("Moodle 数据获取", () => {
  let axiosGetSpy: ReturnType<typeof spyOn> | undefined;

  afterEach(() => axiosGetSpy?.mockRestore());

  it("将无效 token 转换为明确的认证错误", async () => {
    axiosGetSpy = spyOn(axios, "get").mockResolvedValue({
      data: {
        errorcode: "invalidtoken",
        exception: "moodle_exception",
        message: "Invalid token - token not found",
      },
    });

    await expect(getUserCalendar("invalid_token", 0)).rejects.toBeInstanceOf(
      InvalidTokenError
    );
  });

  it("隐藏上游网络错误细节", async () => {
    const networkError = new Error("socket details");
    (networkError as Error & { isAxiosError: boolean }).isAxiosError = true;
    axiosGetSpy = spyOn(axios, "get").mockRejectedValue(networkError);

    await expect(getUserCalendar("some_token", 0)).rejects.toEqual(
      new UpstreamError("Failed to fetch data from Moodle", 502)
    );
  });

  it("拒绝结构异常的成功响应", async () => {
    axiosGetSpy = spyOn(axios, "get").mockResolvedValue({ data: {} });

    await expect(fetchMoodleEvents("token")).rejects.toBeInstanceOf(
      InvalidMoodleResponseError
    );
  });

  it("使用 lastid 获取后续页面", async () => {
    const firstPage = Array.from({ length: 50 }, (_, index) =>
      createEvent({ id: index + 1 })
    );
    axiosGetSpy = spyOn(axios, "get")
      .mockResolvedValueOnce({ data: createResponse(firstPage, 50) })
      .mockResolvedValueOnce({
        data: createResponse([createEvent({ id: 51 })], 51),
      });

    const events = await fetchMoodleEvents("token");

    expect(events).toHaveLength(51);
    expect(axiosGetSpy).toHaveBeenCalledTimes(2);
    expect(axiosGetSpy.mock.calls[1]?.[1]).toMatchObject({
      params: { aftereventid: 50, limitnum: 50 },
      timeout: 10_000,
    });
  });
});

describe("ICS 生成", () => {
  it("生成稳定 UID、链接、更新时间和提醒", () => {
    const ics = generateICS([createEvent()], 15).toString();

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("UID:moodle-1@maynooth-moodle-ics");
    expect(ics).toContain("Test Assignment");
    expect(ics).toContain("Test Course");
    expect(ics).toContain("BEGIN:VALARM");
    expect(ics).toContain("URL;VALUE=URI:https://example.com/assignment/1");
  });

  it("零时长事件不生成无效的 DTEND", () => {
    const ics = generateICS([createEvent({ timeduration: 0 })], -1).toString();

    expect(ics).not.toContain("DTEND");
    expect(ics).not.toContain("BEGIN:VALARM");
  });

  it("缺少 activityname 时使用事件名称", () => {
    const ics = generateICS(
      [createEvent({ activityname: "", name: "Fallback title" })],
      -1
    ).toString();

    expect(ics).toContain("SUMMARY:Fallback title");
  });
});
