'use client'
import { useState, useEffect } from 'react'
import { useClickRef } from '@make-software/csprclick-ui'
import styles from './Navbar.module.css'

export default function WalletButton() {
  const clickRef = useClickRef()
  const [activeAccount, setActiveAccount] = useState<{ address: string, provider: string } | null>(null)

  useEffect(() => {
    const syncAccount = async () => {
      if (!clickRef) return
      try {
        const account = await clickRef.getActiveAccount()
        if (account?.public_key) {
          setActiveAccount({
            address: account.public_key,
            provider: account.provider || 'connected wallet'
          })
        } else {
          setActiveAccount(null)
        }
      } catch (e) {
        setActiveAccount(null)
      }
    }

    setTimeout(syncAccount, 500)
    window.addEventListener('csprclick:signed_in', syncAccount)
    window.addEventListener('csprclick:switched_account', syncAccount)
    window.addEventListener('csprclick:signed_out', syncAccount)
    window.addEventListener('csprclick:disconnected', syncAccount)
    window.addEventListener('csprclick:loaded', syncAccount)

    return () => {
      window.removeEventListener('csprclick:signed_in', syncAccount)
      window.removeEventListener('csprclick:switched_account', syncAccount)
      window.removeEventListener('csprclick:signed_out', syncAccount)
      window.removeEventListener('csprclick:disconnected', syncAccount)
      window.removeEventListener('csprclick:loaded', syncAccount)
    }
  }, [clickRef])

  const connectWallet = async () => {
    if (clickRef) {
      clickRef.signIn()
    } else {
      const casperlabs = (window as any).casperlabs
      if (casperlabs) {
        try {
          await casperlabs.requestConnection()
        } catch (e) {
          console.error('Wallet connection failed', e)
        }
      } else {
        // Fallback if neither works: Try clicking the floating UI if it exists
        const btn = document.querySelector('.csprclick-button') as HTMLElement
        if (btn) btn.click()
        else alert('Casper Wallet SDK is loading, please try again in a moment.')
      }
    }
  }

  const disconnectWallet = () => {
    if (clickRef) clickRef.signOut()
    setActiveAccount(null)
  }

  if (activeAccount) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div 
          className={styles.walletAddress} 
          title="Click to copy address"
          onClick={() => navigator.clipboard.writeText(activeAccount.address)}
        >
          {activeAccount.address.slice(0, 5)}...{activeAccount.address.slice(-4)}
        </div>
        <button className={styles.connectBtn} onClick={disconnectWallet} style={{ background: 'transparent', border: '1px solid var(--accent-red)', color: 'var(--accent-red)' }}>
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <button className={styles.connectBtn} onClick={connectWallet}>
      Connect Wallet
    </button>
  )
}
