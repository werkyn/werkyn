export class AppError extends Error {
  statusCode: number;
  error: string;

  constructor(statusCode: number, error: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.error = error;
    this.name = this.constructor.name;
  }
}

export class ValidationError extends AppError {
  details?: Array<{ field: string; message: string }>;

  constructor(
    message: string,
    details?: Array<{ field: string; message: string }>,
  ) {
    super(400, "Bad Request", message);
    this.details = details;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(401, "Unauthorized", message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(403, "Forbidden", message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(404, "Not Found", message);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super(409, "Conflict", message);
  }
}

export class GoneError extends AppError {
  constructor(message = "Gone") {
    super(410, "Gone", message);
  }
}

export class LockedError extends AppError {
  retryAfter: number;

  constructor(message = "Account locked", retryAfter: number) {
    super(423, "Locked", message);
    this.retryAfter = retryAfter;
  }
}
