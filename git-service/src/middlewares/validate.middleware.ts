import type { Request, Response, NextFunction } from 'express';
import type { ZodTypeAny } from 'zod';
import { ValidationError } from '../utils/errors';

function validate(segment: 'body' | 'query' | 'params', schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[segment]);
    if (!result.success) {
      const msg = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      next(new ValidationError(msg || 'Invalid request'));
      return;
    }
    // Assign parsed/coerced values back.
    (req as any)[segment] = result.data;
    next();
  };
}

export const validateBody = (schema: ZodTypeAny) => validate('body', schema);
export const validateQuery = (schema: ZodTypeAny) => validate('query', schema);
export const validateParams = (schema: ZodTypeAny) => validate('params', schema);
