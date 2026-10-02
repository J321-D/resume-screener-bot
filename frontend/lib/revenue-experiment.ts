export const PREMIUM_INTEREST_PRICE_USD = 9;
export const PREMIUM_INTEREST_PATH = "/premium-interest";

export function premiumInterestExperimentEnabled(
  value = process.env.NEXT_PUBLIC_PREMIUM_INTEREST_EXPERIMENT,
): boolean {
  return value === "1";
}
