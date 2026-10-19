export type Status = 'open' | 'in_progress' | 'resolved' | 'closed';
export type Role = 'customer' | 'agent' | 'admin';

export type TransitionContext = {
  role: Role;
  resolvedAt?: Date | null;
  now?: Date;
};

const REOPEN_WINDOW_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

export function isAutoClosable(resolvedAt: Date | null | undefined, now: Date): boolean {
  if (!resolvedAt) return false;
  const diffMs = now.getTime() - new Date(resolvedAt).getTime();
  return diffMs > REOPEN_WINDOW_DAYS * DAY_MS;
}

export function statusTransition(
  current: Status,
  next: Status,
  ctx: TransitionContext,
): { allowed: boolean; reason?: string } {
  const { role, resolvedAt, now = new Date() } = ctx;

  if (current === next) return { allowed: true };

  if (current === 'open') {
    if (next === 'in_progress' && (role === 'agent' || role === 'admin')) {
      return { allowed: true };
    }
    return { allowed: false, reason: 'Cannot transition from Open to this status' };
  }

  if (current === 'in_progress') {
    if (next === 'resolved' && (role === 'agent' || role === 'admin')) {
      return { allowed: true };
    }
    return { allowed: false, reason: 'Cannot transition from In Progress to this status' };
  }

  if (current === 'resolved') {
    if (next === 'open') {
      if (role === 'admin') return { allowed: true };
      if ((role === 'customer' || role === 'agent') && resolvedAt && !isAutoClosable(resolvedAt, now)) {
        return { allowed: true };
      }
      return { allowed: false, reason: 'Reopen window has expired; only an Admin can reopen' };
    }

    if (next === 'closed' && (role === 'agent' || role === 'admin')) {
      return { allowed: true };
    }

    return { allowed: false, reason: 'Cannot transition from Resolved to this status' };
  }

  return { allowed: false, reason: 'Ticket is already closed' };
}
