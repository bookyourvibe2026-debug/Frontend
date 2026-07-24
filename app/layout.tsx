import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { CustomerAuthProvider } from "@/components/providers/CustomerAuthProvider";
import { GoogleAuthProvider } from "@/components/providers/GoogleAuthProvider";
import { BottomNav } from "@/components/mobile/BottomNav";
import Script from "next/script";
import "./globals.css";

const THEME_INIT_SCRIPT = `
try {
  var t = localStorage.getItem("byv-theme");
  if (t) document.documentElement.setAttribute("data-theme", t);
} catch (e) {}
`;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.bookyourvibe.in";
const SITE_NAME = "Book Your Vibe";
const SITE_DESCRIPTION =
  "Book Your Vibe - Play. Book. Vibe. Book sports venues, join tournaments and challenges, connect with the community, and order food, all in one platform.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Book Sports Venues, Tournaments & More`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "Book Your Vibe",
    "sports venue booking",
    "sports tournaments",
    "sports challenges",
    "venue booking app",
    "sports community",
    "food ordering",
    "play book vibe",
  ],
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} | Book Sports Venues, Tournaments & More`,
    description: SITE_DESCRIPTION,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | Book Sports Venues, Tournaments & More`,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <Script id="theme-init" dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body
        className="min-h-full flex flex-col font-sans"
        suppressHydrationWarning
      >
        <ThemeProvider>
          <GoogleAuthProvider>
            <CustomerAuthProvider>
              {children}
              <BottomNav />
            </CustomerAuthProvider>
          </GoogleAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
