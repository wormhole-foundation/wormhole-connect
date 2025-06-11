/**
 * Calls a given function and keeps calling it after the specified delay has passed.
 */
export const poll = async (
  fn: () => Promise<void>,
  delayOrDelayCallback: number | (() => number),
  shouldStopPolling: () => boolean | Promise<boolean>,
): Promise<void> => {
  do {
    await fn();

    if (await shouldStopPolling()) {
      break;
    }

    const delay =
      typeof delayOrDelayCallback === 'number'
        ? delayOrDelayCallback
        : delayOrDelayCallback();

    await new Promise((resolve) => setTimeout(resolve, Math.max(0, delay)));
  } while (!(await shouldStopPolling()));
};
