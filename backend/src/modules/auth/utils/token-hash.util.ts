import { createHash, timingSafeEqual } from 'crypto';

export const hashToken = (token: string): string => {
  return createHash('sha256').update(token).digest('hex');
};

export const tokenHashesEqual = (left: string, right: string): boolean => {
  const leftBuffer = Buffer.from(left, 'hex');
  const rightBuffer = Buffer.from(right, 'hex');

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
};
