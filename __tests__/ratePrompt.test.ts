import { describe, it, expect } from '@jest/globals';
import {
  maybeArmRatePrompt,
  RATE_PROMPT_COOLDOWN_MS,
  RATE_PROMPT_MAX_ASKS,
} from '@/src/shared/ratePrompt';

const base = {
  onboarded: true,
  ratePromptNever: false,
  ratePromptPending: false,
  ratePromptCount: 0,
  ratePromptLastAt: undefined as string | undefined,
};

describe('maybeArmRatePrompt', () => {
  it('arms when eligible', () => {
    const now = Date.parse('2026-09-07T12:00:00.000Z');
    const patch = maybeArmRatePrompt(base, now);
    expect(patch).toEqual({
      ratePromptPending: true,
      ratePromptLastAt: '2026-09-07T12:00:00.000Z',
      ratePromptCount: 1,
    });
  });

  it('skips when not onboarded', () => {
    expect(maybeArmRatePrompt({ ...base, onboarded: false })).toEqual({});
  });

  it('skips when never', () => {
    expect(maybeArmRatePrompt({ ...base, ratePromptNever: true })).toEqual({});
  });

  it('skips when already pending', () => {
    expect(maybeArmRatePrompt({ ...base, ratePromptPending: true })).toEqual({});
  });

  it('skips when at max asks', () => {
    expect(maybeArmRatePrompt({ ...base, ratePromptCount: RATE_PROMPT_MAX_ASKS })).toEqual({});
  });

  it('skips inside cooldown', () => {
    const last = Date.parse('2026-09-07T12:00:00.000Z');
    const now = last + RATE_PROMPT_COOLDOWN_MS - 1;
    expect(
      maybeArmRatePrompt(
        { ...base, ratePromptCount: 1, ratePromptLastAt: new Date(last).toISOString() },
        now,
      ),
    ).toEqual({});
  });

  it('arms after cooldown', () => {
    const last = Date.parse('2026-09-07T12:00:00.000Z');
    const now = last + RATE_PROMPT_COOLDOWN_MS;
    const patch = maybeArmRatePrompt(
      { ...base, ratePromptCount: 1, ratePromptLastAt: new Date(last).toISOString() },
      now,
    );
    expect(patch.ratePromptPending).toBe(true);
    expect(patch.ratePromptCount).toBe(2);
  });
});
