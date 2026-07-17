export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function assertString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ValidationError(`${field} is required and must be a non-empty string`);
  }
  return value.trim();
}

export function assertOptionalString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') throw new ValidationError('Expected string value');
  return value.trim() || undefined;
}

export function assertNumber(value: unknown, field: string): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new ValidationError(`${field} must be a valid number`);
  }
  return value;
}

export function assertOptionalNumber(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new ValidationError('Expected valid number value');
  }
  return value;
}

export function assertArray<T>(value: unknown, field: string): T[] {
  if (!Array.isArray(value)) {
    throw new ValidationError(`${field} must be an array`);
  }
  return value as T[];
}

export function assertEmail(value: unknown, field = 'email'): string {
  const str = assertString(value, field);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(str)) {
    throw new ValidationError(`${field} must be a valid email address`);
  }
  return str;
}

export function assertOptionalEmail(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  return assertEmail(value);
}

export function assertUuid(value: unknown, field: string): string {
  const str = assertString(value, field);
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(str)) {
    throw new ValidationError(`${field} must be a valid UUID`);
  }
  return str;
}
