import express from "express";
import type { NextFunction, Request, Response } from "express";
import getUserCalendar from "./tools/calendarGenerator";
import { PORT } from "./config";
import { AppError, BadRequestError } from "./types/errors";

export const app = express();
app.disable("x-powered-by");

export function parseToken(value: unknown): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new BadRequestError("Missing token parameter");
  }
  const token = value.trim();
  if (token.length > 512) throw new BadRequestError("Token is too long");
  return token;
}

export function parseLeadTime(value: unknown): number {
  if (value === undefined) return 0;
  if (typeof value !== "string" || !/^-?\d+$/.test(value)) {
    throw new BadRequestError("leadTime must be an integer");
  }
  const leadTime = Number(value);
  if (!Number.isSafeInteger(leadTime) || leadTime < -1 || leadTime > 10_080) {
    throw new BadRequestError("leadTime must be between -1 and 10080");
  }
  return leadTime;
}

app.get("/", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "maynooth-moodle-ics",
    endpoints: {
      calendar: "/calendar?token=YOUR_TOKEN",
    },
  });
});

app.get("/healthz", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.get("/calendar", async (req: Request, res: Response) => {
  const token = parseToken(req.query.token);
  const leadTime = parseLeadTime(req.query.leadTime);
  const calendar = await getUserCalendar(token, leadTime);

  res.set({
    "Content-Type": "text/calendar; charset=utf-8",
    "Content-Disposition": 'attachment; filename="calendar.ics"',
    "Cache-Control": "private, no-store",
  });

  res.send(calendar.toString());
});

app.use(
  (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof AppError) {
      if (error.statusCode >= 500) {
        console.error("Calendar generation failed:", error.message);
      }
      res.status(error.statusCode).json({
        error: error.expose ? error.message : "Calendar service unavailable",
        code: error.code,
      });
      return;
    }

    console.error("Unexpected calendar generation failure:", error);
    res.status(500).json({
      error: "Internal Server Error",
      code: "INTERNAL_ERROR",
    });
  }
);

if (import.meta.main) {
  app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}
