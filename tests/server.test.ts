import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { app, parseLeadTime, parseToken } from "../server";
import { BadRequestError } from "../types/errors";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createHash } from "node:crypto";

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

  it("样式和脚本使用内容版本号，避免 CDN 返回旧资源", async () => {
    const html = await (await fetch(origin)).text();
    for (const asset of ["site.css", "site.js"]) {
      const resource = html.match(new RegExp(`/assets/${asset.replace(".", "\\.")}\\?v=([a-f0-9]{12})`));
      expect(resource).not.toBeNull();
      const response = await fetch(`${origin}${resource![0]}`);
      expect(response.status).toBe(200);
      const content = await response.arrayBuffer();
      const version = createHash("sha256").update(new Uint8Array(content)).digest("hex").slice(0, 12);
      expect(resource![1]).toBe(version);
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
