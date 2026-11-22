const JAVA = new Set(['31', '32', '33', '34', '35', '36']);

export const SHIPPING_JAVA = 15_000;
export const SHIPPING_OUTSIDE_JAVA = 35_000;

export function estimateShipping(provinceId: string): number {
  return JAVA.has(provinceId) ? SHIPPING_JAVA : SHIPPING_OUTSIDE_JAVA;
}
