/**
 * Helper functions to identify metal and gemstone materials.
 */
function isGoldMaterial(str: string): boolean {
  if (!str) return false;
  return (
    str.includes("gold") ||
    str.includes("vermeil") ||
    str.includes("18k") ||
    str.includes("14k") ||
    str.includes("22k") ||
    str.includes("24k")
  );
}

function isSilverMaterial(str: string): boolean {
  if (!str) return false;
  return str.includes("silver") || str.includes("sterling") || str.includes("925");
}

function isPlatinumMaterial(str: string): boolean {
  if (!str) return false;
  return str.includes("platinum") || str.includes("950");
}

function isDiamondItem(matContext: string): boolean {
  if (!matContext) return false;
  return (
    matContext.includes("diamond") ||
    matContext.includes("solitaire") ||
    matContext.includes("pave") ||
    matContext.includes("moissanite")
  );
}

/**
 * Utility function to strictly and accurately match products against material filter criteria.
 * Excludes long description body text to prevent false positives when descriptions mention other materials.
 */
export function matchesMaterialFilter(product: any, selectedMaterial: string): boolean {
  if (!selectedMaterial || selectedMaterial === "All") return true;

  const target = selectedMaterial.toLowerCase().trim();
  const mainMat = (product?.material || "").toLowerCase().trim();
  const title = (product?.title || "").toLowerCase().trim();
  const subtitle = (product?.subtitle || "").toLowerCase().trim();
  const tags = Array.isArray(product?.tags) ? product.tags.join(" ").toLowerCase() : "";

  const hasVariants = Array.isArray(product?.variants) && product.variants.length > 0;
  const variantMats = hasVariants
    ? product.variants.map((v: any) => (v?.material || "").toLowerCase())
    : [];

  const matContext = `${mainMat} ${variantMats.join(" ")} ${tags} ${title} ${subtitle}`;

  if (target === "gold") {
    // Primary material is explicitly gold
    if (isGoldMaterial(mainMat)) return true;

    // Any variant is explicitly gold
    if (variantMats.some((m: string) => isGoldMaterial(m))) return true;

    // If primary metal is explicitly silver or platinum with no gold variant, reject
    if (isSilverMaterial(mainMat) || isPlatinumMaterial(mainMat)) return false;

    // Fallback: title/tags indicate gold when main material is unstated
    return isGoldMaterial(matContext);
  }

  if (target === "silver") {
    // Primary material is explicitly silver
    if (isSilverMaterial(mainMat)) return true;

    // Any variant is explicitly silver
    if (variantMats.some((m: string) => isSilverMaterial(m))) return true;

    // If primary metal is explicitly gold or platinum with no silver variant, reject
    if (isGoldMaterial(mainMat) || isPlatinumMaterial(mainMat)) return false;

    // Fallback: title/tags indicate silver when main material is unstated
    return isSilverMaterial(matContext);
  }

  if (target === "platinum") {
    // Primary material is explicitly platinum
    if (isPlatinumMaterial(mainMat)) return true;

    // Any variant is explicitly platinum
    if (variantMats.some((m: string) => isPlatinumMaterial(m))) return true;

    // If primary metal is explicitly gold or silver with no platinum variant, reject
    if (isGoldMaterial(mainMat) || isSilverMaterial(mainMat)) return false;

    // Fallback: title/tags indicate platinum when main material is unstated
    return isPlatinumMaterial(matContext);
  }

  if (target === "diamond") {
    return isDiamondItem(matContext);
  }

  return matContext.includes(target);
}
