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

export interface AddOn {
  id: string;
  label: string;
  price: number;
}

export interface Coupon {
  id: string;
  code: string;
  discountPercent: number;
}

export type BookingType = "Recurring" | "Trips" | "Courses";

export interface Listing {
  id: string;
  title: string;
  type: ListingType;
  categories: string[];
  subCategories: string[];
  price: number;
  listedOn: string;
  status: "Active" | "Inactive";
  trending?: boolean;
  isPrivate?: boolean;
  access: ListingAccess;
  ownerName?: string;
  sharedWithVendors?: boolean;
  coverImage?: string;
  images: ListingImage[];
  country?: string;
  city: string;
  state: string;
  cityMode?: "single" | "multiple";
  cities?: string[];
  address: string;
  startingPoint?: string;
  endingPoint?: string;
  reportingStartTime?: string;
  reportingEndTime?: string;
  description: string;
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  itinerary: ItineraryStop[];
  faqs: ListingFAQ[];
  tags: string[];
  priceTiers: PriceTier[];
  addOns?: AddOn[];
  coupons?: Coupon[];
  bookingType: BookingType;
  availableFrom: string;
  availableTill: string;
  slotsPerDay: number;
  slotsList?: TurfSlot[];
  dailyRoutine?: boolean;
  dateOverrides?: DateOverride[];
}

export interface TurfSlot {
  startTime: string;
  endTime: string;
  label: string;
  price: number;
}

export interface DateOverride {
  date: string;
  isHoliday: boolean;
  holidayName: string;
  slots: TurfSlot[];
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
  | "settings"
  | "membership"
  | "menu"
  | "foodOrders"
  | "coaches"
  | "tournaments";

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

/* -------------------------------------------------------------- */
/*  ADMIN PANEL                                                    */
/* -------------------------------------------------------------- */

export interface AdminSubUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "Active" | "Inactive";
}

export interface AdminVendor {
  id: string;
  name: string;
  businessName: string;
  email: string;
  phone: string;
  state: string;
  status: "approved" | "pending";
  approvedOn?: string;
  notifications: {
    email: boolean;
    whatsapp: boolean;
    offline: boolean;
  };
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  thumbnail?: string;
  content: string;
  status: "Published" | "Draft";
  publishedOn: string;
}

export type AdminBookingStatus = "confirmed" | "pending" | "cancelled";

export interface AdminBooking {
  bookingId: string;
  customer: string;
  email: string;
  listingName: string;
  eventDate: string;
  bookedOn: string;
  collected: number;
  b2bCharge: number;
  taxes: number;
  affiliateAmt: number;
  ownerAmount: number;
  status: AdminBookingStatus;
  payment: "completed" | "pending";
  isAffiliate?: boolean;
}

export interface PayoutCategory {
  id: string;
  name: string;
  letter: string;
  color: string;
  subtitle: string;
}

export interface PayoutVendorEntry {
  id: string;
  categoryId: string;
  vendorId: string;
  vendorName: string;
  type: "Standard" | "Affiliate";
  status: "Pending" | "Processing" | "Paid" | "Failed" | "Cancelled";
  amount: number;
  date: string;
  bookingsCount: number;
}

export interface AppVersionConfig {
  currentVersion: string;
  minRequiredVersion: string;
  downloadUrl: string;
  releaseNotes: string;
  forceUpdate: boolean;
}
