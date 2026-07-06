import { apiRequest, type Paginated } from "./client";
import type { FoodOrder, FoodVendor, MenuItem } from "./types";

export function getFoodVendors() {
  return apiRequest<FoodVendor[]>("/food/vendors");
}

export function getFoodVendorMenu(vendorId: string) {
  return apiRequest<{ vendor: FoodVendor; items: MenuItem[] }>(`/food/vendors/${vendorId}/menu`);
}

export interface PlaceFoodOrderInput {
  vendorId: string;
  items: { menuItemId: string; quantity: number }[];
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
