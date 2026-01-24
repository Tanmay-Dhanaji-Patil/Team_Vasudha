import Header from "@/components/krishi/Header";
import Hero from "@/components/krishi/Hero";
import StoreList from "@/components/krishi/StoreList";
import ProductPanel from "@/components/krishi/ProductPanel";
import Footer from "@/components/krishi/Footer";

export const metadata = {
  title: "Krishi Fertilizer Hub | Find Stores Near You",
  description: "Locate nearby fertilizer stores, check organic/inorganic stock, and order easily.",
};

export default function KrishiFertilizerHub() {
  return (
    <div className="min-h-screen bg-[#e8f5e9] font-sans text-gray-800">
      {/* Light green background #e8f5e9 */}
      
      <Header />
      
      <main className="container mx-auto px-4 py-6 space-y-8">
        <Hero />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5">
            <StoreList />
          </div>
          <div className="lg:col-span-7">
            <ProductPanel />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
