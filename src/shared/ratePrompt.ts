/** Soft in-app rate prompt gating after positive moments (habit/task completion). */

export const RATE_PROMPT_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;
export const RATE_PROMPT_MAX_ASKS = 3;

export type RatePromptState = {
  onboarded: boolean;
  ratePromptNever: boolean;
  ratePromptPending: boolean;
  ratePromptCount: number;
  ratePromptLastAt?: string;
};

export type RatePromptArmPatch = {
  ratePromptPending: true;
  ratePromptLastAt: string;
  ratePromptCount: number;
};

/**
 * Returns a store patch that arms the soft rate sheet, or {} if not eligible.
 * Counts this ask toward the lifetime max and starts the cooldown clock.
 */
export function maybeArmRatePrompt(
  s: RatePromptState,
  nowMs: number = Date.now(),
): RatePromptArmPatch | Record<string, never> {
  if (!s.onboarded || s.ratePromptNever || s.ratePromptPending) return {};
  if (s.ratePromptCount >= RATE_PROMPT_MAX_ASKS) return {};
  if (s.ratePromptLastAt) {
    const last = Date.parse(s.ratePromptLastAt);
    if (Number.isFinite(last) && nowMs - last < RATE_PROMPT_COOLDOWN_MS) return {};
  }
  return {
    ratePromptPending: true,
    ratePromptLastAt: new Date(nowMs).toISOString(),
    ratePromptCount: s.ratePromptCount + 1,
  };
}
