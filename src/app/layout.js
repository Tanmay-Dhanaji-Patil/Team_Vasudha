import Navbar from "@/components/utils/Navbar";
import "./globals.css";

export const metadata = {
  title: "Soil Monitoring System",
  description:
    "Monitor soil and give recommendation for crop, fertilizers and more...",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
