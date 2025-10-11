import Navbar from "@/components/utils/Navbar";
import ClientBody from "@/components/ClientBody";
import "./globals.css";

export const metadata = {
  title: "Soil Monitoring System",
  description:
    "Monitor soil and give recommendation for crop, fertilizers and more...",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        <ClientBody>
          <Navbar />
          {children}
        </ClientBody>
      </body>
    </html>
  );
}
