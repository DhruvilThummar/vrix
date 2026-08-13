export function getDisplayPrice(
  price: number | null | undefined,
  formatPrice: (n: number) => string,
  fallbackPrice: number = 0
): string {
  const p = Number(price);
  const fb = Number(fallbackPrice);
  const finalPrice = p > 0 ? p : (fb > 0 ? fb : 0);
  if (finalPrice <= 0) return "Price on Request";
  return formatPrice(finalPrice);
}
