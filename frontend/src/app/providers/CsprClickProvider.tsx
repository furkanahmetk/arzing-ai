'use client';

import { ReactNode, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { ThemeProvider } from 'styled-components';

const ClickProvider: any = dynamic(
  () => import('@make-software/csprclick-ui').then((mod) => mod.ClickProvider as any),
  { ssr: false }
);

const ClickUI: any = dynamic(
  () => import('@make-software/csprclick-ui').then((mod) => mod.ClickUI as any),
  { ssr: false }
);

export default function CsprClickProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<any>({ mode: 'dark' });

  useEffect(() => {
    import('@make-software/csprclick-ui').then((mod) => {
      if (mod.CsprClickThemes?.dark) {
        setTheme(mod.CsprClickThemes.dark);
      }
    });
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <ClickProvider
        options={{
          appName: process.env.NEXT_PUBLIC_CSPR_CLICK_APP_NAME || 'Sentinel AI',
          appId: process.env.NEXT_PUBLIC_CSPR_CLICK_APP_ID || 'csprclick-template',
          contentMode: 'iframe',
          providers: ['casper-wallet', 'ledger', 'casperdash', 'metamask-snap'],
        }}
      >
        <ClickUI />
        {children}
      </ClickProvider>
    </ThemeProvider>
  );
}
