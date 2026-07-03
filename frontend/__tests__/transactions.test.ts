import { describe, it, expect } from 'vitest';
import type { TransactionLifecycle } from '@/shared/types';

describe('Transaction Lifecycle', () => {
  const validTransitions: Record<TransactionLifecycle, TransactionLifecycle[]> = {
    pending: ['processing', 'failed'],
    processing: ['confirmed', 'failed'],
    confirmed: [],
    failed: ['pending'], // retry
  };

  function canTransition(from: TransactionLifecycle, to: TransactionLifecycle): boolean {
    return validTransitions[from]?.includes(to) || false;
  }

  it('should allow pending -> processing', () => {
    expect(canTransition('pending', 'processing')).toBe(true);
  });

  it('should allow processing -> confirmed', () => {
    expect(canTransition('processing', 'confirmed')).toBe(true);
  });

  it('should allow processing -> failed', () => {
    expect(canTransition('processing', 'failed')).toBe(true);
  });

  it('should allow failed -> pending (retry)', () => {
    expect(canTransition('failed', 'pending')).toBe(true);
  });

  it('should NOT allow confirmed -> any', () => {
    expect(canTransition('confirmed', 'pending')).toBe(false);
    expect(canTransition('confirmed', 'processing')).toBe(false);
    expect(canTransition('confirmed', 'failed')).toBe(false);
  });

  it('should NOT allow pending -> confirmed (must go through processing)', () => {
    expect(canTransition('pending', 'confirmed')).toBe(false);
  });
});
