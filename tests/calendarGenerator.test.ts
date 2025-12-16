import { describe, it, expect, spyOn, beforeEach, afterEach } from "bun:test";
import axios from "axios";
import getUserCalendar from "../tools/calendarGenerator";

describe("calendarGenerator 错误处理", () => {
  let axiosGetSpy: any;

  afterEach(() => {
    axiosGetSpy?.mockRestore();
  });

  it("应该处理 Moodle API 返回的错误响应 (invalidtoken)", async () => {
    axiosGetSpy = spyOn(axios, "get").mockResolvedValue({
      data: {
        errorcode: "invalidtoken",
        exception: "moodle_exception",
        message: "Invalid token - token not found",
      },
    });

    await expect(getUserCalendar("invalid_token", 0)).rejects.toThrow(
      "Moodle API Error: invalidtoken - Invalid token - token not found"
    );
  });

  it("应该处理网络错误", async () => {
    const networkError = new Error("Network Error");
    (networkError as any).isAxiosError = true;

    axiosGetSpy = spyOn(axios, "get").mockRejectedValue(networkError);

    await expect(getUserCalendar("some_token", 0)).rejects.toThrow(
      "Failed to fetch data from Moodle: Network Error"
    );
  });

  it("应该成功处理正常的响应", async () => {
    axiosGetSpy = spyOn(axios, "get").mockResolvedValue({
      data: {
        events: [
          {
            id: 1,
            name: "Test Event",
            description: "<p>Test Description</p>",
            descriptionformat: 1,
            location: "Test Location",
            categoryid: null,
            groupid: null,
            userid: 123,
            repeatid: null,
            eventcount: null,
            component: "mod_assign",
            modulename: "assign",
            activityname: "Test Assignment",
            activitystr: "Assignment",
            instance: 1,
            eventtype: "due",
            timestart: 1702800000,
            timeduration: 3600,
            timesort: 1702800000,
            timeusermidnight: 1702771200,
            visible: 1,
            timemodified: 1702700000,
            overdue: false,
            course: {
              id: 1,
              fullname: "Test Course",
              shortname: "TEST101",
              idnumber: "",
              summary: "",
              summaryformat: 1,
              startdate: 1702000000,
              enddate: 1710000000,
              visible: true,
              showactivitydates: true,
              showcompletionconditions: true,
              fullnamedisplay: "Test Course",
              viewurl: "https://example.com/course/view.php?id=1",
              courseimage: "",
              progress: null,
              hasprogress: false,
              isfavourite: false,
              hidden: false,
              showshortname: false,
              coursecategory: "Category",
            },
            subscription: {
              displayeventsource: true,
            },
            canedit: true,
            candelete: true,
            deleteurl: "https://example.com/delete",
            editurl: "https://example.com/edit",
            viewurl: "https://example.com/view",
            formattedtime: "1:00 PM - 2:00 PM",
            formattedlocation: "Test Location",
            isactionevent: true,
            iscourseevent: false,
            iscategoryevent: false,
            groupname: null,
            normalisedeventtype: "due",
            normalisedeventtypetext: "Due",
            action: {
              name: "View submission",
              url: "https://example.com/mod/assign/view.php?id=1",
              itemcount: 1,
              actionable: true,
              showitemcount: false,
            },
            purpose: "assignment",
          },
        ],
        firstid: 1,
        lastid: 1,
      },
    });

    const calendar = await getUserCalendar("valid_token", 15);
    const icsString = calendar.toString();

    // 验证生成的 ICS 包含必要的信息
    expect(icsString).toContain("BEGIN:VCALENDAR");
    expect(icsString).toContain("Test Assignment");
    expect(icsString).toContain("Test Course");
    expect(icsString).toContain("BEGIN:VALARM");
  });
});
