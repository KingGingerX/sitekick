import { describe, it, expect } from 'vitest';
import {
  assertString,
  assertNumber,
  assertUuid,
  assertEmail,
  assertArray,
  ValidationError,
} from '@/lib/validate';

describe('validate', () => {
  it('assertString passes for valid string', () => {
    expect(assertString('hello', 'name')).toBe('hello');
  });

  it('assertString trims whitespace', () => {
    expect(assertString('  hello  ', 'name')).toBe('hello');
  });

  it('assertString throws on empty string', () => {
    expect(() => assertString('', 'name')).toThrow(ValidationError);
  });

  it('assertString throws on non-string', () => {
    expect(() => assertString(123 as unknown as string, 'name')).toThrow(ValidationError);
  });

  it('assertNumber passes for valid number', () => {
    expect(assertNumber(42, 'age')).toBe(42);
  });

  it('assertNumber throws on NaN', () => {
    expect(() => assertNumber(NaN, 'age')).toThrow(ValidationError);
  });

  it('assertUuid passes for valid UUID', () => {
    expect(assertUuid('550e8400-e29b-41d4-a716-446655440000', 'id')).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('assertUuid throws on invalid UUID', () => {
    expect(() => assertUuid('not-a-uuid', 'id')).toThrow(ValidationError);
  });

  it('assertEmail passes for valid email', () => {
    expect(assertEmail('test@example.com')).toBe('test@example.com');
  });

  it('assertEmail throws on invalid email', () => {
    expect(() => assertEmail('not-an-email')).toThrow(ValidationError);
  });

  it('assertArray passes for valid array', () => {
    expect(assertArray<number>([1, 2, 3], 'items')).toEqual([1, 2, 3]);
  });

  it('assertArray throws on non-array', () => {
    expect(() => assertArray('oops', 'items')).toThrow(ValidationError);
  });
});
