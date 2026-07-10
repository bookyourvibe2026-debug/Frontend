/* ------------------------------------------------------------------ */
/*  VENUES — view-model shared by the homepage's Trending Venues       */
/*  section (desktop + mobile).                                        */
/*                                                                     */
/*  `rating` and `distanceKm` have no backing system yet (no reviews    */
/*  engine, no geolocation) — they're neutral placeholders, not real    */
/*  per-venue data, until Reviews (System 7) and Maps (System 2) exist. */
/* ------------------------------------------------------------------ */

import type { Listing } from "./api/types";
import { categoryLabel } from "./taxonomy";

export type Venue = {
  id: string;
  name: string;
  area: string;
  distanceKm: number;
  rating: number;
  pricePerHour: number;
  status: "Available" | "Filling Fast" | "Full";
  sport: string;
  image: string;
};

export function listingToVenue(listing: Listing): Venue {
  return {
    id: listing._id,
    name: listing.title,
    area: listing.city,
    distanceKm: 0,
    rating: 4.5,
    pricePerHour: listing.price,
    status: "Available",
    sport: listing.categories.map(categoryLabel).join(", ") || "General",
    image: listing.coverImage ?? "",
  };
}
