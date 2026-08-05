import QRCode from "qrcode";
import type { Booking, FoodOrder } from "./api/types";

/** The exact payload encoded on a booking's QR — used by both the downloadable ticket
 * and the in-app confirmation screen, so either one scans to the same check-in (see
 * parseTicketQr in components/vendor/bookings/QrScannerModal.tsx, which reads this shape). */
export function bookingQrPayload(booking: Pick<Booking, "orderId" | "listingId">): string {
  return JSON.stringify({ orderId: booking.orderId, listingId: booking.listingId });
}

/** Renders a booking's QR as a data URL image, for inline display (not just the PNG ticket). */
export function bookingQrDataUrl(booking: Pick<Booking, "orderId" | "listingId">, size = 168): Promise<string> {
  return QRCode.toDataURL(bookingQrPayload(booking), {
    margin: 0,
    width: size,
    color: { dark: "#0f172a", light: "#ffffffff" },
  });
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
  };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Draws a printable event ticket for a booking and triggers a PNG download. */
export async function downloadBookingTicket(booking: Booking) {
  const width = 900;
  const height = 340;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const stubWidth = 260;
  const stubX = width - stubWidth;

  // card background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // main panel gradient
  const mainGradient = ctx.createLinearGradient(0, 0, stubX, 0);
  mainGradient.addColorStop(0, "#1e1330");
  mainGradient.addColorStop(1, "#3a2a1a");
  ctx.fillStyle = mainGradient;
  ctx.fillRect(0, 0, stubX, height);

  // stub panel
  ctx.fillStyle = "#faf7f0";
  ctx.fillRect(stubX, 0, stubWidth, height);

  // perforation line
  ctx.setLineDash([6, 6]);
  ctx.strokeStyle = "#d4d4d8";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(stubX, 0);
  ctx.lineTo(stubX, height);
  ctx.stroke();
  ctx.setLineDash([]);

  // perforation notches
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(stubX, 0, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(stubX, height, 14, 0, Math.PI * 2);
  ctx.fill();

  // brand mark
  ctx.fillStyle = "#f5a623";
  ctx.font = "bold 16px sans-serif";
  ctx.fillText("BOOK YOUR VIBE", 40, 44);

  // title
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 32px sans-serif";
  ctx.fillText(booking.listingTitle ?? "Venue Booking", 40, 100);

  const { date, time } = formatDateTime(booking.dateTime);

  ctx.font = "15px sans-serif";
  ctx.fillStyle = "#cbd5e1";
  ctx.fillText("DATE", 40, 150);
  ctx.fillText("TIME", 240, 150);
  ctx.fillText("GUEST", 440, 150);

  ctx.font = "bold 20px sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(date, 40, 178);
  ctx.fillText(time, 240, 178);
  ctx.fillText(booking.customerName, 440, 178);

  ctx.font = "15px sans-serif";
  ctx.fillStyle = "#cbd5e1";
  ctx.fillText("AMOUNT PAID", 40, 230);
  ctx.fillText("STATUS", 440, 230);

  ctx.font = "bold 22px sans-serif";
  ctx.fillStyle = "#facc15";
  ctx.fillText(`Rs ${booking.totalAmount}`, 40, 260);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(booking.status, 440, 260);

  ctx.font = "13px sans-serif";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText("Present this ticket at the venue entrance", 40, height - 24);

  // stub content
  ctx.fillStyle = "#0f172a";
  ctx.font = "13px sans-serif";
  ctx.fillText("ORDER ID", stubX + 30, 40);
  ctx.font = "bold 18px monospace";
  ctx.fillText(booking.orderId, stubX + 30, 64);

  // Real, scannable QR encoding the order id — venues scan this to check the booking in.
  // Same payload as the confirmation screen's inline QR (see bookingQrPayload above), so
  // either one works interchangeably at the door.
  const qrDataUrl = await QRCode.toDataURL(bookingQrPayload(booking), {
    margin: 0,
    width: 168,
    color: { dark: "#0f172a", light: "#00000000" },
  });
  const qrImg = await loadImage(qrDataUrl);
  const qrSize = 168;
  const qrX = stubX + (stubWidth - qrSize) / 2;
  const qrY = 86;
  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  ctx.font = "12px sans-serif";
  ctx.fillStyle = "#64748b";
  ctx.textAlign = "center";
  ctx.fillText("Scan at venue entrance", stubX + stubWidth / 2, qrY + qrSize + 20);
  ctx.textAlign = "left";

  const link = document.createElement("a");
  link.download = `byv-ticket-${booking.orderId}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

/** Draws a printable order ticket for a food order and triggers a PNG download. */
export async function downloadFoodOrderTicket(
  order: FoodOrder & { outletName?: string; paymentMethod?: string; subtotal?: number; taxAmount?: number }
) {
  const width = 900;
  const height = 480;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const stubWidth = 260;
  const stubX = width - stubWidth;

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Main panel gradient
  const mainGradient = ctx.createLinearGradient(0, 0, stubX, 0);
  mainGradient.addColorStop(0, "#0f172a");
  mainGradient.addColorStop(1, "#1e293b");
  ctx.fillStyle = mainGradient;
  ctx.fillRect(0, 0, stubX, height);

  // Stub panel
  ctx.fillStyle = "#faf7f0";
  ctx.fillRect(stubX, 0, stubWidth, height);

  // Perforation line
  ctx.setLineDash([6, 6]);
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(stubX, 0);
  ctx.lineTo(stubX, height);
  ctx.stroke();
  ctx.setLineDash([]);

  // Perforation notches
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(stubX, 0, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(stubX, height, 14, 0, Math.PI * 2);
  ctx.fill();

  // Brand Header
  ctx.fillStyle = "#10b981";
  ctx.font = "bold 16px sans-serif";
  ctx.fillText("BOOK YOUR VIBE — TAX INVOICE & RECEIPT", 40, 44);

  // Outlet / Restaurant Name
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 26px sans-serif";
  const restaurantName = order.outletName || "BYV Partner Restaurant";
  ctx.fillText(restaurantName.length > 36 ? `${restaurantName.slice(0, 36)}…` : restaurantName, 40, 84);

  // Order Items
  const { date, time } = formatDateTime(order.createdAt);
  ctx.font = "13px sans-serif";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText("ORDERED ITEMS", 40, 125);

  let currentY = 150;
  ctx.font = "bold 15px sans-serif";
  ctx.fillStyle = "#f8fafc";

  const displayItems = order.items.slice(0, 4);
  displayItems.forEach((item) => {
    const itemText = `• ${item.name}${item.variantLabel ? ` (${item.variantLabel})` : ""} x${item.quantity}`;
    const priceText = `₹${(item.price * item.quantity).toLocaleString("en-IN")}`;
    ctx.fillText(itemText.length > 35 ? `${itemText.slice(0, 35)}…` : itemText, 40, currentY);
    ctx.fillText(priceText, 440, currentY);
    currentY += 24;
  });

  if (order.items.length > 4) {
    ctx.font = "italic 13px sans-serif";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText(`+ ${order.items.length - 4} more item(s)...`, 40, currentY);
    currentY += 22;
  }

  // Divider
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, currentY + 10);
  ctx.lineTo(stubX - 40, currentY + 10);
  ctx.stroke();

  // Financial Breakdown & Metadata
  const metaY = currentY + 38;
  ctx.font = "12px sans-serif";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText("DATE & TIME", 40, metaY);
  ctx.fillText("CUSTOMER", 220, metaY);
  ctx.fillText("PAYMENT METHOD", 400, metaY);

  ctx.font = "bold 14px sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(`${date} ${time}`, 40, metaY + 22);
  ctx.fillText(order.customerName || "Customer", 220, metaY + 22);
  ctx.fillText(order.paymentMethod || "Online (UPI/Gateway)", 400, metaY + 22);

  // Total Paid Banner
  const totalY = metaY + 68;
  ctx.fillStyle = "#10b981";
  ctx.font = "bold 14px sans-serif";
  ctx.fillText("TOTAL AMOUNT PAID:", 40, totalY);

  ctx.fillStyle = "#facc15";
  ctx.font = "bold 26px sans-serif";
  ctx.fillText(`₹${order.totalAmount.toLocaleString("en-IN")}`, 220, totalY + 2);

  ctx.fillStyle = "#34d399";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText("✓ PAYMENT VERIFIED & CONFIRMED", 400, totalY);

  ctx.font = "12px sans-serif";
  ctx.fillStyle = "#64748b";
  ctx.fillText("Present this receipt or scan QR code at counter for order pickup", 40, height - 20);

  // Stub Side (Order ID & Verification QR)
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 12px sans-serif";
  ctx.fillText("ORDER REFERENCE", stubX + 30, 44);
  ctx.font = "bold 18px monospace";
  ctx.fillText(order.orderId, stubX + 30, 70);

  const qrPayload = JSON.stringify({ orderId: order.orderId, vendorId: order.vendorId });
  const qrDataUrl = await QRCode.toDataURL(qrPayload, {
    margin: 0,
    width: 170,
    color: { dark: "#0f172a", light: "#00000000" },
  });
  const qrImg = await loadImage(qrDataUrl);
  const qrSize = 170;
  const qrX = stubX + (stubWidth - qrSize) / 2;
  const qrY = 96;
  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  ctx.font = "bold 12px sans-serif";
  ctx.fillStyle = "#0f172a";
  ctx.textAlign = "center";
  ctx.fillText("ESTIMATED PREP: ~20 mins", stubX + stubWidth / 2, qrY + qrSize + 28);

  ctx.font = "11px sans-serif";
  ctx.fillStyle = "#64748b";
  ctx.fillText("Scan to verify order", stubX + stubWidth / 2, qrY + qrSize + 48);
  ctx.textAlign = "left";

  const link = document.createElement("a");
  link.download = `byv-food-invoice-${order.orderId}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
