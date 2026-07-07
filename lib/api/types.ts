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
  /** Ticket cap for type: "Event" listings — unused for Turf/Game. */
  capacity?: number;
  /** Present on the public detail response for type: "Event" listings with a capacity set. */
  spotsLeft?: number;
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

export interface CoachSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

export interface Coach {
  _id: string;
  vendorId: string;
  name: string;
  category: string;
  subCategory?: string;
  experienceYears?: number;
  fees: number;
  bio?: string;
  photoUrl?: string;
  status: "Active" | "Inactive";
  slots: CoachSlot[];
  createdAt: string;
  updatedAt: string;
}

export type CoachBookingStatus = "Confirmed" | "Cancelled" | "Completed";

export interface CoachBooking {
  _id: string;
  orderId: string;
  coachId: string;
  vendorId: string;
  customerId?: string | null;
  customerName: string;
  phone: string;
  email?: string;
  slotId: string;
  slotDate: string;
  slotStartTime: string;
  slotEndTime: string;
  amount: number;
  payment: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentOrderId?: string;
  status: CoachBookingStatus;
  cancellationReason?: string;
  checkedIn: boolean;
  checkedInAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TournamentStatus = "Upcoming" | "Ongoing" | "Completed" | "Cancelled";
export type FixtureStatus = "Scheduled" | "Completed";

export interface TournamentFixture {
  id: string;
  round: string;
  teamAId: string;
  teamBId: string;
  scheduledAt: string;
  teamAScore?: number;
  teamBScore?: number;
  winnerTeamId?: string;
  status: FixtureStatus;
}

export interface LeaderboardEntry {
  teamId: string;
  teamName: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
}

export interface Tournament {
  _id: string;
  vendorId: string;
  title: string;
  category: string;
  subCategory?: string;
  description: string;
  city: string;
  state: string;
  address: string;
  entryFee: number;
  prizeMoney?: number;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  maxTeams?: number;
  registeredTeamsCount: number;
  status: TournamentStatus;
  fixtures: TournamentFixture[];
  spotsLeft?: number;
  leaderboard?: LeaderboardEntry[];
  createdAt: string;
  updatedAt: string;
}

export type TournamentRegistrationStatus = "Registered" | "Cancelled" | "Withdrawn";

export interface TournamentPlayer {
  name: string;
  phone?: string;
}

export interface TournamentRegistration {
  _id: string;
  orderId: string;
  tournamentId: string;
  vendorId: string;
  customerId?: string | null;
  teamName: string;
  captainName: string;
  captainPhone: string;
  captainEmail?: string;
  players: TournamentPlayer[];
  amount: number;
  payment: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentOrderId?: string;
  status: TournamentRegistrationStatus;
  cancellationReason?: string;
  checkedIn: boolean;
  checkedInAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItem {
  _id: string;
  vendorId: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  photo?: string;
  inStock: boolean;
  prepTimeMins?: number;
  createdAt: string;
  updatedAt: string;
}

export type FoodOrderStatus = "Pending" | "Accepted" | "Rejected" | "Preparing" | "Ready" | "Delivered" | "Cancelled";

export interface FoodOrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface FoodOrder {
  _id: string;
  orderId: string;
  vendorId: string;
  customerId: string;
  customerName: string;
  phone: string;
  items: FoodOrderItem[];
  totalAmount: number;
  status: FoodOrderStatus;
  notes?: string;
  checkedIn: boolean;
  checkedInAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FoodVendor {
  _id: string;
  businessName: string;
  ownerName: string;
  logo?: string;
  banner?: string;
  poster?: string;
  city?: string;
  state: string;
  categories: string[];
}

export interface VendorFoodDashboard {
  period: "day" | "week" | "month" | "year";
  ordersByStatus: Partial<Record<FoodOrderStatus, number>>;
  totalRevenue: number;
  deliveredOrderCount: number;
  allTimeOrderCount: number;
}

export type VendorStatus = "pending" | "approved" | "suspended";
export type VendorBusinessType = "Company" | "Individual / Proprietor" | "Partnership";
export type VendorBankAccountType = "Savings" | "Current";
/** Which side(s) of the platform this vendor operates — turf owner, food owner, or both. */
export type VendorVertical = "turf" | "food" | "both";

export interface Vendor {
  _id: string;
  ownerName: string;
  businessName: string;
  email: string;
  phone: string;
  state: string;
  city?: string;
  vertical: VendorVertical;
  status: VendorStatus;
  approvedOn?: string | null;
  notifications: { email: boolean; whatsapp: boolean; offline: boolean };
  logo?: string;
  banner?: string;
  poster?: string;
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
