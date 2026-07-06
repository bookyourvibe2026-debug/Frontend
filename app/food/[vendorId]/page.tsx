"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Minus, Plus, ShoppingBag, UtensilsCrossed } from "lucide-react";
import { SiteHeader } from "../../../components/site-header";
import { MobileTopBar } from "@/components/mobile/ui";
import { LoginModal } from "@/components/home/modals/LoginModal";
import { SignupModal } from "@/components/home/modals/SignupModal";
import { useCustomerAuth } from "@/components/providers/CustomerAuthProvider";
import { getFoodVendorMenu, placeFoodOrder } from "@/lib/api/foodOrders";
import { downloadFoodOrderTicket } from "@/lib/ticket";
import { ApiError } from "@/lib/api/client";
import { FoodOrder, FoodVendor, MenuItem } from "@/lib/api/types";
import type { AuthMode } from "@/components/home/types";

export default function FoodVendorPage() {
  const params = useParams<{ vendorId: string }>();
  const vendorId = params.vendorId;
  const { status: authStatus } = useCustomerAuth();

  const [vendor, setVendor] = useState<FoodVendor | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<FoodOrder | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>(null);

  useEffect(() => {
    getFoodVendorMenu(vendorId)
      .then(({ vendor, items }) => {
        setVendor(vendor);
        setItems(items);
      })
      .catch((err) => setError(err instanceof ApiError ? err.describe() : "Failed to load menu"))
      .finally(() => setLoading(false));
  }, [vendorId]);

  const categories = useMemo(() => {
    const grouped = new Map<string, MenuItem[]>();
    for (const item of items) {
      const list = grouped.get(item.category) ?? [];
      list.push(item);
      grouped.set(item.category, list);
    }
    return Array.from(grouped.entries());
  }, [items]);

  const cartLines = useMemo(
    () =>
      Object.entries(cart)
        .filter(([, qty]) => qty > 0)
        .map(([menuItemId, quantity]) => ({
          menuItemId,
          quantity,
          item: items.find((i) => i._id === menuItemId)!,
        }))
        .filter((line) => line.item),
    [cart, items]
  );

  const total = cartLines.reduce((sum, line) => sum + line.item.price * line.quantity, 0);

  function setQty(itemId: string, qty: number) {
    setCart((c) => ({ ...c, [itemId]: Math.max(0, qty) }));
  }

  async function handlePlaceOrder() {
    if (authStatus !== "authenticated") {
      setAuthMode("login");
      return;
    }
    if (cartLines.length === 0) return;

    setPlacing(true);
    setError(null);
    try {
      const order = await placeFoodOrder({
        vendorId,
        items: cartLines.map((line) => ({ menuItemId: line.menuItemId, quantity: line.quantity })),
      });
      setPlacedOrder(order);
      setCart({});
    } catch (err) {
      setError(err instanceof ApiError ? err.describe() : "Failed to place order");
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fafc,_#eef2ff_45%,_#ffffff_82%)] pb-24">
      <div className="hidden sm:block">
        <SiteHeader />
      </div>
      <div className="sm:hidden px-4 pt-4">
        <MobileTopBar />
      </div>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        {loading && <p className="text-sm text-slate-500">Loading menu...</p>}
        {error && <p className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">{error}</p>}

        {vendor && (
          <>
            <div className="flex items-center gap-4">
              {vendor.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={vendor.logo} alt={vendor.businessName} className="h-16 w-16 rounded-2xl object-cover" />
              ) : (
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
                  <UtensilsCrossed className="h-7 w-7" />
                </span>
              )}
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">{vendor.businessName}</h1>
                <p className="text-sm text-slate-500">
                  {vendor.city ? `${vendor.city}, ` : ""}
                  {vendor.state}
                </p>
              </div>
            </div>

            <div className="mt-8 space-y-8">
              {categories.map(([category, categoryItems]) => (
                <section key={category}>
                  <h2 className="text-sm font-bold uppercase tracking-wide text-brand-600">{category}</h2>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {categoryItems.map((item) => (
                      <div key={item._id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                        {item.photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.photo} alt={item.name} className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                        ) : (
                          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                            <UtensilsCrossed className="h-5 w-5" />
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-slate-900">{item.name}</p>
                          {item.description && <p className="truncate text-xs text-slate-500">{item.description}</p>}
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            ₹{item.price}
                            {item.prepTimeMins ? <span className="ml-1 font-normal text-slate-400">· ~{item.prepTimeMins} min</span> : null}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setQty(item._id, (cart[item._id] ?? 0) - 1)}
                            disabled={!cart[item._id]}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-600 disabled:opacity-40"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-4 text-center text-sm font-semibold">{cart[item._id] ?? 0}</span>
                          <button
                            onClick={() => setQty(item._id, (cart[item._id] ?? 0) + 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-white"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}

              {!loading && items.length === 0 && (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
                  This menu is empty right now. Check back soon.
                </p>
              )}
            </div>
          </>
        )}
      </main>

      {cartLines.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-100 bg-white p-4 shadow-[0_-10px_30px_rgba(15,23,42,0.08)]">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <ShoppingBag className="h-4 w-4" />
              {cartLines.reduce((n, l) => n + l.quantity, 0)} item(s) · ₹{total}
            </div>
            <button
              onClick={handlePlaceOrder}
              disabled={placing}
              className="rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
            >
              {placing ? "Placing…" : "Place Order"}
            </button>
          </div>
        </div>
      )}

      {placedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl">
            <h2 className="text-xl font-extrabold text-slate-900">Order placed!</h2>
            <p className="mt-2 text-sm text-slate-500">
              Order <span className="font-mono font-semibold">{placedOrder.orderId}</span> has been sent to {vendor?.businessName}.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={() => downloadFoodOrderTicket(placedOrder)}
                className="rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3 text-sm font-semibold text-white"
              >
                Download Order Ticket
              </button>
              <button
                onClick={() => setPlacedOrder(null)}
                className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-600"
              >
                Continue Browsing
              </button>
            </div>
          </div>
        </div>
      )}

      {authMode === "login" && (
        <LoginModal
          onClose={() => setAuthMode(null)}
          onLoggedIn={() => setAuthMode(null)}
          onSwitchToSignup={() => setAuthMode("signup")}
        />
      )}
      {authMode === "signup" && (
        <SignupModal
          onClose={() => setAuthMode(null)}
          onSignedUp={() => setAuthMode(null)}
          onSwitchToLogin={() => setAuthMode("login")}
        />
      )}
    </div>
  );
}
