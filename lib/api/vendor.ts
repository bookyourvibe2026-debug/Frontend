import { apiRequest, type Paginated } from "./client";
import type {
  Booking,
  BookingStatus,
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
  Vendor,
  VendorDashboard,
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
  address?: Partial<Vendor["address"]>;
  bankDetails?: Partial<Vendor["bankDetails"]>;
}

export function updateVendorProfile(input: UpdateVendorProfileInput) {
  return apiRequest<Vendor>("/vendor/profile", { method: "PATCH", body: input, audience: AUD });
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
  category: string;
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
  dateTime: string;
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

/* ---- Memberships ---- */

export function listMemberships() {
  return apiRequest<Membership[]>("/vendor/memberships", { audience: AUD });
}

export interface CreateMembershipInput {
  name: string;
  description?: string;
  planType: MembershipPlanType;
  price: number;
  durationDays?: number;
  sessionsIncluded?: number;
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
