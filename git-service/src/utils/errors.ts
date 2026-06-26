/** Typed error hierarchy (mirrors web-backend) for consistent error envelopes. */
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: Array<{ field: string; message: string }>;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    details?: Array<{ field: string; message: string }>,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: AppError['details']) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}
export class UnauthenticatedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHENTICATED');
  }
}
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}
export class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(message, 404, 'NOT_FOUND');
  }
}
export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMITED');
  }
}
/** Platform session expired — surfaced to the UI as a "Reconnect" prompt. */
export class ExpiredSessionError extends AppError {
  constructor(message = 'Platform session expired — reconnect to resume sync') {
    super(message, 409, 'SESSION_EXPIRED');
  }
}
export class UpstreamError extends AppError {
  constructor(message = 'Upstream service error') {
    super(message, 502, 'UPSTREAM_ERROR');
  }
}
export class InternalError extends AppError {
  constructor(message = 'Internal server error') {
    super(message, 500, 'INTERNAL');
  }
}
