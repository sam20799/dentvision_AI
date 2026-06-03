import { motion, AnimatePresence } from 'framer-motion'

export const ScannerHUD = ({ active, progress = 0 }) => {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          {/* Scan line */}
          <motion.div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: 2,
              background: 'linear-gradient(90deg, transparent, #00D4FF, transparent)',
              boxShadow: '0 0 20px #00D4FF',
            }}
            animate={{ top: ['-1000%', '100%'] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
          />

          {/* Corner brackets */}
          {[
            { top: 8, left: 8, borderTop: '2px solid #00D4FF', borderLeft: '2px solid #00D4FF' },
            { top: 8, right: 8, borderTop: '2px solid #00D4FF', borderRight: '2px solid #00D4FF' },
            { bottom: 8, left: 8, borderBottom: '2px solid #00D4FF', borderLeft: '2px solid #00D4FF' },
            { bottom: 8, right: 8, borderBottom: '2px solid #00D4FF', borderRight: '2px solid #00D4FF' },
          ].map((style, i) => (
            <div key={i} style={{ position: 'absolute', width: 20, height: 20, ...style }} />
          ))}

          {/* Progress */}
          <div style={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            right: 16,
          }}>
            <div style={{
              fontFamily: '"Share Tech Mono", monospace',
              fontSize: '0.6rem',
              color: '#00D4FF',
              letterSpacing: '0.15em',
              marginBottom: 4,
            }}>
              NEURAL SCAN — {Math.round(progress * 100)}%
            </div>
            <div style={{ height: 2, background: 'rgba(255,255,255,0.08)' }}>
              <motion.div
                style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #3B8BEB, #00D4FF)',
                  width: `${progress * 100}%`,
                }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ScannerHUD
