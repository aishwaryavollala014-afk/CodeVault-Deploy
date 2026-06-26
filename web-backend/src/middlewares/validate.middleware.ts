import type { Request, Response, NextFunction } from 'express';
import type { ZodTypeAny } from 'zod';
import { ValidationError } from '../utils/errors';

/**
 * Validates and replaces a request segment with the parsed (typed) result.
 * Unknown fields are rejected by `.strict()` schemas — mass-assignment defense.
 */
function validate(segment: 'body' | 'query' | 'params', schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[segment]);
    if (!result.success) {
      throw new ValidationError(
        'Validation failed',
        result.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      );
    }
    // query/params are read-only getters on newer Express; assign defensively.
    Object.assign(req[segment] as object, result.data);
    next();
  };
}

export const validateBody = (schema: ZodTypeAny) => validate('body', schema);
export const validateQuery = (schema: ZodTypeAny) => validate('query', schema);
export const validateParams = (schema: ZodTypeAny) => validate('params', schema);
