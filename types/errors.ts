export class AppError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly code: string,
    readonly expose = false
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class InvalidTokenError extends AppError {
  constructor(message = "Moodle rejected the supplied token") {
    super(message, 401, "INVALID_TOKEN", true);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string) {
    super(message, 400, "BAD_REQUEST", true);
  }
}

export class UpstreamError extends AppError {
  constructor(message: string, statusCode = 502) {
    super(message, statusCode, "MOODLE_UNAVAILABLE");
  }
}

export class InvalidMoodleResponseError extends AppError {
  constructor(message = "Moodle returned an invalid response") {
    super(message, 502, "INVALID_MOODLE_RESPONSE");
  }
}
