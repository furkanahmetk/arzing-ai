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
    const syncAccount = () => {
      if (!(window as any).csprclick) return
      const account = (window as any).csprclick.getActiveAccount()
      if (account?.public_key) {
        setActiveAccount({
          address: account.public_key,
          provider: account.provider || 'connected wallet'
        })
      } else {
        setActiveAccount(null)
      }
    }

    setTimeout(syncAccount, 500)
    setTimeout(syncAccount, 1500)

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
  }, [])

  const connectWallet = () => {
    if ((window as any).csprclick) {
      (window as any).csprclick.signIn()
    } else {
      alert('Casper Wallet SDK is loading, please try again in a moment.')
    }
  }

  const disconnectWallet = () => {
    if ((window as any).csprclick) {
      (window as any).csprclick.signOut()
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
            <span className={styles.logoName}>CasperGuard</span>
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
