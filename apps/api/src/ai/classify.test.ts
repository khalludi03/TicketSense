import { describe, it, expect, beforeAll } from 'bun:test';
import { classifyTicket, initClassifier } from './classify.js';

describe('classifyTicket', () => {
  beforeAll(async () => {
    await initClassifier();
  });

  it('returns valid labels and confidence in [0,1]', () => {
    const result = classifyTicket('My invoice was double charged and I need a refund');
    expect(['Billing', 'Technical', 'Account', 'General']).toContain(result.category);
    expect(['low', 'medium', 'high']).toContain(result.priority);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('classifies a clear billing phrase as Billing', () => {
    const result = classifyTicket('refund invoice payment charged twice billing');
    expect(result.category).toBe('Billing');
  });

  it('classifies a clear technical phrase as Technical', () => {
    const result = classifyTicket('crash bug error 500 down not loading');
    expect(result.category).toBe('Technical');
  });

  it('classifies a clear account phrase as Account', () => {
    const result = classifyTicket('password reset cannot access account');
    expect(result.category).toBe('Account');
  });

  it('classifies a clear general phrase as General', () => {
    const result = classifyTicket('general question support hours');
    expect(result.category).toBe('General');
  });
});
