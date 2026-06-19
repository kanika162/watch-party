export const log = (...args: unknown[]) => {
  console.log("[watch-party]", ...args);
};

export const logError = (...args: unknown[]) => {
  console.error("[watch-party:ERROR]", ...args);
};
