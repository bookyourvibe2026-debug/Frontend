import { apiRequest, type Paginated } from "./client";
import type {
  Booking,
  BookingStatus,
  Coach,
  CoachBooking,
  CoachBookingStatus,
  FoodOrder,
  FoodOrderStatus,
  Listing,
  ListingType,
  Membership,
  MembershipPlanType,
  MenuItem,
  ModulePermissionKey,
  PermissionsMap,
  SettledPayment,
  Subscription,
  SubscriptionStatus,
  Tournament,
  TournamentRegistration,
  TournamentRegistrationStatus,
  TournamentStatus,
  Vendor,
  VendorCoachesDashboard,
  VendorDashboard,
  VendorEventsDashboard,
  VendorFoodDashboard,
  VendorStaff,
} from "./types";

const AUD = "vendor" as const;

/* ---- Dashboard ---- */

export function getVendorDashboard() {
  return apiRequest<VendorDashboard>("/vendor/dashboard", { audience: AUD });
}

export function getVendorSettledPayments() {
  return apiRequest<SettledPayment[]>("/vendor/dashboard/settled-payments", { audience: AUD });
}

export async function exportVendorBookings() {
  const token = localStorage.getItem("vendorToken");
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
  const response = await fetch(`${baseUrl}/vendor/bookings/export`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error("Failed to export bookings");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "bookings_report.xlsx";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ---- Profile ---- */

export function getVendorProfile() {
  return apiRequest<Vendor>("/vendor/profile", { audience: AUD });
}

export interface UpdateVendorProfileInput {
  ownerName?: string;
  businessName?: string;
  city?: string;
  state?: string;
  notifications?: Partial<{ email: boolean; whatsapp: boolean; offline: boolean }>;
  logo?: string;
  banner?: string;
  poster?: string;
  businessType?: Vendor["businessType"];
  gstNumber?: string;
  categories?: string[];
  sports?: string[];
  address?: Partial<Vendor["address"]>;
  bankDetails?: Partial<Vendor["bankDetails"]>;
}

export function updateVendorProfile(input: UpdateVendorProfileInput) {
  return apiRequest<Vendor>("/vendor/profile", { method: "PATCH", body: input, audience: AUD });
}

/* ---- Dashboard ---- */

export interface VendorDashboardStats {
  listingsCount: number;
  activeListingsCount: number;
  bookingsByStatus: Record<string, number>;
  totalEarnings: number;
  earningsTrend: number;
  settledBookingsCount: number;
  bookingsTrend: number;
  customersCount: number;
  customersTrend: number;
  occupancyRate: number;
  occupancyTrend: number;
}

export function getVendorDashboardStats(params?: { startDate?: string; endDate?: string; compareWith?: string }) {
  const query = params ? "?" + new URLSearchParams(params as any).toString() : "";
  return apiRequest<VendorDashboardStats>(`/vendor/dashboard${query}`, { audience: AUD });
}

/* ---- Staff ---- */

export function listVendorStaff() {
  return apiRequest<VendorStaff[]>("/vendor/staff", { audience: AUD });
}

export interface CreateVendorStaffInput {
  roleName: string;
  holderName: string;
  holderEmail: string;
  holderPhone: string;
  accountType: "staff" | "subadmin";
  password: string;
  permissions: PermissionsMap<ModulePermissionKey>;
}

export function createVendorStaff(input: CreateVendorStaffInput) {
  return apiRequest<VendorStaff>("/vendor/staff", { method: "POST", body: input, audience: AUD });
}

export interface UpdateVendorStaffInput {
  roleName?: string;
  holderName?: string;
  holderPhone?: string;
  accountType?: "staff" | "subadmin";
  status?: "Active" | "Inactive";
  permissions?: PermissionsMap<ModulePermissionKey>;
}

export function updateVendorStaff(id: string, input: UpdateVendorStaffInput) {
  return apiRequest<VendorStaff>(`/vendor/staff/${id}`, { method: "PUT", body: input, audience: AUD });
}

export function deleteVendorStaff(id: string) {
  return apiRequest<null>(`/vendor/staff/${id}`, { method: "DELETE", audience: AUD });
}

/* ---- Listings ---- */

export type ListingInput = Partial<
  Omit<Listing, "_id" | "createdAt" | "updatedAt" | "access" | "vendorId" | "sharedWithVendors">
> & {
  title: string;
  type: ListingType;
  categories: string[];
  price: number;
  city: string;
  state: string;
  address: string;
  description: string;
  availableFrom: string;
  availableTill: string;
  slotsPerDay: number;
};

export function getVendorListings(params: { type?: ListingType; search?: string } = {}) {
  return apiRequest<Listing[]>("/vendor/listings", { query: params, audience: AUD });
}

export function getVendorListingById(id: string) {
  return apiRequest<Listing>(`/vendor/listings/${id}`, { audience: AUD });
}

export function createVendorListing(input: ListingInput) {
  return apiRequest<Listing>("/vendor/listings", { method: "POST", body: input, audience: AUD });
}

export function updateVendorListing(id: string, input: Partial<ListingInput>) {
  return apiRequest<Listing>(`/vendor/listings/${id}`, { method: "PUT", body: input, audience: AUD });
}

export function deleteVendorListing(id: string) {
  return apiRequest<null>(`/vendor/listings/${id}`, { method: "DELETE", audience: AUD });
}

/* ---- Bookings ---- */

export function getVendorBookings(params: { status?: BookingStatus; page?: number; limit?: number } = {}) {
  return apiRequest<Paginated<Booking>>("/vendor/bookings", { query: params, audience: AUD });
}

export interface CreateVendorBookingInput {
  listingId: string;
  customerName: string;
  phone: string;
  /** Sport the slot is booked for (manual/walk-in bookings). */
  sport?: string;
  dateTime: string;
  /** Slot end as "HH:mm". */
  endTime?: string;
  totalAmount: number;
  payment: Booking["payment"];
  status: BookingStatus;
}

export function createVendorBooking(input: CreateVendorBookingInput) {
  return apiRequest<Booking>("/vendor/bookings", { method: "POST", body: input, audience: AUD });
}

export function getVendorBookingByOrderId(orderId: string) {
  return apiRequest<Booking>(`/vendor/bookings/${orderId}`, { audience: AUD });
}

export function updateVendorBookingStatus(orderId: string, status: BookingStatus, cancellationReason?: string) {
  return apiRequest<Booking>(`/vendor/bookings/${orderId}/status`, {
    method: "PATCH",
    body: { status, cancellationReason },
    audience: AUD,
  });
}

/* ---- Coaches ---- */

export function listVendorCoaches(params: { status?: "Active" | "Inactive"; page?: number; limit?: number } = {}) {
  return apiRequest<Paginated<Coach>>("/vendor/coaches", { query: params, audience: AUD });
}

export function getVendorCoachById(id: string) {
  return apiRequest<Coach>(`/vendor/coaches/${id}`, { audience: AUD });
}

export interface CreateCoachInput {
  name: string;
  category: string;
  subCategory?: string;
  experienceYears?: number;
  fees: number;
  bio?: string;
  photoUrl?: string;
  status?: "Active" | "Inactive";
}

export function createCoach(input: CreateCoachInput) {
  return apiRequest<Coach>("/vendor/coaches", { method: "POST", body: input, audience: AUD });
}

export function updateCoach(id: string, input: Partial<CreateCoachInput>) {
  return apiRequest<Coach>(`/vendor/coaches/${id}`, { method: "PUT", body: input, audience: AUD });
}

export function deleteCoach(id: string) {
  return apiRequest<null>(`/vendor/coaches/${id}`, { method: "DELETE", audience: AUD });
}

export function addCoachSlot(coachId: string, input: { date: string; startTime: string; endTime: string }) {
  return apiRequest<Coach>(`/vendor/coaches/${coachId}/slots`, { method: "POST", body: input, audience: AUD });
}

export function removeCoachSlot(coachId: string, slotId: string) {
  return apiRequest<Coach>(`/vendor/coaches/${coachId}/slots/${slotId}`, { method: "DELETE", audience: AUD });
}

export function listVendorCoachBookings(params: { status?: CoachBookingStatus; coachId?: string; page?: number; limit?: number } = {}) {
  return apiRequest<Paginated<CoachBooking>>("/vendor/coaches/bookings", { query: params, audience: AUD });
}

export function checkInVendorCoachBooking(orderId: string) {
  return apiRequest<CoachBooking>(`/vendor/coaches/bookings/${orderId}/checkin`, { method: "POST", audience: AUD });
}

/* ---- Tournaments ---- */

export function listVendorTournaments(params: { status?: TournamentStatus; page?: number; limit?: number } = {}) {
  return apiRequest<Paginated<Tournament>>("/vendor/tournaments", { query: params, audience: AUD });
}

export function getVendorTournamentById(id: string) {
  return apiRequest<Tournament>(`/vendor/tournaments/${id}`, { audience: AUD });
}

export interface CreateTournamentInput {
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
  status?: TournamentStatus;
}

export function createTournament(input: CreateTournamentInput) {
  return apiRequest<Tournament>("/vendor/tournaments", { method: "POST", body: input, audience: AUD });
}

export function updateTournament(id: string, input: Partial<CreateTournamentInput>) {
  return apiRequest<Tournament>(`/vendor/tournaments/${id}`, { method: "PUT", body: input, audience: AUD });
}

export function addTournamentFixture(
  tournamentId: string,
  input: { round: string; teamAId: string; teamBId: string; scheduledAt: string }
) {
  return apiRequest<Tournament>(`/vendor/tournaments/${tournamentId}/fixtures`, { method: "POST", body: input, audience: AUD });
}

export function updateFixtureResult(
  tournamentId: string,
  fixtureId: string,
  input: { teamAScore: number; teamBScore: number; winnerTeamId?: string }
) {
  return apiRequest<Tournament>(`/vendor/tournaments/${tournamentId}/fixtures/${fixtureId}`, {
    method: "PATCH",
    body: input,
    audience: AUD,
  });
}

export function listVendorTournamentRegistrations(
  params: { status?: TournamentRegistrationStatus; tournamentId?: string; page?: number; limit?: number } = {}
) {
  return apiRequest<Paginated<TournamentRegistration>>("/vendor/tournaments/registrations", { query: params, audience: AUD });
}

export function checkInVendorTournamentRegistration(orderId: string) {
  return apiRequest<TournamentRegistration>(`/vendor/tournaments/registrations/${orderId}/checkin`, {
    method: "POST",
    audience: AUD,
  });
}

/* ---- Memberships ---- */

export function listMemberships() {
  return apiRequest<Membership[]>("/vendor/memberships", { audience: AUD });
}

export interface CreateMembershipInput {
  /** Turf/listing this plan belongs to; omit to apply to all turfs. */
  listingId?: string;
  name: string;
  description?: string;
  planType: MembershipPlanType;
  price: number;
  durationDays?: number;
  sessionsIncluded?: number;
  turfDimensions?: string;
}

export function createMembership(input: CreateMembershipInput) {
  return apiRequest<Membership>("/vendor/memberships", { method: "POST", body: input, audience: AUD });
}

export function updateMembership(id: string, input: Partial<CreateMembershipInput> & { status?: "Active" | "Inactive" }) {
  return apiRequest<Membership>(`/vendor/memberships/${id}`, { method: "PUT", body: input, audience: AUD });
}

export function deleteMembership(id: string) {
  return apiRequest<null>(`/vendor/memberships/${id}`, { method: "DELETE", audience: AUD });
}

export function listSubscriptions() {
  return apiRequest<Subscription[]>("/vendor/memberships/subscriptions/all", { audience: AUD });
}

export function createSubscription(input: { membershipId: string; customerName: string; phone: string; amountPaid: number }) {
  return apiRequest<Subscription>("/vendor/memberships/subscriptions", { method: "POST", body: input, audience: AUD });
}

export function updateSubscriptionStatus(id: string, status: SubscriptionStatus) {
  return apiRequest<Subscription>(`/vendor/memberships/subscriptions/${id}/status`, {
    method: "PATCH",
    body: { status },
    audience: AUD,
  });
}

/* ---- QR check-in ---- */

export function checkInVendorBooking(orderId: string) {
  return apiRequest<Booking>(`/vendor/bookings/${orderId}/checkin`, { method: "POST", audience: AUD });
}

/* ---- Menu (Food Owner) ---- */

export function listVendorMenu() {
  return apiRequest<MenuItem[]>("/vendor/menu", { audience: AUD });
}

export interface MenuItemInput {
  name: string;
  description?: string;
  price: number;
  category?: string;
  photo?: string;
  inStock?: boolean;
  prepTimeMins?: number;
}

export function createVendorMenuItem(input: MenuItemInput) {
  return apiRequest<MenuItem>("/vendor/menu", { method: "POST", body: input, audience: AUD });
}

export function updateVendorMenuItem(id: string, input: Partial<MenuItemInput>) {
  return apiRequest<MenuItem>(`/vendor/menu/${id}`, { method: "PUT", body: input, audience: AUD });
}

export function deleteVendorMenuItem(id: string) {
  return apiRequest<null>(`/vendor/menu/${id}`, { method: "DELETE", audience: AUD });
}

/* ---- Food Orders (Food Owner) ---- */

export function getVendorFoodOrders(params: { status?: FoodOrderStatus; page?: number; limit?: number } = {}) {
  return apiRequest<Paginated<FoodOrder>>("/vendor/food-orders", { query: params, audience: AUD });
}

export function updateVendorFoodOrderStatus(orderId: string, status: FoodOrderStatus) {
  return apiRequest<FoodOrder>(`/vendor/food-orders/${orderId}/status`, { method: "PATCH", body: { status }, audience: AUD });
}

export function checkInVendorFoodOrder(orderId: string) {
  return apiRequest<FoodOrder>(`/vendor/food-orders/${orderId}/checkin`, { method: "POST", audience: AUD });
}

export function getVendorFoodDashboard(period: "day" | "week" | "month" | "year" = "day") {
  return apiRequest<VendorFoodDashboard>("/vendor/food-dashboard", { query: { period }, audience: AUD });
}

export function getVendorEventsDashboard() {
  return apiRequest<VendorEventsDashboard>("/vendor/events-dashboard", { audience: AUD });
}

export function getVendorCoachesDashboard() {
  return apiRequest<VendorCoachesDashboard>("/vendor/coaches-dashboard", { audience: AUD });
}

/* ---- MPIN ---- */

export function getMpinStatus() {
  return apiRequest<{ hasPin: boolean }>("/vendor/mpin/status", { audience: AUD });
}

export function setMpin(pin: string) {
  return apiRequest<null>("/vendor/mpin/set", { method: "POST", body: { pin }, audience: AUD });
}

export function verifyMpin(pin: string) {
  return apiRequest<null>("/vendor/mpin/verify", { method: "POST", body: { pin }, audience: AUD });
}

export function requestMpinChange() {
  return apiRequest<null>("/vendor/mpin/change/request", { method: "POST", audience: AUD });
}

export function confirmMpinChange(otp: string, newPin: string) {
  return apiRequest<null>("/vendor/mpin/change/confirm", { method: "POST", body: { otp, newPin }, audience: AUD });
}


/* ─── Expenses ──────────────────────────────────────────────────── */

export type ExpenseCategory = "Maintenance" | "Rent" | "Salary" | "Misc";
export const EXPENSE_CATEGORIES: ExpenseCategory[] = ["Maintenance", "Rent", "Salary", "Misc"];

export interface VendorExpense {
  _id: string;
  category: ExpenseCategory;
  amount: number;
  note?: string;
  spentAt: string;
  createdAt: string;
}

export interface ExpenseListResponse {
  items: VendorExpense[];
  total: number;
  byCategory: Partial<Record<ExpenseCategory, number>>;
}

export interface CreateExpenseInput {
  category: ExpenseCategory;
  amount: number;
  note?: string;
  spentAt?: string;
}

export function getVendorExpenses(params: { from?: string; to?: string } = {}) {
  const qs = new URLSearchParams();
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);
  const suffix = qs.toString() ? `?${qs}` : "";
  return apiRequest<ExpenseListResponse>(`/vendor/expenses${suffix}`, { audience: AUD });
}

export function createVendorExpense(input: CreateExpenseInput) {
  return apiRequest<VendorExpense>("/vendor/expenses", { method: "POST", body: input, audience: AUD });
}

export function deleteVendorExpense(id: string) {
  return apiRequest<null>(`/vendor/expenses/${id}`, { method: "DELETE", audience: AUD });
}
