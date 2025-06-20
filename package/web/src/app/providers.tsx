'use client';

import { HeroUIProvider } from '@heroui/react';
import { SWRConfig } from 'swr';
import { ConfigProvider } from '@/contexts/ConfigContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider>
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
    </ConfigProvider>
  );
}
