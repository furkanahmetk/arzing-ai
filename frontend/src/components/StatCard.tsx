'use client'
import styles from './StatCard.module.css'

interface Props {
  icon: string
  label: string
  value: string | number
  sub?: string
  color?: 'cyan' | 'green' | 'yellow' | 'red'
  loading?: boolean
}

export default function StatCard({ icon, label, value, sub, color = 'cyan', loading }: Props) {
  return (
    <div className={`card ${styles.card} ${styles[color]}`}>
      <div className={styles.icon}>{icon}</div>
      <div className={styles.value}>{loading ? <span className={styles.skeleton} /> : value}</div>
      <div className={styles.label}>{label}</div>
      {sub && <div className={styles.sub}>{sub}</div>}
    </div>
  )
}
