import { apiRequest, type Paginated } from "./client";
import type { Listing, ListingType } from "./types";

export interface BrowseVenuesParams {
  city?: string;
  category?: string;
  type?: ListingType;
  search?: string;
  page?: number;
  limit?: number;
}

// The admin/vendor package studio only ever saves uploads into `images`
// (first slot = poster) and never updates `coverImage`, which stays stuck on
// its seeded placeholder — so prefer the real uploaded image when one exists.
function withCoverImage(listing: Listing): Listing {
  return { ...listing, coverImage: listing.images[0]?.url || listing.coverImage };
}

export async function browseVenues(params: BrowseVenuesParams = {}) {
  const result = await apiRequest<Paginated<Listing>>("/venues", { query: params });
  return { ...result, items: result.items.map(withCoverImage) };
}

export async function getVenueById(id: string) {
  const listing = await apiRequest<Listing>(`/venues/${id}`);
  return withCoverImage(listing);
}
