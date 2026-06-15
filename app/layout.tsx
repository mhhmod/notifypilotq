import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "NotifyPilot",
    template: "%s | NotifyPilot"
  },
  description: "Web push campaigns for e-commerce stores"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Script id="notifypilot-theme-init" strategy="beforeInteractive">
          {`try{var t=localStorage.getItem('notifypilot-theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t}catch(e){document.documentElement.dataset.theme='light';document.documentElement.style.colorScheme='light'}`}
        </Script>
        {children}
      </body>
    </html>
  );
}
