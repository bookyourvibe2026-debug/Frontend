"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { BadgePercent, CalendarOff, Clock, MapPin, Minus, Plus, ShoppingBag, UtensilsCrossed, X } from "lucide-react";
import { SiteHeader } from "../../../components/site-header";
import { MobileTopBar } from "@/components/mobile/ui";
import { LoginModal } from "@/components/home/modals/LoginModal";
import { SignupModal } from "@/components/home/modals/SignupModal";
import { useCustomerAuth } from "@/components/providers/CustomerAuthProvider";
import { getFoodOutletMenu, getFoodVendorMenu, placeFoodOrder } from "@/lib/api/foodOrders";
import { downloadFoodOrderTicket } from "@/lib/ticket";
import { ApiError } from "@/lib/api/client";
import { FoodOrder, FoodOutlet, MenuItem } from "@/lib/api/types";
import type { AuthMode } from "@/components/home/types";

function isOpenNow(outlet: FoodOutlet): boolean {
  const now = new Date();
  const todayKey = now.toDateString();
  if ((outlet.leaves ?? []).some((l) => new Date(l.date).toDateString() === todayKey && l.type === "full")) return false;
  const day = (outlet.weeklyAvailability ?? []).find((d) => d.day === now.getDay());
  if (!day) return true;
  if (!day.isOpen) return false;
  const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return hhmm >= day.startTime && hhmm <= day.endTime;
}

/** Cart line key — a dish with different variants counts as separate lines. */
function lineKey(menuItemId: string, variantLabel?: string) {
  return `${menuItemId}|${variantLabel ?? ""}`;
}

export default function FoodOutletPage() {
  const params = useParams<{ vendorId: string }>();
  const idOrSlug = params.vendorId;
  const { status: authStatus } = useCustomerAuth();

  const [outlet, setOutlet] = useState<FoodOutlet | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<FoodOrder | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>(null);
  const [variantPickerFor, setVariantPickerFor] = useState<MenuItem | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    getFoodOutletMenu(idOrSlug)
      .then(({ outlet, menu }) => {
        setOutlet(outlet);
        setItems(menu);
      })
      .catch(async (err) => {
        // Old links used the vendor-account id — fall back to the legacy endpoint.
        if (err instanceof ApiError) {
          try {
            const { vendor, items } = await getFoodVendorMenu(idOrSlug);
            setOutlet({
              _id: "",
              vendorId: vendor._id,
              name: vendor.businessName,
              kind: "dining",
              cuisines: vendor.categories ?? [],
              logo: vendor.logo,
              banner: vendor.banner,
              poster: vendor.poster,
              gallery: [],
              location: { city: vendor.city },
              weeklyAvailability: [],
              leaves: [],
              status: "Active",
              createdAt: "",
              updatedAt: "",
            });
            setItems(items);
            return;
          } catch {
            setError(err.describe());
            return;
          }
        }
        setError("Failed to load menu");
      })
      .finally(() => setLoading(false));
  }, [idOrSlug]);

  const open = outlet ? isOpenNow(outlet) : true;

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
        .map(([key, quantity]) => {
          const [menuItemId, variantLabel] = key.split("|");
          const item = items.find((i) => i._id === menuItemId);
          if (!item) return null;
          const price =
            variantLabel && item.priceVariants.length > 0
              ? item.priceVariants.find((v) => v.label === variantLabel)?.price ?? item.price
              : item.price;
          return { key, menuItemId: menuItemId!, variantLabel: variantLabel || undefined, quantity, item, price };
        })
        .filter(Boolean) as {
        key: string;
        menuItemId: string;
        variantLabel?: string;
        quantity: number;
        item: MenuItem;
        price: number;
      }[],
    [cart, items]
  );

  const total = cartLines.reduce((sum, line) => sum + line.price * line.quantity, 0);

  function bump(key: string, delta: number) {
    setCart((c) => ({ ...c, [key]: Math.max(0, (c[key] ?? 0) + delta) }));
  }

  /** Quantity of a dish across all its variants (for the card counter). */
  function itemQty(item: MenuItem): number {
    return Object.entries(cart).reduce(
      (sum, [key, qty]) => (key.startsWith(`${item._id}|`) ? sum + qty : sum),
      0
    );
  }

  function handleAdd(item: MenuItem) {
    if (item.priceVariants.length > 0) {
      setVariantPickerFor(item);
    } else {
      bump(lineKey(item._id), 1);
    }
  }

  function handleRemove(item: MenuItem) {
    if (item.priceVariants.length > 0) {
      // Remove from the last variant line that has quantity.
      const line = [...cartLines].reverse().find((l) => l.menuItemId === item._id);
      if (line) bump(line.key, -1);
    } else {
      bump(lineKey(item._id), -1);
    }
  }

  async function handlePlaceOrder() {
    if (authStatus !== "authenticated") {
      setAuthMode("login");
      return;
    }
    if (cartLines.length === 0 || !outlet) return;

    setPlacing(true);
    setError(null);
    try {
      const order = await placeFoodOrder({
        outletId: outlet._id || undefined,
        vendorId: outlet._id ? undefined : outlet.vendorId,
        items: cartLines.map((line) => ({
          menuItemId: line.menuItemId,
          quantity: line.quantity,
          variantLabel: line.variantLabel,
        })),
      });
      setPlacedOrder(order);
      setCart({});
    } catch (err) {
      setError(err instanceof ApiError ? err.describe() : "Failed to place order");
    } finally {
      setPlacing(false);
    }
  }

  const todayHours = outlet?.weeklyAvailability?.find((d) => d.day === new Date().getDay());

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

        {outlet && (
          <>
            {/* Poster header */}
            {(outlet.poster || outlet.banner) && (
              <div className="relative mb-6 overflow-hidden rounded-3xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={outlet.poster || outlet.banner}
                  alt={`${outlet.name} poster`}
                  className="h-48 w-full object-cover sm:h-64"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <span
                  className={`absolute right-4 top-4 rounded-full px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide ${
                    open ? "bg-emerald-500 text-white" : "bg-slate-900/90 text-white"
                  }`}
                >
                  {open ? "Open now" : "Closed"}
                </span>
              </div>
            )}

            <div className="flex items-center gap-4">
              {outlet.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={outlet.logo} alt={outlet.name} className="h-16 w-16 shrink-0 rounded-2xl object-cover" />
              ) : (
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
                  <UtensilsCrossed className="h-7 w-7" />
                </span>
              )}
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-extrabold text-slate-900 sm:text-3xl">{outlet.name}</h1>
                {outlet.cuisines.length > 0 && (
                  <p className="truncate text-sm font-semibold text-brand-600">{outlet.cuisines.slice(0, 4).join(" · ")}</p>
                )}
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                  {(outlet.location?.area || outlet.location?.city) && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {[outlet.location.area, outlet.location.city].filter(Boolean).join(", ")}
                    </span>
                  )}
                  {todayHours?.isOpen && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Today {todayHours.startTime}–{todayHours.endTime}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {outlet.description && <p className="mt-3 text-sm leading-relaxed text-slate-600">{outlet.description}</p>}

            {outlet.kind === "dining" && outlet.offer && (
              <div className="mt-3 flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
                <BadgePercent className="h-4 w-4 shrink-0" /> {outlet.offer}
                <span className="ml-auto text-[11px] font-semibold text-amber-600">Show your BYV booking</span>
              </div>
            )}

            {/* Upcoming holidays */}
            {(outlet.leaves ?? []).length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {outlet.leaves.map((l) => (
                  <span
                    key={l.date}
                    className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold ${
                      l.type === "half" ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                    }`}
                  >
                    <CalendarOff className="h-3 w-3" />
                    {new Date(l.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    {l.type === "half" ? " · Half-day" : " · Closed"}
                  </span>
                ))}
              </div>
            )}

            {/* Gallery */}
            {(outlet.gallery ?? []).length > 0 && (
              <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
                {outlet.gallery.map((url) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setLightbox(url)}
                    className="h-24 w-32 shrink-0 overflow-hidden rounded-xl transition hover:opacity-90"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="Gallery" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {!open && (
              <p className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
                This restaurant is closed right now — you can browse the menu and come back later.
              </p>
            )}

            {/* Menu — Swiggy-style image-forward cards */}
            <div className="mt-8 space-y-8">
              {categories.map(([category, categoryItems]) => (
                <section key={category}>
                  <h2 className="text-sm font-bold uppercase tracking-wide text-brand-600">
                    {category} <span className="font-normal text-slate-400">· {categoryItems.length}</span>
                  </h2>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {categoryItems.map((item) => {
                      const qty = itemQty(item);
                      return (
                        <div
                          key={item._id}
                          className="flex min-w-0 items-stretch justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm"
                        >
                          <div className="min-w-0 flex-1 py-1">
                            <p className="text-sm font-bold text-slate-900">{item.name}</p>
                            <p className="mt-0.5 text-sm font-semibold text-slate-900">
                              {item.priceVariants.length > 0 ? (
                                <>
                                  <span className="text-xs font-normal text-slate-400">from </span>₹
                                  {Math.min(...item.priceVariants.map((v) => v.price))}
                                </>
                              ) : (
                                <>₹{item.price}</>
                              )}
                              {item.prepTimeMins ? (
                                <span className="ml-1 text-xs font-normal text-slate-400">· ~{item.prepTimeMins} min</span>
                              ) : null}
                            </p>
                            {item.description && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.description}</p>}
                            {item.priceVariants.length > 0 && (
                              <p className="mt-1 text-[11px] font-semibold text-brand-600">
                                {item.priceVariants.map((v) => v.label).join(" / ")}
                              </p>
                            )}
                          </div>

                          {/* Photo with floating add button — the Swiggy pattern */}
                          <div className="relative w-28 shrink-0">
                            {item.photo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.photo} alt={item.name} className="h-24 w-28 rounded-xl object-cover" />
                            ) : (
                              <div className="flex h-24 w-28 items-center justify-center rounded-xl bg-slate-50 text-slate-300">
                                <UtensilsCrossed className="h-6 w-6" />
                              </div>
                            )}
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                              {qty === 0 ? (
                                <button
                                  onClick={() => handleAdd(item)}
                                  className="rounded-full bg-white px-5 py-1.5 text-xs font-extrabold uppercase text-brand-600 shadow-md ring-1 ring-slate-200 transition hover:scale-105"
                                >
                                  Add
                                </button>
                              ) : (
                                <div className="flex items-center gap-2 rounded-full bg-brand-600 px-2 py-1 text-white shadow-md">
                                  <button onClick={() => handleRemove(item)} className="flex h-5 w-5 items-center justify-center">
                                    <Minus className="h-3.5 w-3.5" />
                                  </button>
                                  <span className="w-4 text-center text-xs font-bold">{qty}</span>
                                  <button onClick={() => handleAdd(item)} className="flex h-5 w-5 items-center justify-center">
                                    <Plus className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
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

      {/* Sticky cart bar */}
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

      {/* Variant picker sheet */}
      {variantPickerFor && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">{variantPickerFor.name}</h3>
                <p className="text-xs text-slate-500">Choose a size / option</p>
              </div>
              <button
                onClick={() => setVariantPickerFor(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2">
              {variantPickerFor.priceVariants.map((v) => (
                <button
                  key={v.label}
                  onClick={() => {
                    bump(lineKey(variantPickerFor._id, v.label), 1);
                    setVariantPickerFor(null);
                  }}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-left transition hover:border-brand-400 hover:bg-brand-50"
                >
                  <span className="text-sm font-bold text-slate-900">{v.label}</span>
                  <span className="text-sm font-extrabold text-brand-600">₹{v.price}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Gallery lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setLightbox(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="Gallery" className="max-h-[85vh] max-w-full rounded-2xl object-contain" />
        </div>
      )}

      {placedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl">
            <h2 className="text-xl font-extrabold text-slate-900">Order placed!</h2>
            <p className="mt-2 text-sm text-slate-500">
              Order <span className="font-mono font-semibold">{placedOrder.orderId}</span> has been sent to {outlet?.name}.
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
