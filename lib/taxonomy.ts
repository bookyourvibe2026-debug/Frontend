/* ------------------------------------------------------------------ */
/*  SHARED SPORTS/ACTIVITY TAXONOMY                                    */
/*  Used by the vendor listing form (category/sub-category multi-      */
/*  select) and by customer browse/filter pages (/games, /venues).     */
/* ------------------------------------------------------------------ */

export interface SubCategoryOption {
  id: string;
  label: string;
}

export interface SportCategory {
  id: string;
  label: string;
  image?: string;
  subCategories: SubCategoryOption[];
}

export const SPORT_CATEGORIES: SportCategory[] = [
  {
    id: "cricket",
    label: "Cricket",
    image: "/bat.png",
    subCategories: [
      { id: "box-cricket", label: "Box Cricket" },
      { id: "cricket-nets", label: "Cricket Nets / Practice" },
      { id: "turf-cricket", label: "Full Turf Cricket" },
    ],
  },
  {
    id: "football",
    label: "Football",
    image: "/football.png",
    subCategories: [
      { id: "football-5s", label: "5-a-side Turf" },
      { id: "football-7s", label: "7-a-side Turf" },
      { id: "football-full", label: "Full Ground" },
    ],
  },
  {
    id: "badminton",
    label: "Badminton",
    image: "/badminton.png",
    subCategories: [
      { id: "badminton-single", label: "Single Court" },
      { id: "badminton-multi", label: "Multi Court" },
      { id: "badminton-coaching", label: "Coaching" },
    ],
  },
  {
    id: "pickleball",
    label: "Pickleball",
    image: "/pickball.png",
    subCategories: [{ id: "pickleball-standard", label: "Standard Court" }],
  },
  {
    id: "tennis",
    label: "Tennis",
    image: "/tennis.png",
    subCategories: [
      { id: "tennis-singles", label: "Singles Court" },
      { id: "tennis-doubles", label: "Doubles Court" },
      { id: "tennis-coaching", label: "Coaching" },
    ],
  },
  {
    id: "table-tennis",
    label: "Table Tennis",
    image: "/tabletennis.png",
    subCategories: [
      { id: "tt-casual", label: "Casual Play" },
      { id: "tt-tournament", label: "Tournament Table" },
    ],
  },
  {
    id: "basketball",
    label: "Basketball",
    subCategories: [
      { id: "basketball-half", label: "Half Court" },
      { id: "basketball-full", label: "Full Court" },
    ],
  },
  {
    id: "volleyball",
    label: "Volleyball",
    subCategories: [
      { id: "volleyball-indoor", label: "Indoor" },
      { id: "volleyball-beach", label: "Beach" },
    ],
  },
  {
    id: "swimming",
    label: "Swimming",
    subCategories: [
      { id: "swimming-pool", label: "Pool Access" },
      { id: "swimming-coaching", label: "Coaching" },
    ],
  },
  {
    id: "snooker-pool",
    label: "Snooker & Pool",
    subCategories: [
      { id: "snooker-table", label: "Snooker Table" },
      { id: "pool-table", label: "Pool Table" },
    ],
  },
  {
    id: "skating",
    label: "Skating",
    subCategories: [{ id: "skating-rink", label: "Rink Access" }],
  },
  {
    id: "indoor-games",
    label: "Indoor Games",
    subCategories: [
      { id: "carrom", label: "Carrom" },
      { id: "chess", label: "Chess" },
      { id: "foosball", label: "Foosball" },
    ],
  },
];

export function subCategoriesForCategories(categoryIds: string[]): SubCategoryOption[] {
  const seen = new Map<string, SubCategoryOption>();
  for (const catId of categoryIds) {
    const cat = SPORT_CATEGORIES.find((c) => c.id === catId);
    if (!cat) continue;
    for (const sub of cat.subCategories) {
      seen.set(sub.id, sub);
    }
  }
  return Array.from(seen.values());
}

export function categoryLabel(id: string): string {
  return SPORT_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export function subCategoryLabel(id: string): string {
  for (const cat of SPORT_CATEGORIES) {
    const sub = cat.subCategories.find((s) => s.id === id);
    if (sub) return sub.label;
  }
  return id;
}
