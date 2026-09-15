import { IS_DEV } from '@/shared/config/env';

/**
 * The single logging seam for the app.
 *
 * `no-console` is an error everywhere else, so all diagnostic output funnels
 * through here. That means wiring up Sentry (or any other reporter) later is
 * a change to this one file rather than a repo-wide grep for `console.log`.
 */

type LogContext = Record<string, unknown>;

export const logger = {
  /** Dev-only. Compiled out of production builds by the IS_DEV guard. */
  debug(message: string, context?: LogContext): void {
    if (IS_DEV) {
      console.warn(`[debug] ${message}`, context ?? '');
    }
  },

  warn(message: string, context?: LogContext): void {
    console.warn(message, context ?? '');
  },

  /**
   * Takes an Error, not a string, so the stack survives. When a reporter is
   * added, this is the function that forwards to it.
   */
  error(error: unknown, context?: LogContext): void {
    console.error(error, context ?? '');
  },
};
