import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { app, parseLeadTime, parseToken } from "../server";
import { BadRequestError } from "../types/errors";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";

describe("官网与现有接口", () => {
  let server: Server;
  let origin: string;

  beforeAll(async () => {
    server = await new Promise<Server>((resolve) => {
      const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
    });
    origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
      server.closeIdleConnections();
    });
  });

  it("首页提供 HTML 指引及凭证保护策略", async () => {
    const response = await fetch(origin);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("content-security-policy")).toContain("connect-src 'none'");
    const html = await response.text();
    expect(html).toContain('id="subscription-form"');
    expect(html).toContain('id="get-key"');
    expect(html).toContain('id="import"');
  });

  it("官网所需静态文件可访问", async () => {
    for (const asset of ["site.css", "site.js", "favicon.svg"]) {
      const response = await fetch(`${origin}/assets/${asset}`);
      expect(response.status).toBe(200);
      expect((await response.text()).length).toBeGreaterThan(0);
    }
  });

  it("保持健康检查响应", async () => {
    const response = await fetch(`${origin}/healthz`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });

  it("保持订阅接口参数校验，不误返回官网", async () => {
    const response = await fetch(`${origin}/calendar`);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Missing token parameter",
      code: "BAD_REQUEST",
    });
  });
});

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
