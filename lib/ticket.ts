import QRCode from "qrcode";
import type { Booking, FoodOrder } from "./api/types";

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

  // real, scannable QR code encoding the order id — venues can scan this to check in the booking
  const qrPayload = JSON.stringify({ orderId: booking.orderId, listingId: booking.listingId });
  const qrDataUrl = await QRCode.toDataURL(qrPayload, {
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
export async function downloadFoodOrderTicket(order: FoodOrder) {
  const width = 900;
  const height = 340;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const stubWidth = 260;
  const stubX = width - stubWidth;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  const mainGradient = ctx.createLinearGradient(0, 0, stubX, 0);
  mainGradient.addColorStop(0, "#1a2e1e");
  mainGradient.addColorStop(1, "#3a2a1a");
  ctx.fillStyle = mainGradient;
  ctx.fillRect(0, 0, stubX, height);

  ctx.fillStyle = "#faf7f0";
  ctx.fillRect(stubX, 0, stubWidth, height);

  ctx.setLineDash([6, 6]);
  ctx.strokeStyle = "#d4d4d8";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(stubX, 0);
  ctx.lineTo(stubX, height);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(stubX, 0, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(stubX, height, 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#a6ff3c";
  ctx.font = "bold 16px sans-serif";
  ctx.fillText("BOOK YOUR VIBE — FOOD ORDER", 40, 44);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 28px sans-serif";
  const itemsSummary = order.items.map((i) => `${i.name} x${i.quantity}`).join(", ");
  ctx.fillText(itemsSummary.length > 46 ? `${itemsSummary.slice(0, 46)}…` : itemsSummary, 40, 100);

  const { date, time } = formatDateTime(order.createdAt);

  ctx.font = "15px sans-serif";
  ctx.fillStyle = "#cbd5e1";
  ctx.fillText("DATE", 40, 150);
  ctx.fillText("TIME", 240, 150);
  ctx.fillText("GUEST", 440, 150);

  ctx.font = "bold 20px sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(date, 40, 178);
  ctx.fillText(time, 240, 178);
  ctx.fillText(order.customerName, 440, 178);

  ctx.font = "15px sans-serif";
  ctx.fillStyle = "#cbd5e1";
  ctx.fillText("AMOUNT", 40, 230);
  ctx.fillText("STATUS", 440, 230);

  ctx.font = "bold 22px sans-serif";
  ctx.fillStyle = "#facc15";
  ctx.fillText(`Rs ${order.totalAmount}`, 40, 260);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(order.status, 440, 260);

  ctx.font = "13px sans-serif";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText("Show this ticket at the counter to collect your order", 40, height - 24);

  ctx.fillStyle = "#0f172a";
  ctx.font = "13px sans-serif";
  ctx.fillText("ORDER ID", stubX + 30, 40);
  ctx.font = "bold 18px monospace";
  ctx.fillText(order.orderId, stubX + 30, 64);

  const qrPayload = JSON.stringify({ orderId: order.orderId, vendorId: order.vendorId });
  const qrDataUrl = await QRCode.toDataURL(qrPayload, {
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
  ctx.fillText("Show at the food counter", stubX + stubWidth / 2, qrY + qrSize + 20);
  ctx.textAlign = "left";

  const link = document.createElement("a");
  link.download = `byv-food-order-${order.orderId}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
