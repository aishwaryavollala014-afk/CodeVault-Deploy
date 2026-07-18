import { describe, it, expect } from 'vitest';
import {
  AppError,
  ValidationError,
  UnauthenticatedError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  ExpiredSessionError,
  UpstreamError,
  ServiceUnavailableError,
  InternalError,
} from '../src/utils/errors';

describe('AppError', () => {
  it('carries statusCode, code, message and is an Error', () => {
    const e = new AppError(418, 'TEAPOT', 'I am a teapot');
    expect(e).toBeInstanceOf(Error);
    expect(e.statusCode).toBe(418);
    expect(e.code).toBe('TEAPOT');
    expect(e.message).toBe('I am a teapot');
    expect(e.name).toBe('AppError');
  });
});

describe('typed errors map to the right status + code', () => {
  const cases: [new (m?: string) => AppError, number, string, string][] = [
    [ValidationError, 400, 'VALIDATION', 'ValidationError'],
    [UnauthenticatedError, 401, 'UNAUTHENTICATED', 'UnauthenticatedError'],
    [ForbiddenError, 403, 'FORBIDDEN', 'ForbiddenError'],
    [NotFoundError, 404, 'NOT_FOUND', 'NotFoundError'],
    [RateLimitError, 429, 'RATE_LIMITED', 'RateLimitError'],
    [ExpiredSessionError, 409, 'SESSION_EXPIRED', 'ExpiredSessionError'],
    [UpstreamError, 502, 'UPSTREAM', 'UpstreamError'],
    [ServiceUnavailableError, 503, 'SERVICE_UNAVAILABLE', 'ServiceUnavailableError'],
    [InternalError, 500, 'INTERNAL', 'InternalError'],
  ];

  it.each(cases)('%o → %i / %s', (Ctor, status, code, name) => {
    const e = new Ctor();
    expect(e).toBeInstanceOf(AppError);
    expect(e).toBeInstanceOf(Error);
    expect(e.statusCode).toBe(status);
    expect(e.code).toBe(code);
    expect(e.name).toBe(name);
    expect(typeof e.message).toBe('string');
    expect(e.message.length).toBeGreaterThan(0);
  });

  it('accepts a custom message', () => {
    expect(new NotFoundError('no such repo').message).toBe('no such repo');
    expect(new ForbiddenError('not your connection').code).toBe('FORBIDDEN');
  });
});
