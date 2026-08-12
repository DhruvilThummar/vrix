export function getDisplayPrice(price: number, formatPrice: (n: number) => string): string {
  if (!price || price <= 0) return "Price on Request";
  return formatPrice(price);
}
