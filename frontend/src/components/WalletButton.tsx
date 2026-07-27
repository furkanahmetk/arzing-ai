'use client'
import { useState, useEffect } from 'react'
import styles from './Navbar.module.css'

export default function WalletButton() {
  const [activeAccount, setActiveAccount] = useState<{ address: string, provider: string } | null>(null)

  useEffect(() => {
    const syncAccount = async () => {
      const CasperWalletProvider = (window as any).CasperWalletProvider
      if (!CasperWalletProvider) return
      
      const provider = CasperWalletProvider()
      try {
        const isConnected = await provider.isConnected()
        if (isConnected) {
          const address = await provider.getActivePublicKey()
          if (address) {
            setActiveAccount({
              address: address,
              provider: 'Casper Wallet'
            })
            return
          }
        }
        setActiveAccount(null)
      } catch (e) {
        setActiveAccount(null)
      }
    }

    setTimeout(syncAccount, 500)
    window.addEventListener('casper-wallet:activeKeyChanged', syncAccount)
    window.addEventListener('casper-wallet:disconnected', syncAccount)
    window.addEventListener('casper-wallet:connected', syncAccount)

    return () => {
      window.removeEventListener('casper-wallet:activeKeyChanged', syncAccount)
      window.removeEventListener('casper-wallet:disconnected', syncAccount)
      window.removeEventListener('casper-wallet:connected', syncAccount)
    }
  }, [])

  const connectWallet = async () => {
    const CasperWalletProvider = (window as any).CasperWalletProvider
    if (CasperWalletProvider) {
      try {
        const provider = CasperWalletProvider()
        await provider.requestConnection()
      } catch (e) {
        console.error('Wallet connection failed', e)
      }
    } else {
      alert('Casper Wallet extension is not installed. Please install it to continue.')
    }
  }

  const disconnectWallet = async () => {
    const CasperWalletProvider = (window as any).CasperWalletProvider
    if (CasperWalletProvider) {
      try {
        const provider = CasperWalletProvider()
        await provider.disconnectFromSite()
      } catch (e) {
        console.error('Wallet disconnect failed', e)
      }
    }
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
