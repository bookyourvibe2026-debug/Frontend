export type ListingType = "Turf" | "Game" | "Event";
export type ListingStatus = "Active" | "Inactive";
export type ListingAccess = "Vendor Owned" | "Claimed from Admin";
export type BookingType = "Recurring" | "Trips" | "Courses";

export interface ListingImage {
  id: string;
  url: string;
  label: string;
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

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
}

export interface Faq {
  question: string;
  answer: string;
}

export interface Listing {
  _id: string;
  title: string;
  type: ListingType;
  category: string;
  subCategory?: string;
  price: number;
  status: ListingStatus;
  trending: boolean;
  isPrivate: boolean;
  access: ListingAccess;
  vendorId?: string | null;
  ownerName?: string;
  sharedWithVendors: boolean;
  coverImage?: string;
  images: ListingImage[];
  country?: string;
  city: string;
  state: string;
  cityMode: "single" | "multiple";
  cities: string[];
  address: string;
  startingPoint?: string;
  endingPoint?: string;
  reportingStartTime?: string;
  reportingEndTime?: string;
  description: string;
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  itinerary: ItineraryDay[];
  faqs: Faq[];
  tags: string[];
  priceTiers: PriceTier[];
  addOns: AddOn[];
  coupons: Coupon[];
  bookingType: BookingType;
  availableFrom: string;
  availableTill: string;
  slotsPerDay: number;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethod = "Cashfree (Online)" | "Cash (Offline)" | "UPI";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type BookingStatus = "Confirmed" | "Pending" | "Cancelled" | "Completed";

export interface Booking {
  _id: string;
  orderId: string;
  listingId: string;
  listingTitle?: string;
  vendorId: string;
  customerId?: string | null;
  customerName: string;
  phone: string;
  email?: string;
  dateTime: string;
  totalAmount: number;
  platformFee: number;
  taxes: number;
  affiliateAmount: number;
  vendorEarning: number;
  payment: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentOrderId?: string;
  status: BookingStatus;
  isAffiliate: boolean;
  cancellationReason?: string;
  checkedIn: boolean;
  checkedInAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type VendorStatus = "pending" | "approved" | "suspended";
export type VendorBusinessType = "Company" | "Individual / Proprietor" | "Partnership";
export type VendorBankAccountType = "Savings" | "Current";

export interface Vendor {
  _id: string;
  ownerName: string;
  businessName: string;
  email: string;
  phone: string;
  state: string;
  city?: string;
  status: VendorStatus;
  approvedOn?: string | null;
  notifications: { email: boolean; whatsapp: boolean; offline: boolean };
  logo?: string;
  businessType?: VendorBusinessType;
  gstNumber?: string;
  categories: string[];
  address: { street?: string; pinCode?: string; country?: string };
  bankDetails: {
    accountNumber?: string;
    ifsc?: string;
    bankName?: string;
    accountType?: VendorBankAccountType;
  };
  createdAt: string;
  updatedAt: string;
}

export interface VendorPopulated {
  _id: string;
  businessName: string;
  ownerName: string;
}

export type ModulePermissionKey = "dashboard" | "bookings" | "listings" | "earnings" | "verification" | "settings" | "membership";
export type PermissionAction = "view" | "create" | "edit" | "delete";
export type PermissionsMap<K extends string> = Partial<Record<K, Record<PermissionAction, boolean>>>;

export interface VendorStaff {
  id: string;
  roleName: string;
  holderName: string;
  holderEmail: string;
  holderPhone: string;
  accountType: "staff" | "subadmin";
  status: "Active" | "Inactive";
  permissions: PermissionsMap<ModulePermissionKey>;
}

export type AdminModuleKey =
  | "dashboard"
  | "vendors"
  | "listings"
  | "bookings"
  | "payouts"
  | "blog"
  | "marketing"
  | "categories"
  | "users"
  | "subAdmins"
  | "systemHealth"
  | "appVersion";

export interface AdminSubUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: "Active" | "Inactive";
  permissions: PermissionsMap<AdminModuleKey>;
  createdAt: string;
  updatedAt: string;
}

export interface PayoutCategory {
  _id: string;
  name: string;
  letter: string;
  color: string;
  subtitle: string;
  createdAt: string;
  updatedAt: string;
}

export type VendorPayoutStatus = "Pending" | "Processing" | "Paid" | "Failed" | "Cancelled";

export interface VendorPayout {
  _id: string;
  categoryId?: string | null;
  vendorId: VendorPopulated | string;
  type: "Standard" | "Affiliate";
  status: VendorPayoutStatus;
  amount: number;
  bookingsCount: number;
  bookingIds: string[];
  processedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  thumbnail?: string;
  content: string;
  status: "Published" | "Draft";
  publishedOn?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AppVersionConfig {
  _id: string;
  platform: "ios" | "android";
  currentVersion: string;
  minRequiredVersion: string;
  downloadUrl: string;
  releaseNotes: string;
  forceUpdate: boolean;
  updatedAt: string;
}

export interface AdminDashboard {
  listingsCount: number;
  listingsGrowthPercent: number;
  bookingsCount: number;
  bookingsGrowthPercent: number;
  newUsers: number;
  usersGrowthPercent: number;
  vendorsByStatus: Partial<Record<VendorStatus, number>>;
  bookingsByStatus: Partial<Record<BookingStatus, number>>;
  revenue: { totalCollected: number; totalPlatformFee: number; totalVendorEarnings: number };
  listingsByState: { state: string; count: number }[];
  topCities: { city: string; state: string; count: number }[];
  recentBookings: {
    orderId: string;
    listingName: string;
    customerName: string;
    status: BookingStatus;
    dateTime: string;
  }[];
}

export interface SystemHealth {
  uptimeSeconds: number;
  memory: { rss: number; heapTotal: number; heapUsed: number; external: number; arrayBuffers: number };
  database: { state: string; host: string; name: string };
  nodeVersion: string;
  timestamp: string;
}

export interface VendorDashboard {
  listingsCount: number;
  activeListingsCount: number;
  bookingsByStatus: Partial<Record<BookingStatus, number>>;
  totalEarnings: number;
  settledBookingsCount: number;
}

export interface SettledPayment {
  date: string;
  listingName: string;
  orderId: string;
  payment: PaymentMethod;
  totalAmount: number;
  platformFee: number;
  yourEarning: number;
}

export type MembershipPlanType = "duration" | "sessions";

export interface Membership {
  _id: string;
  vendorId: string;
  name: string;
  description?: string;
  planType: MembershipPlanType;
  price: number;
  durationDays?: number;
  sessionsIncluded?: number;
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}

export type SubscriptionStatus = "active" | "expired" | "cancelled";

export interface Subscription {
  _id: string;
  vendorId: string;
  membershipId: { _id: string; name: string; planType: MembershipPlanType } | string;
  customerName: string;
  phone: string;
  amountPaid: number;
  startDate: string;
  endDate?: string | null;
  sessionsRemaining?: number;
  status: SubscriptionStatus;
  createdAt: string;
  updatedAt: string;
}
