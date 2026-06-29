// Typed application errors. error.middleware maps these to HTTP status + JSON.

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Invalid request') {
    super(400, 'VALIDATION', message);
  }
}

export class UnauthenticatedError extends AppError {
  constructor(message = 'Authentication required') {
    super(401, 'UNAUTHENTICATED', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, 'FORBIDDEN', message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(404, 'NOT_FOUND', message);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(429, 'RATE_LIMITED', message);
  }
}

// A platform session token has expired — surface "Reconnect" to the user.
export class ExpiredSessionError extends AppError {
  constructor(message = 'Platform session expired') {
    super(409, 'SESSION_EXPIRED', message);
  }
}

// An upstream platform/GitHub call failed.
export class UpstreamError extends AppError {
  constructor(message = 'Upstream service error') {
    super(502, 'UPSTREAM', message);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service unavailable') {
    super(503, 'SERVICE_UNAVAILABLE', message);
  }
}

export class InternalError extends AppError {
  constructor(message = 'Internal server error') {
    super(500, 'INTERNAL', message);
  }
}
