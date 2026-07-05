'use client'
import styles from './RiskGauge.module.css'

interface Props { score: number; loading?: boolean; size?: 'sm' | 'md' | 'lg' }

function getColor(score: number) {
  if (score < 30) return { stroke: '#00ff88', label: 'LOW RISK', cls: 'safe' }
  if (score < 60) return { stroke: '#ffcc00', label: 'MEDIUM RISK', cls: 'warn' }
  if (score < 80) return { stroke: '#ff8800', label: 'HIGH RISK', cls: 'warn' }
  return { stroke: '#ff4444', label: 'CRITICAL', cls: 'danger' }
}

export default function RiskGauge({ score, loading = false, size = 'md' }: Props) {
  const radius = 70
  const circ = 2 * Math.PI * radius
  // Only top half used: dasharray = half circle
  const half = circ / 2
  const fill = loading ? 0 : (score / 100) * half
  const { stroke, label, cls } = getColor(score)

  const dim = size === 'sm' ? 140 : size === 'lg' ? 220 : 170
  const cx = dim / 2
  const cy = dim / 2

  return (
    <div className={styles.wrap}>
      <svg width={dim} height={dim / 2 + 20} viewBox={`0 0 ${dim} ${dim / 2 + 20}`}>
        {/* Track */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke="rgba(26,58,107,0.8)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        {/* Fill */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke={stroke}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${fill} ${half}`}
          style={{
            filter: `drop-shadow(0 0 8px ${stroke})`,
            transition: 'stroke-dasharray 1.2s ease, stroke 0.5s ease',
          }}
        />
        {/* Score text */}
        <text x={cx} y={cy - 8} textAnchor="middle" fill={stroke} fontSize="2.2rem" fontWeight="800" fontFamily="Inter">
          {loading ? '—' : score}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="rgba(120,168,212,0.8)" fontSize="0.7rem" fontFamily="Inter" fontWeight="600" letterSpacing="2">
          {label}
        </text>
      </svg>
    </div>
  )
}
