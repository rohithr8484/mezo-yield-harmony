export const VEMEZO_WITHDRAW_REVERT_MESSAGE = "Transaction reverted by contract. Most likely cause: lock has not expired yet, or the connected wallet is not the owner of this veMEZO position.";

export function getVeMezoWithdrawError(err: unknown): string {
  const errors: Record<string, unknown>[] = [];
  const seen = new Set<unknown>();
  const collect = (value: unknown) => {
    if (!value || typeof value !== "object" || seen.has(value)) return;
    seen.add(value);
    const error = value as Record<string, unknown>;
    errors.push(error);
    collect(error.error);
    collect(error.cause);
    collect(error.info);
  };
  collect(err);

  const messages = errors.flatMap((error) => [error.shortMessage, error.reason, error.message])
    .filter((message): message is string => typeof message === "string" && message.length > 0);
  if (errors.some((error) => error.code === "ACTION_REJECTED" || error.code === 4001 || error.code === "4001")) {
    return "Withdrawal cancelled.";
  }
  if (errors.some((error) => error.code === "CALL_EXCEPTION") ||
      messages.some((message) => /revert|not (?:the )?owner|not authorized|not approved|lock.*(?:not expired|still active)/i.test(message))) {
    return VEMEZO_WITHDRAW_REVERT_MESSAGE;
  }
  return messages[0] ?? (typeof err === "string" ? err : "Withdraw failed");
}