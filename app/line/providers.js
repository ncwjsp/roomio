"use client";

import { useState, useEffect, createContext, useContext } from "react";
import liff from "@line/liff";

// Create a context for LIFF
const LIFFContext = createContext({
  liffObject: null,
  liffError: null,
});

// LIFF Provider Component
export function LIFFProvider({ children }) {
  const [liffObject, setLiffObject] = useState(null);
  const [liffError, setLiffError] = useState(null);

  useEffect(() => {
    console.log("start liff.init()...");
    liff
      .init({ liffId: process.env.LIFF_ID })
      .then(() => {
        console.log("liff.init() done");
        setLiffObject(liff);
      })
      .catch((error) => {
        console.log(`liff.init() failed: ${error}`);
        if (!process.env.NEXT_PUBLIC_LIFF_ID) {
          console.info(
            "LIFF Starter: Please make sure that you provided `NEXT_PUBLIC_LIFF_ID` as an environmental variable."
          );
        }
        setLiffError(error.toString());
      });
  }, []);

  return (
    <LIFFContext.Provider value={{ liffObject, liffError }}>
      {children}
    </LIFFContext.Provider>
  );
}

// Custom hook to use LIFF context
export function useLIFF() {
  return useContext(LIFFContext);
}
