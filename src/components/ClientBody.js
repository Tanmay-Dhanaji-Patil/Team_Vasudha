"use client";

import { useEffect, useState } from 'react';

export default function ClientBody({ children }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // During SSR, render without any dynamic attributes
  if (!isClient) {
    return <div suppressHydrationWarning={true}>{children}</div>;
  }

  // On client side, render normally
  return <>{children}</>;
}
