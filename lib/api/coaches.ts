import { apiRequest, type Paginated } from "./client";
import type { Coach, CoachBooking, CoachBookingStatus, PaymentMethod } from "./types";

export function browsePublicCoaches(params: { category?: string; vendorId?: string; page?: number; limit?: number } = {}) {
  return apiRequest<Paginated<Coach>>("/coaches", { query: params });
}

export function getPublicCoachById(id: string) {
  return apiRequest<Coach>(`/coaches/${id}`);
}

export interface BookCoachSlotInput {
  coachId: string;
  slotId: string;
  customerName?: string;
  phone?: string;
  email?: string;
  payment: PaymentMethod;
}

export function bookCoachSlot(input: BookCoachSlotInput) {
  return apiRequest<CoachBooking>("/coach-bookings", { method: "POST", body: input, audience: "customer" });
}

export function getMyCoachBookings(params: { status?: CoachBookingStatus; page?: number; limit?: number } = {}) {
  return apiRequest<Paginated<CoachBooking>>("/coach-bookings", { query: params, audience: "customer" });
}

export function getMyCoachBookingByOrderId(orderId: string) {
  return apiRequest<CoachBooking>(`/coach-bookings/${orderId}`, { audience: "customer" });
}

export function cancelMyCoachBooking(orderId: string, cancellationReason?: string) {
  return apiRequest<CoachBooking>(`/coach-bookings/${orderId}/cancel`, {
    method: "POST",
    body: { cancellationReason },
    audience: "customer",
  });
}
