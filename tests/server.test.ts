import { describe, expect, it } from "bun:test";
import { parseLeadTime, parseToken } from "../server";
import { BadRequestError } from "../types/errors";

describe("HTTP 参数校验", () => {
  it("清理 token 两端空白", () => {
    expect(parseToken("  abc123  ")).toBe("abc123");
  });

  it("拒绝缺失或重复的 token", () => {
    expect(() => parseToken(undefined)).toThrow(BadRequestError);
    expect(() => parseToken(["one", "two"])).toThrow(BadRequestError);
  });

  it("解析合法的提醒时间", () => {
    expect(parseLeadTime(undefined)).toBe(0);
    expect(parseLeadTime("15")).toBe(15);
    expect(parseLeadTime("-1")).toBe(-1);
  });

  it("拒绝模糊或超出范围的提醒时间", () => {
    expect(() => parseLeadTime("15abc")).toThrow(BadRequestError);
    expect(() => parseLeadTime("10081")).toThrow(BadRequestError);
    expect(() => parseLeadTime(["10", "20"])).toThrow(BadRequestError);
  });
});
