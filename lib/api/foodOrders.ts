import { apiRequest, type Paginated } from "./client";
import type { FoodOrder, FoodOutlet, FoodVendor, MenuItem } from "./types";

/* ---- Restaurants (outlets) ---- */

export function getFoodOutlets(
  params: { cuisine?: string; city?: string; kind?: "dining" | "venue"; page?: number; limit?: number } = {}
) {
  return apiRequest<Paginated<FoodOutlet>>("/food/outlets", { query: params });
}

export function getFoodOutletMenu(idOrSlug: string) {
  return apiRequest<{ outlet: FoodOutlet; menu: MenuItem[] }>(`/food/outlets/${idOrSlug}`);
}

/* ---- Legacy vendor-account browse (old links) ---- */

export function getFoodVendors() {
  return apiRequest<FoodVendor[]>("/food/vendors");
}

export function getFoodVendorMenu(vendorId: string) {
  return apiRequest<{ vendor: FoodVendor; items: MenuItem[] }>(`/food/vendors/${vendorId}/menu`);
}

/* ---- Orders ---- */

export interface PlaceFoodOrderInput {
  outletId?: string;
  vendorId?: string;
  items: { menuItemId: string; quantity: number; variantLabel?: string }[];
  notes?: string;
}

export function placeFoodOrder(input: PlaceFoodOrderInput) {
  return apiRequest<FoodOrder>("/food/orders", { method: "POST", body: input, audience: "customer" });
}

export function getMyFoodOrders(params: { page?: number; limit?: number } = {}) {
  return apiRequest<Paginated<FoodOrder>>("/food/orders/mine", { query: params, audience: "customer" });
}

export function getMyFoodOrderByOrderId(orderId: string) {
  return apiRequest<FoodOrder>(`/food/orders/${orderId}`, { audience: "customer" });
}
