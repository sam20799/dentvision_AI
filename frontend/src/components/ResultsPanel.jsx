import { motion, AnimatePresence } from 'framer-motion'

const CLASS_CONFIG = {
  F_Breakage:  { color: '#FFB344', severity: 'MODERATE', zone: 'FRONT', label: 'Front Breakage' },
  F_Crushed:   { color: '#FF4444', severity: 'SEVERE',   zone: 'FRONT', label: 'Front Crushed' },
  F_Normal:    { color: '#00D4FF', severity: 'MINOR',    zone: 'FRONT', label: 'Front Normal' },
  R_Breakage:  { color: '#FFB344', severity: 'MODERATE', zone: 'REAR',  label: 'Rear Breakage' },
  R_Crushed:   { color: '#FF4444', severity: 'SEVERE',   zone: 'REAR',  label: 'Rear Crushed' },
  R_Normal:    { color: '#00D4FF', severity: 'MINOR',    zone: 'REAR',  label: 'Rear Normal' },
}

export const ResultsPanel = ({ results, onReset }) => {
  if (!results) return null
  const cfg = CLASS_CONFIG[results.class] || { color: '#3B8BEB', severity: 'UNKNOWN', zone: '??', label: results.class }

  const recommendations = {
    SEVERE: 'Major structural damage detected. Vehicle should not be operated. Immediate professional assessment and likely total loss evaluation required.',
    MODERATE: 'Panel breakage and deformation detected. Professional workshop assessment and repair estimate strongly advised before continued operation.',
    MINOR: 'Vehicle surface appears structurally sound. Cosmetic assessment may still be warranted for pre-delivery inspection.',
    UNKNOWN: 'Damage classification inconclusive. Manual inspection recommended.',
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          background: 'rgba(6,13,20,0.95)',
          border: `1px solid ${cfg.color}33`,
          backdropFilter: 'blur(20px)',
          padding: '2rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent, ${cfg.color}, transparent)`,
        }} />

        {results.demo && (
          <div style={{
            fontFamily: '"Share Tech Mono", monospace',
            fontSize: '0.6rem', color: '#C8943A',
            letterSpacing: '0.15em', marginBottom: '1.5rem',
            padding: '4px 12px', border: '1px solid rgba(200,148,58,0.2)',
            display: 'inline-block',
          }}>
            ⚠ DEMO MODE — NO BACKEND CONNECTED
          </div>
        )}

        <div style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: '0.65rem', color: 'rgba(232,237,242,0.3)', letterSpacing: '0.2em', marginBottom: '0.5rem' }}>
          ◈ CLASSIFICATION RESULT
        </div>

        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: '0.7rem', color: cfg.color, marginBottom: 4 }}>
            [{cfg.zone} PANEL]
          </div>
          <div style={{
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: '3rem', color: cfg.color,
            lineHeight: 1, letterSpacing: '0.05em',
            marginBottom: '0.5rem',
          }}>
            {cfg.label}
          </div>
          <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
            <div>
              <div style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: '0.6rem', color: 'rgba(232,237,242,0.3)', letterSpacing: '0.1em' }}>CONFIDENCE</div>
              <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '1.5rem', color: cfg.color }}>{(results.confidence * 100).toFixed(1)}%</div>
            </div>
            <div>
              <div style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: '0.6rem', color: 'rgba(232,237,242,0.3)', letterSpacing: '0.1em' }}>SEVERITY</div>
              <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '1.5rem', color: cfg.color }}>{cfg.severity}</div>
            </div>
          </div>
        </motion.div>

        {results.all_scores && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <div style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: '0.6rem', color: 'rgba(232,237,242,0.3)', letterSpacing: '0.15em', marginBottom: '1rem' }}>
              PROBABILITY DISTRIBUTION
            </div>
            {Object.entries(results.all_scores)
              .sort(([,a],[,b]) => b - a)
              .map(([cls, score], i) => (
                <motion.div key={cls} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.07 }} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: '"Share Tech Mono", monospace', fontSize: '0.6rem', color: cls === results.class ? cfg.color : 'rgba(232,237,242,0.3)', marginBottom: 4, letterSpacing: '0.05em' }}>
                    <span>{cls}</span>
                    <span>{(score * 100).toFixed(1)}%</span>
                  </div>
                  <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(score * 100, 100)}%` }}
                      transition={{ duration: 0.8, delay: 0.6 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                      style={{ height: '100%', background: cls === results.class ? cfg.color : 'rgba(255,255,255,0.12)' }}
                    />
                  </div>
                </motion.div>
              ))}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          style={{
            marginTop: '1.5rem',
            padding: '1rem',
            background: 'rgba(0,0,0,0.3)',
            borderLeft: `3px solid ${cfg.color}`,
          }}
        >
          <div style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: '0.6rem', color: 'rgba(232,237,242,0.3)', letterSpacing: '0.15em', marginBottom: 6 }}>AI ASSESSMENT</div>
          <p style={{ fontSize: '0.82rem', color: 'rgba(232,237,242,0.6)', lineHeight: 1.7, fontFamily: 'Rajdhani, sans-serif', fontWeight: 300 }}>
            {recommendations[cfg.severity]}
          </p>
        </motion.div>

        <motion.button
          onClick={onReset}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            marginTop: '1.5rem',
            fontFamily: 'Rajdhani, sans-serif',
            fontSize: '0.8rem', fontWeight: 700,
            letterSpacing: '0.15em', textTransform: 'uppercase',
            padding: '0.7rem 2rem',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(232,237,242,0.6)',
            cursor: 'pointer',
            width: '100%',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.target.style.borderColor = cfg.color; e.target.style.color = cfg.color }}
          onMouseLeave={e => { e.target.style.borderColor = 'rgba(255,255,255,0.15)'; e.target.style.color = 'rgba(232,237,242,0.6)' }}
        >
          ↺ Analyze New Vehicle
        </motion.button>
      </motion.div>
    </AnimatePresence>
  )
}

export default ResultsPanel
