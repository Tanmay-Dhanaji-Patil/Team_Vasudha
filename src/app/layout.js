import Navbar from "@/components/utils/Navbar";
import "./global.css";
import ClientBodyLogger from "@/components/utils/ClientBodyLogger";

export const metadata = {
  title: "Soil Monitoring System",
  description:
    "Monitor soil and give recommendation for crop, fertilizers and more...",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ClientBodyLogger />
        <Navbar />
        {children}
      </body>
    </html>
  );
}