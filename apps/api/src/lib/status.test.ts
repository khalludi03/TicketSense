import { describe, it, expect } from 'bun:test';
import { isAutoClosable, statusTransition } from './status.js';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('isAutoClosable', () => {
  it('returns false when resolvedAt is missing', () => {
    expect(isAutoClosable(null, new Date())).toBe(false);
    expect(isAutoClosable(undefined, new Date())).toBe(false);
  });

  it('returns false exactly at 7 days', () => {
    const now = new Date('2026-10-19T12:00:00Z');
    const resolvedAt = new Date(now.getTime() - 7 * DAY_MS);
    expect(isAutoClosable(resolvedAt, now)).toBe(false);
  });

  it('returns true just after 7 days', () => {
    const now = new Date('2026-10-19T12:00:01Z');
    const resolvedAt = new Date(now.getTime() - 7 * DAY_MS - 1);
    expect(isAutoClosable(resolvedAt, now)).toBe(true);
  });
});

describe('statusTransition', () => {
  it('allows open -> in_progress for agent/admin', () => {
    expect(statusTransition('open', 'in_progress', { role: 'agent' }).allowed).toBe(true);
    expect(statusTransition('open', 'in_progress', { role: 'admin' }).allowed).toBe(true);
  });

  it('rejects open -> in_progress for customer', () => {
    const result = statusTransition('open', 'in_progress', { role: 'customer' });
    expect(result.allowed).toBe(false);
  });

  it('rejects open -> resolved and open -> closed', () => {
    expect(statusTransition('open', 'resolved', { role: 'agent' }).allowed).toBe(false);
    expect(statusTransition('open', 'closed', { role: 'admin' }).allowed).toBe(false);
  });

  it('allows in_progress -> resolved for agent/admin', () => {
    expect(statusTransition('in_progress', 'resolved', { role: 'agent' }).allowed).toBe(true);
    expect(statusTransition('in_progress', 'resolved', { role: 'admin' }).allowed).toBe(true);
  });

  it('rejects in_progress -> open and in_progress -> closed', () => {
    expect(statusTransition('in_progress', 'open', { role: 'agent' }).allowed).toBe(false);
    expect(statusTransition('in_progress', 'closed', { role: 'admin' }).allowed).toBe(false);
  });

  it('allows resolved -> open within 7 days for customer/agent', () => {
    const now = new Date('2026-10-19T12:00:00Z');
    const resolvedAt = new Date(now.getTime() - 6 * DAY_MS);
    expect(statusTransition('resolved', 'open', { role: 'customer', resolvedAt, now }).allowed).toBe(true);
    expect(statusTransition('resolved', 'open', { role: 'agent', resolvedAt, now }).allowed).toBe(true);
  });

  it('rejects resolved -> open after 7 days for customer/agent', () => {
    const now = new Date('2026-10-19T12:00:00Z');
    const resolvedAt = new Date(now.getTime() - 8 * DAY_MS);
    expect(statusTransition('resolved', 'open', { role: 'customer', resolvedAt, now }).allowed).toBe(false);
    expect(statusTransition('resolved', 'open', { role: 'agent', resolvedAt, now }).allowed).toBe(false);
  });

  it('allows resolved -> open after 7 days for admin', () => {
    const now = new Date('2026-10-19T12:00:00Z');
    const resolvedAt = new Date(now.getTime() - 8 * DAY_MS);
    expect(statusTransition('resolved', 'open', { role: 'admin', resolvedAt, now }).allowed).toBe(true);
  });

  it('allows resolved -> closed for agent/admin', () => {
    expect(statusTransition('resolved', 'closed', { role: 'agent' }).allowed).toBe(true);
    expect(statusTransition('resolved', 'closed', { role: 'admin' }).allowed).toBe(true);
  });

  it('rejects resolved -> in_progress', () => {
    expect(statusTransition('resolved', 'in_progress', { role: 'admin' }).allowed).toBe(false);
  });

  it('rejects any transition from closed', () => {
    expect(statusTransition('closed', 'open', { role: 'admin' }).allowed).toBe(false);
    expect(statusTransition('closed', 'resolved', { role: 'admin' }).allowed).toBe(false);
  });

  it('allows same-status transitions', () => {
    expect(statusTransition('open', 'open', { role: 'customer' }).allowed).toBe(true);
  });
});
