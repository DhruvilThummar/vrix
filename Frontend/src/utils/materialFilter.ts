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
  const variantMats = Array.isArray(product?.variants)
    ? product.variants.map((v: any) => (v?.material || "").toLowerCase()).join(" ")
    : "";

  // Combine direct material declarations and relevant identifiers (exclude description)
  const matContext = `${mainMat} ${variantMats} ${tags} ${title} ${subtitle}`;

  if (target === "gold") {
    // Must contain gold, vermeil, or gold karats (18k, 14k, 22k, 24k)
    const hasGoldTerm =
      matContext.includes("gold") ||
      matContext.includes("vermeil") ||
      matContext.includes("18k") ||
      matContext.includes("14k") ||
      matContext.includes("22k") ||
      matContext.includes("24k");

    // If primary material is explicitly silver or platinum with no gold in main material,
    // only accept if variants explicitly offer a gold option
    const isPureSilverOrPlatinum =
      (mainMat.includes("silver") || mainMat.includes("sterling") || mainMat.includes("platinum") || mainMat.includes("925") || mainMat.includes("950")) &&
      !mainMat.includes("gold") &&
      !mainMat.includes("vermeil");

    if (isPureSilverOrPlatinum) {
      return variantMats.includes("gold") || variantMats.includes("vermeil");
    }
    return hasGoldTerm;
  }

  if (target === "silver") {
    const hasSilverTerm =
      matContext.includes("silver") ||
      matContext.includes("sterling") ||
      matContext.includes("925");

    const isPureGoldOrPlatinum =
      (mainMat.includes("gold") || mainMat.includes("platinum") || mainMat.includes("vermeil")) &&
      !mainMat.includes("silver") &&
      !mainMat.includes("sterling");

    if (isPureGoldOrPlatinum) {
      return variantMats.includes("silver") || variantMats.includes("sterling") || variantMats.includes("925");
    }
    return hasSilverTerm;
  }

  if (target === "platinum") {
    const hasPlatinumTerm = matContext.includes("platinum") || matContext.includes("950");

    const isPureGoldOrSilver =
      (mainMat.includes("gold") || mainMat.includes("silver") || mainMat.includes("sterling") || mainMat.includes("vermeil")) &&
      !mainMat.includes("platinum");

    if (isPureGoldOrSilver) {
      return variantMats.includes("platinum") || variantMats.includes("950");
    }
    return hasPlatinumTerm;
  }

  if (target === "diamond") {
    return matContext.includes("diamond") || matContext.includes("solitaire") || matContext.includes("pave");
  }

  return matContext.includes(target);
}
