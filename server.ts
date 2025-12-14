import express from "express";
import type { Request, Response } from "express";
import getUserCalendar from "./tools/calendarGenerator";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "maynooth-moodle-ics",
    endpoints: {
      calendar: "/calendar?token=YOUR_TOKEN",
    },
  });
});

app.get("/calendar", async (req: Request, res: Response) => {
  try {
    const token = req.query.token as string;
    const leadTime = parseInt(req.query.leadTime as string) || 0;

    if (!token) {
      res.status(400).send("Error: Missing token parameter");
      return;
    }

    const calendar = await getUserCalendar(token, leadTime);

    res.set({
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="calendar.ics"',
    });

    res.send(calendar.toString());
  } catch (error) {
    console.error("Calendar generation failed:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    res.status(500).json({ error: errorMessage });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
