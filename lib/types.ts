export type ListingType = "Turf" | "Game" | "Event";

export type ListingAccess = "Vendor Owned" | "Claimed from Admin";

export interface ListingImage {
  id: string;
  url: string;
  label: string;
}

export interface ListingFAQ {
  question: string;
  answer: string;
}

export interface ItineraryStop {
  day: number;
  title: string;
  description: string;
}

export interface PriceTier {
  id: string;
  label: string;
  amount: number;
}

export type BookingType = "Slot Booking" | "Fixed Date Event" | "Membership / Pass";

export interface Listing {
  id: string;
  title: string;
  type: ListingType;
  category: string;
  price: number;
  listedOn: string;
  status: "Active" | "Inactive";
  access: ListingAccess;
  coverImage?: string;
  images: ListingImage[];
  city: string;
  state: string;
  address: string;
  description: string;
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  itinerary: ItineraryStop[];
  faqs: ListingFAQ[];
  tags: string[];
  priceTiers: PriceTier[];
  bookingType: BookingType;
  availableFrom: string;
  availableTill: string;
  slotsPerDay: number;
}

export type BookingStatus = "Confirmed" | "Pending" | "Cancelled" | "Completed";

export interface Booking {
  orderId: string;
  customer: string;
  phone: string;
  listing: string;
  dateTime: string;
  totalAmount: number;
  platformFee: number;
  yourEarning: number;
  payment: "Cashfree (Online)" | "Cash (Offline)" | "UPI";
  status: BookingStatus;
}

export interface SettledPayment {
  date: string;
  listingName: string;
  orderId: string;
  totalAmount: number;
  platformFee: number;
  yourEarning: number;
}

export type ModulePermissionKey =
  | "dashboard"
  | "bookings"
  | "listings"
  | "earnings"
  | "verification"
  | "settings";

export interface RoleModulePermissions {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export interface VendorRole {
  id: string;
  roleName: string;
  holderName: string;
  holderEmail: string;
  holderPhone: string;
  status: "Active" | "Inactive";
  permissions: Record<ModulePermissionKey, RoleModulePermissions>;
}
