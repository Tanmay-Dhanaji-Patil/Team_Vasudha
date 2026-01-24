'use client';

import { useState } from 'react';
import Header from "@/components/krishi/Header";
import Hero from "@/components/krishi/Hero";
import StoreList from "@/components/krishi/StoreList";
import ProductPanel from "@/components/krishi/ProductPanel";
import Footer from "@/components/krishi/Footer";
import { stores } from "@/data/stores";

export default function KrishiFertilizerHub() {
  const [filterType, setFilterType] = useState('All');

  const filteredStores = stores.filter(store => {
    if (filterType === 'All') return true;
    if (filterType === 'Organic') return store.stocks.includes('Organic');
    if (filterType === 'Inorganic') return store.stocks.includes('Inorganic');
    return true;
  });

  return (
    <div className="min-h-screen bg-[#e8f5e9] font-sans text-gray-800">
      {/* Light green background #e8f5e9 */}

      <Header />

      <main className="container mx-auto px-4 py-6 space-y-8">
        <Hero
          stores={filteredStores}
          onFilterChange={(type) => setFilterType(type)}
          currentFilter={filterType}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5">
            <StoreList stores={filteredStores} />
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
