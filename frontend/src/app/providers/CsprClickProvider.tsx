'use client';

import { ReactNode, useEffect, useState } from 'react';
import { ThemeProvider } from 'styled-components';

export default function CsprClickProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<any>({ mode: 'dark' });
  const [ClickComponents, setClickComponents] = useState<any>(null);

  useEffect(() => {
    import('@make-software/csprclick-ui').then((mod) => {
      if (mod.CsprClickThemes?.dark) {
        setTheme(mod.CsprClickThemes.dark);
      }
      setClickComponents({
        ClickProvider: mod.ClickProvider,
        ClickUI: mod.ClickUI
      });
    });
  }, []);

  if (!ClickComponents) {
    return <>{children}</>;
  }

  const { ClickProvider, ClickUI } = ClickComponents;

  return (
    <ThemeProvider theme={theme}>
      <ClickProvider
        options={{
          appName: process.env.NEXT_PUBLIC_CSPR_CLICK_APP_NAME || 'Sentinel AI',
          appId: process.env.NEXT_PUBLIC_CSPR_CLICK_APP_ID || 'csprclick-template',
          contentMode: 'iframe',
          providers: ['casper-wallet', 'ledger', 'metamask-snap'],
        }}
      >
        <ClickUI />
        {children}
      </ClickProvider>
    </ThemeProvider>
  );
}
