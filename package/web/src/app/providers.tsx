'use client';

import { HeroUIProvider } from '@heroui/react';
import { SWRConfig } from 'swr';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HeroUIProvider>
      <SWRConfig
        value={{
          errorRetryCount: 3,
          errorRetryInterval: 1000,
          dedupingInterval: 2000,
          focusThrottleInterval: 5000,
        }}
      >
        {children}
      </SWRConfig>
    </HeroUIProvider>
  );
}