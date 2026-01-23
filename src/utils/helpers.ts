export const APT_DECIMALS = 8;

export function convertAmountFromHumanReadableToOnChain(value: number, decimal: number) {
  return value * Math.pow(10, decimal);
}

export function convertAmountFromOnChainToHumanReadable(value: number, decimal: number) {
  return value / Math.pow(10, decimal);
}
