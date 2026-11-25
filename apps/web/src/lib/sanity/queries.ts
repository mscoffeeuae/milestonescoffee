/**
 * GROQ queries for public Phase 1 pages.
 * All queries read only published, active documents.
 */

/** All active branches, ordered by emirate then name. */
export const BRANCHES_QUERY = `
  *[_type == "branch" && isActive == true] | order(emirate asc, nameEn asc) {
    _id,
    nameEn,
    nameAr,
    "slug": slug.current,
    emirate,
    addressEn,
    addressAr,
    googleMapsUrl,
    coordinates,
    openingHours,
    openingHoursNoteEn,
    openingHoursNoteAr,
    services,
    phone,
    heroImage { asset->{ url, metadata { lqip, dimensions } }, hotspot, crop },
    "seo": seo { titleEn, titleAr, descriptionEn, descriptionAr, noIndex }
  }
`;

/** Single branch by slug. */
export const BRANCH_BY_SLUG_QUERY = `
  *[_type == "branch" && slug.current == $slug && isActive == true][0] {
    _id,
    nameEn,
    nameAr,
    "slug": slug.current,
    emirate,
    addressEn,
    addressAr,
    googleMapsUrl,
    coordinates,
    openingHours,
    openingHoursNoteEn,
    openingHoursNoteAr,
    services,
    phone,
    whatsapp,
    heroImage { asset->{ url, metadata { lqip, dimensions } }, hotspot, crop },
    galleryImages[] { asset->{ url, metadata { lqip, dimensions } }, hotspot, crop },
    seo { titleEn, titleAr, descriptionEn, descriptionAr, ogImage { asset->{ url } }, noIndex }
  }
`;

/** All active menu categories ordered by sortOrder. */
export const MENU_CATEGORIES_QUERY = `
  *[_type == "menuCategory" && isActive == true] | order(sortOrder asc) {
    _id,
    nameEn,
    nameAr,
    "slug": slug.current,
    descriptionEn,
    descriptionAr,
    "products": *[_type == "menuProduct" && isActive == true && references(^._id)] | order(sortOrder asc) {
      _id,
      nameEn,
      nameAr,
      "slug": slug.current,
      descriptionEn,
      descriptionAr,
      displayPriceAed,
      allergens,
      dietaryFlags,
      isNew,
      isFeatured,
      productImage { asset->{ url, metadata { lqip, dimensions } }, hotspot, crop },
      productImageThumb { asset->{ url, metadata { lqip, dimensions } } }
    }
  }
`;

/** Active offers, ordered newest first. */
export const OFFERS_QUERY = `
  *[
    _type == "offer" &&
    isActive == true &&
    validFrom <= now() &&
    (validUntil == null || validUntil > now())
  ] | order(validFrom desc) {
    _id,
    titleEn,
    titleAr,
    "slug": slug.current,
    summaryEn,
    summaryAr,
    validFrom,
    validUntil,
    heroImage { asset->{ url, metadata { lqip, dimensions } }, hotspot, crop }
  }
`;

/** Corporate page singleton. */
export const CORPORATE_PAGE_QUERY = `
  *[_type == "corporatePage"][0] {
    heroTitleEn,
    heroTitleAr,
    heroSubtitleEn,
    heroSubtitleAr,
    heroImage { asset->{ url, metadata { lqip, dimensions } }, hotspot, crop },
    serviceCards,
    bodyEn,
    bodyAr,
    ctaLabelEn,
    ctaLabelAr,
    enquiryEmail,
    seo { titleEn, titleAr, descriptionEn, descriptionAr, ogImage { asset->{ url } }, noIndex }
  }
`;

/** Homepage featured row: editor-flagged products first, topped up with other active ones (max 6). */
export const FEATURED_PRODUCTS_QUERY = `
  *[_type == "menuProduct" && isActive == true] | order(isFeatured desc, sortOrder asc)[0...6] {
    _id,
    nameEn,
    nameAr,
    descriptionEn,
    descriptionAr,
    displayPriceAed,
    isNew,
    productImage { asset->{ url, metadata { lqip, dimensions } } },
    productImageThumb { asset->{ url, metadata { lqip, dimensions } } }
  }
`;
