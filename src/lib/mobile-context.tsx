"use client";

import { createContext, useContext, ReactNode } from "react";

type MobileContextValue = {
  isMobile: boolean;
};

const MobileContext = createContext<MobileContextValue>({ isMobile: false });

export function MobileProvider({
  isMobile,
  children,
}: {
  isMobile: boolean;
  children: ReactNode;
}) {
  return (
    <MobileContext.Provider value={{ isMobile }}>
      {children}
    </MobileContext.Provider>
  );
}

export function useMobile() {
  return useContext(MobileContext);
}
