"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import QRCode from "qrcode";
import {
  ArrowLeft,
  ArrowRight,
  BadgePercent,
  CalendarOff,
  Check,
  Clock,
  Download,
  MapPin,
  Minus,
  Plus,
  Share2,
  ShieldCheck,
  ShoppingBag,
  UtensilsCrossed,
  X,
} from "lucide-react";
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
  const { status: authStatus, customer } = useCustomerAuth();

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

  /* ---- Checkout & Payment Steps ---- */
  const [checkoutStep, setCheckoutStep] = useState<"menu" | "summary" | "payment" | "confirmed">("menu");
  const [selectedPayMethod, setSelectedPayMethod] = useState<"UPI" | "Card" | "NetBanking">("UPI");
  const [orderIdPreview, setOrderIdPreview] = useState<string>("");
  const [orderQrUrl, setOrderQrUrl] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

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

  const subtotal = useMemo(() => cartLines.reduce((sum, line) => sum + line.price * line.quantity, 0), [cartLines]);
  const taxAmount = useMemo(() => Math.round(subtotal * 0.05) + 15, [subtotal]); // 5% GST + ₹15 packaging & platform fee
  const grandTotal = subtotal + taxAmount;

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

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

  /* ---- Checkout Actions ---- */

  function handlePlaceOrderClick() {
    if (authStatus !== "authenticated") {
      setAuthMode("login");
      return;
    }
    if (cartLines.length === 0 || !outlet) return;

    if (!orderIdPreview) {
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      setOrderIdPreview(`BYV-FOOD-${randomNum}`);
    }
    setCheckoutStep("summary");
  }

  function handleProceedToPayment() {
    setCheckoutStep("payment");
  }

  async function handleConfirmPayment() {
    if (!outlet || cartLines.length === 0 || placing) return;
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

      // Generate Verification QR Code URL
      try {
        const qrUrl = await QRCode.toDataURL(
          JSON.stringify({ orderId: order.orderId, vendorId: order.vendorId }),
          { margin: 0, width: 180, color: { dark: "#0f172a", light: "#ffffff" } }
        );
        setOrderQrUrl(qrUrl);
      } catch {
        setOrderQrUrl(null);
      }

      setCart({});
      setCheckoutStep("confirmed");
    } catch (err) {
      setError(err instanceof ApiError ? err.describe() : "Payment failed. Please try again.");
    } finally {
      setPlacing(false);
    }
  }

  function handleDownloadBill() {
    if (!placedOrder) return;
    downloadFoodOrderTicket({
      ...placedOrder,
      outletName: outlet?.name,
      paymentMethod: `Paid via ${selectedPayMethod}`,
      subtotal,
      taxAmount,
    });
  }

  function shareFoodOrder() {
    if (!placedOrder || !outlet) return;
    const text = `My food order #${placedOrder.orderId} from ${outlet.name} is confirmed on Book Your Vibe!\nTotal Paid: ₹${placedOrder.totalAmount}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: `Food Order #${placedOrder.orderId}`, text }).catch(() => {});
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast("Order details copied to clipboard!");
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

      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] rounded-full bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-xl animate-in fade-in slide-in-from-top-3">
          {toast}
        </div>
      )}

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        {loading && <p className="text-sm text-slate-500">Loading menu...</p>}
        {error && <p className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600 mb-4">{error}</p>}

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
                  loading="lazy"
                  decoding="async"
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
                <img
                  src={outlet.logo}
                  alt={outlet.name}
                  className="h-16 w-16 shrink-0 rounded-2xl object-cover"
                  loading="lazy"
                  decoding="async"
                />
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
                    <img src={url} alt="Gallery" className="h-full w-full object-cover" loading="lazy" decoding="async" />
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

                          {/* Photo with floating add button */}
                          <div className="relative w-28 shrink-0">
                            {item.photo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.photo}
                                alt={item.name}
                                className="h-24 w-28 rounded-xl object-cover"
                                loading="lazy"
                                decoding="async"
                              />
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
      {cartLines.length > 0 && checkoutStep === "menu" && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-100 bg-white p-4 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] animate-in slide-in-from-bottom-5">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-sm text-slate-700">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <ShoppingBag className="h-5 w-5" />
              </span>
              <div>
                <p className="font-extrabold text-slate-900 leading-tight">
                  {cartLines.reduce((n, l) => n + l.quantity, 0)} item(s) · ₹{subtotal}
                </p>
                <p className="text-[11px] font-semibold text-slate-400">Taxes &amp; fees calculated at checkout</p>
              </div>
            </div>
            <button
              onClick={handlePlaceOrderClick}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-7 py-3.5 text-sm font-extrabold text-white shadow-md transition hover:scale-[1.02] active:scale-[0.98]"
            >
              Place Order <ArrowRight className="h-4 w-4" />
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
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="Gallery" className="max-h-[85vh] max-w-full rounded-2xl object-contain" loading="lazy" decoding="async" />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. FOOD ORDER SUMMARY SCREEN MODAL                                        */}
      {/* ========================================================================= */}
      {checkoutStep === "summary" && outlet && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4 animate-in fade-in duration-200">
          <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
            {/* Summary Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 px-6 py-4 text-white">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCheckoutStep("menu")}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div>
                  <h3 className="text-base font-extrabold tracking-tight">Food Order Summary</h3>
                  <p className="text-[11px] font-medium text-slate-300">Review items &amp; billing breakdown</p>
                </div>
              </div>
              <button
                onClick={() => setCheckoutStep("menu")}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Summary Body Content */}
            <div className="overflow-y-auto p-5 space-y-4">
              {/* Restaurant Details Card */}
              <div className="flex items-center gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5">
                {outlet.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={outlet.logo} alt={outlet.name} className="h-12 w-12 rounded-xl object-cover border border-slate-200" />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <UtensilsCrossed className="h-6 w-6" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-extrabold text-slate-900">{outlet.name}</h4>
                  <p className="mt-0.5 text-xs text-slate-500 truncate">
                    {[outlet.location?.area, outlet.location?.city].filter(Boolean).join(", ") || "Dining Partner"}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                  Active
                </span>
              </div>

              {/* Order Reference Preview */}
              <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Order Reference Preview</span>
                  <span className="font-mono font-bold text-slate-900">{orderIdPreview}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Customer</span>
                  <span className="font-bold text-slate-800">{customer?.name || "Guest Customer"}</span>
                </div>
              </div>

              {/* Ordered Items List */}
              <div className="rounded-2xl border border-slate-100 bg-white p-4">
                <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Ordered Items ({cartLines.length})</h4>
                  <button onClick={() => setCheckoutStep("menu")} className="text-xs font-bold text-brand-600 hover:underline">
                    Edit Items
                  </button>
                </div>
                <div className="divide-y divide-slate-100 space-y-2">
                  {cartLines.map((line) => (
                    <div key={line.key} className="pt-2 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-[11px] font-extrabold text-brand-700">
                          {line.quantity}x
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">{line.item.name}</p>
                          {line.variantLabel && <p className="text-[10px] font-medium text-slate-400">{line.variantLabel}</p>}
                        </div>
                      </div>
                      <span className="font-extrabold text-slate-900 ml-2">₹{(line.price * line.quantity).toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Item Subtotal</span>
                  <span className="font-bold text-slate-900">₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1">
                    GST (5%) &amp; Restaurant Packaging Fee
                  </span>
                  <span className="font-semibold text-slate-700">₹{taxAmount}</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-sm font-extrabold text-slate-900">
                  <span>Grand Total</span>
                  <span className="text-base text-brand-600">₹{grandTotal.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-700 bg-emerald-50 p-3 rounded-2xl border border-emerald-100">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>Instant confirmation &amp; live preparation tracking after payment</span>
              </div>
            </div>

            {/* Summary Footer Action */}
            <div className="border-t border-slate-100 bg-white p-4">
              <button
                onClick={handleProceedToPayment}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 py-4 text-sm font-extrabold uppercase tracking-wide text-white shadow-lg shadow-emerald-600/25 transition hover:scale-[1.01] active:scale-[0.99]"
              >
                <span>PAY ₹{grandTotal.toLocaleString("en-IN")} NOW</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. BYV SECURE PAYMENT GATEWAY MODAL (REUSING VENUE BOOKING PAYMENT UI)    */}
      {/* ========================================================================= */}
      {checkoutStep === "payment" && outlet && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
            {/* Gateway Header */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-5 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 backdrop-blur-xs">
                    <ShieldCheck className="h-5 w-5 text-white" />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold tracking-wide uppercase">BYV Secure Checkout</h3>
                    <p className="text-[10px] text-emerald-100 font-medium">Powered by BYV Payment Gateway</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCheckoutStep("summary")}
                  className="rounded-full bg-white/10 p-1.5 text-white transition hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 rounded-2xl bg-white/10 backdrop-blur-xs p-3 flex items-center justify-between border border-white/20">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">Order Reference</p>
                  <p className="text-xs font-mono font-bold text-white">{orderIdPreview}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">Restaurant</p>
                  <p className="text-xs font-extrabold text-white truncate max-w-[140px]">{outlet.name}</p>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="p-5 space-y-4">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-500 font-medium">
                  <span>Food Items Subtotal</span>
                  <span className="font-bold text-slate-800">₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500 font-medium">
                  <span>Taxes &amp; Packaging Fee</span>
                  <span className="font-semibold text-slate-700">₹{taxAmount}</span>
                </div>
                <div className="flex items-center justify-between font-bold text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                    Full Payment (Paying Now)
                  </span>
                  <span className="text-base font-black">₹{grandTotal.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPayMethod("UPI")}
                    className={`flex flex-col items-center justify-center rounded-2xl border p-3 transition ${
                      selectedPayMethod === "UPI"
                        ? "border-emerald-600 bg-emerald-50/50 text-emerald-900 ring-2 ring-emerald-500 font-bold"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <span className="text-lg">⚡</span>
                    <span className="text-[11px] mt-1">UPI / QR</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPayMethod("Card")}
                    className={`flex flex-col items-center justify-center rounded-2xl border p-3 transition ${
                      selectedPayMethod === "Card"
                        ? "border-emerald-600 bg-emerald-50/50 text-emerald-900 ring-2 ring-emerald-500 font-bold"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <span className="text-lg">💳</span>
                    <span className="text-[11px] mt-1">Cards</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPayMethod("NetBanking")}
                    className={`flex flex-col items-center justify-center rounded-2xl border p-3 transition ${
                      selectedPayMethod === "NetBanking"
                        ? "border-emerald-600 bg-emerald-50/50 text-emerald-900 ring-2 ring-emerald-500 font-bold"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <span className="text-lg">🏦</span>
                    <span className="text-[11px] mt-1">NetBanking</span>
                  </button>
                </div>
              </div>

              {/* Method specific option content */}
              {selectedPayMethod === "UPI" && (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 text-center text-xs">
                  <p className="font-semibold text-slate-700 mb-2">Scan &amp; Pay via any UPI App</p>
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <span className="rounded-lg bg-white px-2.5 py-1 font-bold text-slate-700 shadow-xs border border-slate-200">GPay</span>
                    <span className="rounded-lg bg-white px-2.5 py-1 font-bold text-purple-700 shadow-xs border border-slate-200">PhonePe</span>
                    <span className="rounded-lg bg-white px-2.5 py-1 font-bold text-sky-600 shadow-xs border border-slate-200">Paytm</span>
                    <span className="rounded-lg bg-white px-2.5 py-1 font-bold text-orange-600 shadow-xs border border-slate-200">BHIM</span>
                  </div>
                </div>
              )}

              {error && <p className="rounded-xl bg-rose-50 p-2.5 text-center text-xs font-semibold text-rose-600">{error}</p>}

              {/* Complete Payment Button */}
              <button
                type="button"
                disabled={placing}
                onClick={handleConfirmPayment}
                className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 py-4 text-sm font-extrabold uppercase tracking-wide text-white shadow-lg shadow-emerald-600/30 transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {placing ? "Processing Payment..." : `PAY ₹${grandTotal.toLocaleString("en-IN")} TO CONFIRM ORDER`}
              </button>

              <p className="text-center text-[10px] text-slate-400">🔒 128-bit SSL Encrypted • 100% Secure Transaction</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. FOOD ORDER CONFIRMED SCREEN                                            */}
      {/* ========================================================================= */}
      {checkoutStep === "confirmed" && placedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Confirmed Icon */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Check className="h-8 w-8" strokeWidth={3} />
            </div>

            <h2 className="mt-3 text-xl font-extrabold text-slate-900">Food Order Confirmed!</h2>
            <p className="mt-1 text-xs text-slate-500">Your order has been placed with {outlet?.name || "the restaurant"}.</p>

            {/* Order Details Card */}
            <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left text-xs space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Order ID</span>
                <span className="font-mono font-bold text-slate-900">{placedOrder.orderId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Restaurant</span>
                <span className="font-bold text-slate-900 truncate max-w-[180px]">{outlet?.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Order Date &amp; Time</span>
                <span className="font-semibold text-slate-800">{new Date(placedOrder.createdAt).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Estimated Prep Time</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> ~20–25 mins
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200 pt-2">
                <span className="font-bold text-slate-900">Payment Status</span>
                <span className="font-extrabold text-emerald-600">Paid via {selectedPayMethod} (₹{placedOrder.totalAmount})</span>
              </div>

              {/* Items Summary */}
              <div className="border-t border-slate-200 pt-2">
                <p className="font-bold text-slate-700 mb-1">Items ({placedOrder.items.length})</p>
                <div className="space-y-1">
                  {placedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-[11px] text-slate-600">
                      <span>• {item.name}{item.variantLabel ? ` (${item.variantLabel})` : ""} x{item.quantity}</span>
                      <span className="font-semibold text-slate-800">₹{(item.price * item.quantity).toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Verification QR Code Section */}
            {orderQrUrl && (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white p-3.5 text-center">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">Order Pickup Verification QR</p>
                <div className="flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={orderQrUrl} alt="Order QR" className="h-36 w-36 rounded-xl border border-slate-100 p-1" />
                </div>
                <p className="mt-2 text-[11px] font-semibold text-slate-500">Scan at restaurant counter to collect order</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-5 flex flex-col gap-2">
              <button
                onClick={handleDownloadBill}
                className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3.5 text-xs font-extrabold uppercase tracking-wide text-white shadow-md transition hover:scale-[1.01]"
              >
                <Download className="h-4 w-4" /> Download Bill (PDF/Invoice)
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={shareFoodOrder}
                  className="flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  <Share2 className="h-3.5 w-3.5" /> Share Order
                </button>
                <button
                  onClick={() => {
                    setPlacedOrder(null);
                    setCheckoutStep("menu");
                  }}
                  className="rounded-2xl bg-slate-900 px-4 py-3 text-xs font-bold text-white hover:bg-slate-800 transition"
                >
                  Done
                </button>
              </div>
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
