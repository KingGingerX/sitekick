import { NextResponse } from 'next/server';
import { ValidationError } from './validate';
import { logger } from './logger';

export function apiError(error: unknown, status = 500): NextResponse {
  if (error instanceof ValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const message = error instanceof Error ? error.message : String(error);
  logger.error('API error', { message, stack: error instanceof Error ? error.stack : undefined });

  // Never leak internal details on 500s in production
  const safeMessage = process.env.NODE_ENV === 'production' ? 'Internal server error' : message;
  return NextResponse.json({ error: safeMessage }, { status });
}
