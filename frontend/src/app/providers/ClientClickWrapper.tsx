'use client'
import { ClickProvider, ClickUI, CsprClickThemes } from '@make-software/csprclick-ui'
import { ReactNode, useEffect, useState } from 'react'
import { ThemeProvider } from 'styled-components'

export default function ClientClickWrapper({ children }: { children: ReactNode }) {
  // Use the full dark theme object synchronously to prevent undefined properties crash
  const theme = CsprClickThemes?.dark || { mode: 'dark' }

  return (
    <ThemeProvider theme={theme}>
      <ClickProvider
        options={{
          appName: process.env.NEXT_PUBLIC_CSPR_CLICK_APP_NAME || 'Sentinel AI',
          appId: process.env.NEXT_PUBLIC_CSPR_CLICK_APP_ID || 'csprclick-template',
          providers: ['casper-wallet', 'ledger', 'metamask-snap'],
        }}
      >
        <ClickUI />
        {children}
      </ClickProvider>
    </ThemeProvider>
  )
}
