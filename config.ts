// Centralized environment configuration and validation
// Bun automatically loads .env at runtime, but we still validate values here.

type Env = {
  PORT: number;
  MOODLE_URL: string;
};

function required(name: string, value: string | undefined): string {
  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parseNumber(
  name: string,
  value: string | undefined,
  fallback: number
): number {
  if (value === undefined || value.trim() === "") return fallback;
  const num = Number(value);
  if (Number.isNaN(num)) {
    throw new Error(
      `Environment variable ${name} must be a number, got: ${value}`
    );
  }
  return num;
}

const env: Env = {
  PORT: parseNumber("PORT", process.env.PORT, 3000),
  MOODLE_URL: required("MOODLE_URL", process.env.MOODLE_URL),
};

export const PORT = env.PORT;
export const MOODLE_URL = env.MOODLE_URL;
