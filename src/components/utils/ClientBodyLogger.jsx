"use client";

import { useEffect } from "react";

export default function ClientBodyLogger() {
  useEffect(() => {
    try {
      const attrs = Array.from(document.body.attributes).map((a) => ({ name: a.name, value: a.value }));
      console.log("[ClientBodyLogger] document.body attributes:", attrs);

      // Also log html attrs
      const htmlAttrs = Array.from(document.documentElement.attributes).map((a) => ({ name: a.name, value: a.value }));
      console.log("[ClientBodyLogger] document.documentElement attributes:", htmlAttrs);
    } catch (err) {
      console.error("[ClientBodyLogger] error reading body attributes:", err);
    }
  }, []);

  return null;
}
