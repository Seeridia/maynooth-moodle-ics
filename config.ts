// Centralized environment configuration and validation
// Bun automatically loads .env at runtime, but we still validate values here.

type Env = {
  PORT: number;
  MOODLE_URL: string;
  MOODLE_TIMEOUT_MS: number;
};

function parseInteger(
  name: string,
  value: string | undefined,
  fallback: number,
  min: number,
  max: number
): number {
  if (value === undefined || value.trim() === "") return fallback;
  const num = Number(value);
  if (!Number.isInteger(num) || num < min || num > max) {
    throw new Error(
      `Environment variable ${name} must be an integer between ${min} and ${max}, got: ${value}`
    );
  }
  return num;
}

function parseUrl(name: string, value: string | undefined, fallback: string) {
  const rawValue = value?.trim() || fallback;

  try {
    const url = new URL(rawValue);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("unsupported protocol");
    }
    return url.toString();
  } catch {
    throw new Error(
      `Environment variable ${name} must be a valid HTTP(S) URL, got: ${rawValue}`
    );
  }
}

const env: Env = {
  PORT: parseInteger("PORT", process.env.PORT, 3000, 1, 65535),
  MOODLE_URL: parseUrl(
    "MOODLE_URL",
    process.env.MOODLE_URL,
    "https://moodle.maynoothuniversity.ie/webservice/rest/server.php"
  ),
  MOODLE_TIMEOUT_MS: parseInteger(
    "MOODLE_TIMEOUT_MS",
    process.env.MOODLE_TIMEOUT_MS,
    10_000,
    1_000,
    60_000
  ),
};

export const PORT = env.PORT;
export const MOODLE_URL = env.MOODLE_URL;
export const MOODLE_TIMEOUT_MS = env.MOODLE_TIMEOUT_MS;
