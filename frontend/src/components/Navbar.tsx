'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import styles from './Navbar.module.css'

const NAV_LINKS = [
  { href: '/', label: 'Dashboard', icon: '◈' },
  { href: '/audit', label: 'Audit', icon: '🔍' },
  { href: '/network', label: 'Network', icon: '🌐' },
  { href: '/validators', label: 'Validators', icon: '⚡' },
]

export default function Navbar() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
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
            setActiveAccount({ address, provider: 'Casper Wallet' })
            return
          }
        }
        setActiveAccount(null)
      } catch (e) {
        setActiveAccount(null)
      }
    }

    setTimeout(syncAccount, 500)
    setTimeout(syncAccount, 1500)

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
      const provider = CasperWalletProvider()
      try {
        await provider.requestConnection()
      } catch (e) {
        console.error(e)
      }
    } else {
      alert('Casper Wallet extension is not installed. Please install it to continue.')
    }
  }

  const disconnectWallet = () => {
    const CasperWalletProvider = (window as any).CasperWalletProvider
    if (CasperWalletProvider) {
      const provider = CasperWalletProvider()
      provider.disconnectFromSite()
    }
    setActiveAccount(null)
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>🛡️</span>
          <div>
            <span className={styles.logoName}>Arzing</span>
            <span className={styles.logoAi}> AI</span>
            <div className={styles.logoBadge}>BETA · TESTNET</div>
          </div>
        </Link>

        {/* Links */}
        <div className={`${styles.links} ${menuOpen ? styles.open : ''}`}>
          {NAV_LINKS.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className={`${styles.link} ${pathname === href ? styles.active : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <span>{icon}</span> {label}
            </Link>
          ))}
        </div>

        {/* Status pill + hamburger */}
        <div className={styles.right}>
          <div className={styles.statusPill}>
            <span className={styles.statusDot} />
            <span>Testnet</span>
          </div>

          {activeAccount ? (
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
          ) : (
            <button className={styles.connectBtn} onClick={connectWallet}>
              Connect Wallet
            </button>
          )}
          <button
            className={styles.hamburger}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>
    </nav>
  )
}
