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
  slug?: string;
  title: string;
  type: ListingType;
  categories: string[];
  subCategories: string[];
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
  videoUrl: string;
  faqs: Faq[];
  tags: string[];
  priceTiers: PriceTier[];
  addOns: AddOn[];
  coupons: Coupon[];
  bookingType: BookingType;
  availableFrom: string;
  availableTill: string;
  slotsPerDay: number;
  slotsList?: TurfSlot[];
  dailyRoutine?: boolean;
  dateOverrides?: DateOverride[];
  createdAt: string;
  updatedAt: string;
}

export interface TurfSlot {
  startTime: string;
  endTime: string;
  label: string;
  price: number;
  blocked?: boolean;
  blockedReason?: string;
}

export interface DateOverride {
  date: string;
  isHoliday: boolean;
  holidayName: string;
  slots: TurfSlot[];
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
  sport?: string;
  numberOfPlayers?: number;
  foodIncluded?: boolean;
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

export interface CoachWeeklyDay {
  day: number; // 0 = Sunday … 6 = Saturday
  isOpen: boolean;
  startTime: string; // "HH:mm"
  endTime: string;
}

export interface CoachLeave {
  date: string;
  type: "full" | "half";
  reason?: string;
}

export interface CoachBatch {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  days: number[];
  capacity: number;
  priceMonthly: number;
  priceYearly: number;
  demoAvailable: boolean;
  active: boolean;
  /** Present on the public coach detail response. */
  enrolled?: number;
  spotsLeft?: number;
}

export interface CoachLocation {
  address?: string;
  area?: string;
  city?: string;
  lat?: number;
  lng?: number;
}

export interface Coach {
  _id: string;
  vendorId: string;
  slug?: string;
  name: string;
  category: string;
  categories: string[];
  subCategory?: string;
  phone?: string;
  email?: string;
  experienceYears?: number;
  fees?: number;
  bio?: string;
  photoUrl?: string;
  gallery: string[];
  status: "Active" | "Inactive";
  location: CoachLocation;
  weeklyAvailability: CoachWeeklyDay[];
  leaves: CoachLeave[];
  batches: CoachBatch[];
  /** Present on nearby (geo) browse responses. */
  distanceKm?: number;
  createdAt: string;
  updatedAt: string;
}

export type CoachSubscriptionPlan = "demo" | "monthly" | "yearly";
export type CoachSubscriptionStatus = "Active" | "Cancelled" | "Expired";

export interface CoachSubscription {
  _id: string;
  orderId: string;
  coachId: string;
  vendorId: string;
  batchId: string;
  batchName: string;
  customerId?: string | null;
  customerName: string;
  phone: string;
  email?: string;
  plan: CoachSubscriptionPlan;
  amount: number;
  startDate: string;
  endDate?: string | null;
  payment: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentOrderId?: string;
  status: CoachSubscriptionStatus;
  cancellationReason?: string;
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

export interface PriceVariant {
  label: string;
  price: number;
}

export interface MenuItem {
  _id: string;
  vendorId: string;
  outletId?: string;
  name: string;
  description?: string;
  /** Flat price, or "starting from" when priceVariants exist. */
  price: number;
  category: string;
  photo?: string;
  inStock: boolean;
  prepTimeMins?: number;
  /** When non-empty, the customer must pick one when ordering. */
  priceVariants: PriceVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface OutletWeeklyDay {
  day: number; // 0 = Sunday … 6 = Saturday
  isOpen: boolean;
  startTime: string; // "HH:mm"
  endTime: string;
}

export interface OutletLeave {
  date: string;
  type: "full" | "half";
  reason?: string;
}

export interface OutletLocation {
  address?: string;
  area?: string;
  city?: string;
  lat?: number;
  lng?: number;
}

export type FoodOutletKind = "dining" | "venue";

export interface FoodOutlet {
  _id: string;
  vendorId: string;
  slug?: string;
  name: string;
  kind: FoodOutletKind;
  offer?: string;
  description?: string;
  cuisines: string[];
  logo?: string;
  banner?: string;
  poster?: string;
  gallery: string[];
  location: OutletLocation;
  weeklyAvailability: OutletWeeklyDay[];
  leaves: OutletLeave[];
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}

export type FoodOrderStatus = "Pending" | "Accepted" | "Rejected" | "Preparing" | "Ready" | "Delivered" | "Cancelled";

export interface FoodOrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  variantLabel?: string;
}

export interface FoodOrder {
  _id: string;
  orderId: string;
  vendorId: string;
  outletId?: string;
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

export interface FoodDashboardChartPoint {
  date: string;
  label: string;
  orders: number;
  revenue: number;
}

export interface FoodOrderSummary {
  orderId: string;
  customerName: string;
  items: FoodOrderItem[];
  totalAmount: number;
  status: FoodOrderStatus;
  createdAt: string;
}

export interface VendorFoodDashboard {
  period: "day" | "week" | "month" | "year";
  ordersByStatus: Partial<Record<FoodOrderStatus, number>>;
  totalRevenue: number;
  deliveredOrderCount: number;
  allTimeOrderCount: number;
  chart: FoodDashboardChartPoint[];
  recentOrders: FoodOrderSummary[];
}

export interface EventBookingSummary {
  orderId?: string;
  customerName: string;
  listingTitle: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

export interface EventsDashboardChartPoint {
  date: string;
  label: string;
  revenue: number;
  bookings: number;
}

export interface VendorEventsDashboard {
  tournamentsByStatus: Partial<Record<TournamentStatus, number>>;
  upcomingTournamentCount: number;
  upcomingEventCount: number;
  totalRevenue: number;
  bookingCount: number;
  registrationCount: number;
  checkedInCount: number;
  activeEventCount: number;
  chart: EventsDashboardChartPoint[];
  recentBookings: EventBookingSummary[];
}

export interface CoachDashboardChartPoint {
  date: string;
  label: string;
  enrolments: number;
  revenue: number;
}

export interface CoachSubscriptionSummary {
  orderId: string;
  customerName: string;
  batchName: string;
  plan: CoachSubscriptionPlan;
  amount: number;
  paymentStatus: PaymentStatus;
  status: CoachSubscriptionStatus;
  createdAt: string;
}

export interface VendorCoachesDashboard {
  activeCoachCount: number;
  coachCount: number;
  batchCount: number;
  subscriptionsByStatus: Partial<Record<CoachSubscriptionStatus, number>>;
  totalEarnings: number;
  subscriptionCount: number;
  chart: CoachDashboardChartPoint[];
  recentSubscriptions: CoachSubscriptionSummary[];
}

export type VendorStatus = "pending" | "approved" | "suspended";
export type VendorBusinessType = "Company" | "Individual / Proprietor" | "Partnership";
export type VendorBankAccountType = "Savings" | "Current";
/** Which side(s) of the platform this vendor operates — turf owner, events organizer, food & beverages, or coaches. */
export type VendorVertical = "turf" | "events" | "food" | "coaches";

export interface Vendor {
  _id: string;
  ownerName: string;
  businessName: string;
  email: string;
  phone: string;
  state: string;
  city?: string;
  verticals: VendorVertical[];
  status: VendorStatus;
  approvedOn?: string | null;
  notifications: { email: boolean; whatsapp: boolean; offline: boolean };
  logo?: string;
  banner?: string;
  poster?: string;
  businessType?: VendorBusinessType;
  gstNumber?: string;
  categories: string[];
  sports: string[];
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
  | "banners"
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

export interface AdBanner {
  _id: string;
  imageUrl: string;
  title?: string;
  linkUrl?: string;
  order: number;
  isActive: boolean;
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
  /** Turf/listing this plan belongs to; unset = applies to all of the vendor's turfs. */
  listingId?: string;
  name: string;
  description?: string;
  planType: MembershipPlanType;
  price: number;
  durationDays?: number;
  sessionsIncluded?: number;
  turfDimensions?: string;
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
