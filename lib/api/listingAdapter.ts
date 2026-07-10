import type { Listing as ApiListing } from "./types";
import type { Listing as MockListing } from "@/lib/types";
import type { AdminListingInput } from "./admin";

/** The admin/vendor panel UI (table, PackageStudio form) was built against `lib/types.ts`'s
 * `Listing` shape (id, listedOn). The real API returns `_id`/`createdAt`. This adapter lets the
 * existing panel UI keep working unchanged while the data underneath is real. */
export function apiListingToMock(listing: ApiListing): MockListing {
  return {
    id: listing._id,
    title: listing.title,
    type: listing.type,
    categories: listing.categories,
    subCategories: listing.subCategories,
    price: listing.price,
    listedOn: listing.createdAt,
    status: listing.status,
    trending: listing.trending,
    isPrivate: listing.isPrivate,
    access: listing.access,
    ownerName: listing.ownerName,
    sharedWithVendors: listing.sharedWithVendors,
    coverImage: listing.coverImage,
    images: listing.images,
    country: listing.country,
    city: listing.city,
    state: listing.state,
    cityMode: listing.cityMode,
    cities: listing.cities,
    address: listing.address,
    startingPoint: listing.startingPoint,
    endingPoint: listing.endingPoint,
    reportingStartTime: listing.reportingStartTime,
    reportingEndTime: listing.reportingEndTime,
    description: listing.description,
    highlights: listing.highlights,
    inclusions: listing.inclusions,
    exclusions: listing.exclusions,
    itinerary: listing.itinerary,
    faqs: listing.faqs,
    tags: listing.tags,
    priceTiers: listing.priceTiers,
    addOns: listing.addOns,
    coupons: listing.coupons,
    bookingType: listing.bookingType,
    availableFrom: listing.availableFrom,
    availableTill: listing.availableTill,
    slotsPerDay: listing.slotsPerDay,
    slotsList: listing.slotsList,
    dailyRoutine: listing.dailyRoutine,
    dateOverrides: listing.dateOverrides,
  };
}

/** Strips the mock-only `id`/`listedOn` fields before sending a create/update request. */
export function mockListingToApiInput(listing: MockListing): AdminListingInput {
  const { id: _id, listedOn: _listedOn, ...rest } = listing;
  void _id;
  void _listedOn;
  return rest;
}
