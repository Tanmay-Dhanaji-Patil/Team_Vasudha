import Navbar from "@/components/utils/Navbar";
import Script from "next/script";
import "./globals.css";

export const metadata = {
  title: "Soil Monitoring System",
  description:
    "Monitor soil and give recommendation for crop, fertilizers and more...",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <Script
          id="suppress-hydration"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              // Suppress hydration warnings for browser extensions
              if (typeof window !== 'undefined') {
                const originalError = console.error;
                console.error = function(...args) {
                  if (args[0] && args[0].includes && args[0].includes('hydrated but some attributes')) {
                    return;
                  }
                  originalError.apply(console, args);
                };
              }
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning={true}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
