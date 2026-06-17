import type { Metadata } from "next";
import { Manrope, Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const display = Manrope({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap"
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap"
});

export const metadata: Metadata = {
  title: {
    default: "SN2 Studios",
    template: "%s | SN2 Studios"
  },
  description: "Web push campaigns for e-commerce stores",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/sn2-ios-icon-180.png", sizes: "180x180", type: "image/png" },
      { url: "/sn2-ios-icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/sn2-ios-icon-180.png", sizes: "180x180", type: "image/png" }]
  },
  appleWebApp: {
    capable: true,
    title: "SN2 Studios",
    statusBarStyle: "black-translucent"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <body>
        <Script id="notifypilot-theme-init" strategy="beforeInteractive">
          {`try{var t=localStorage.getItem('notifypilot-theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t}catch(e){document.documentElement.dataset.theme='light';document.documentElement.style.colorScheme='light'}`}
        </Script>
        {children}
      </body>
    </html>
  );
}
