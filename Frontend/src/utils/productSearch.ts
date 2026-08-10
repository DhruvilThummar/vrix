export interface SearchableProduct {
  title?: string;
  material?: string;
  type?: string;
  collection?: string;
  description?: string;
  sku?: string;
  tags?: unknown;
}

const normalize = (value: unknown) => String(value ?? "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLocaleLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const words = (value: unknown) => normalize(value).split(" ").filter(Boolean);

// Bounded Damerau-Levenshtein distance also accepts adjacent-key transpositions,
// such as "rign" for "ring". Returning early keeps search responsive as the
// catalog grows.
const editDistance = (source: string, target: string, limit: number) => {
  if (Math.abs(source.length - target.length) > limit) return limit + 1;

  let previous = Array.from({ length: target.length + 1 }, (_, index) => index);
  let current = new Array<number>(target.length + 1);

  for (let i = 1; i <= source.length; i += 1) {
    current[0] = i;
    let rowMinimum = current[0];
    for (let j = 1; j <= target.length; j += 1) {
      const substitution = previous[j - 1] + Number(source[i - 1] !== target[j - 1]);
      const insertion = current[j - 1] + 1;
      const deletion = previous[j] + 1;
      const transposition = i > 1 && j > 1 && source[i - 1] === target[j - 2] && source[i - 2] === target[j - 1]
        ? previous[j - 2] + 1
        : Number.POSITIVE_INFINITY;
      current[j] = Math.min(substitution, insertion, deletion, transposition);
      rowMinimum = Math.min(rowMinimum, current[j]);
    }
    if (rowMinimum > limit) return limit + 1;
    [previous, current] = [current, previous];
  }
  return previous[target.length];
};

const tokenScore = (queryToken: string, productToken: string) => {
  if (productToken === queryToken) return 100;
  if (productToken.startsWith(queryToken)) return 85; // predictive search while typing
  if (queryToken.length >= 3 && queryToken.startsWith(productToken)) return 70;

  // Do not fuzz very short inputs: matching "ri" to unrelated words produces noise.
  if (queryToken.length < 3 || productToken.length < 3) return 0;
  const maximumDistance = Math.min(2, queryToken.length <= 4 ? 1 : 2);
  const distance = editDistance(queryToken, productToken, maximumDistance);
  return distance <= maximumDistance ? 60 - (distance * 10) : 0;
};

const productTerms = (product: SearchableProduct) => [
  ...words(product.title),
  ...words(product.type),
  ...words(product.material),
  ...words(product.collection),
  ...words(product.sku),
  ...words(product.tags),
  ...words(product.description),
];

/**
 * Requires every typed word to match, then ranks exact, prefix, and fuzzy matches.
 * This permits one or two character mistakes without turning a multi-word query
 * into a broad unrelated product list.
 */
export const searchProducts = <T extends SearchableProduct>(products: T[], query: string): T[] => {
  const queryTokens = words(query);
  if (!queryTokens.length) return [];

  return products
    .map((product) => {
      const terms = productTerms(product);
      const scores = queryTokens.map((queryToken) => Math.max(0, ...terms.map((term) => tokenScore(queryToken, term))));
      if (scores.some((score) => score === 0)) return null;

      const title = normalize(product.title);
      const normalizedQuery = normalize(query);
      const phraseBonus = title.includes(normalizedQuery) ? 40 : 0;
      return { product, score: scores.reduce((sum, score) => sum + score, 0) + phraseBonus };
    })
    .filter((result): result is { product: T; score: number } => result !== null)
    .sort((left, right) => right.score - left.score || normalize(left.product.title).localeCompare(normalize(right.product.title)))
    .map(({ product }) => product);
};
