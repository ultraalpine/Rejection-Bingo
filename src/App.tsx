import { useState, useCallback, useEffect } from 'react'
import confetti from 'canvas-confetti'

const FIXED_TOP_LEFT = 'unfortunately'
const CENTER_POS = 12 // row 3, col 3 of 5×5

const ALL_PHRASES = [
  'endeavors',
  'best of luck',
  'moving forward',
  'strong',
  'we appreciate',
  'difficult decision',
  'pool',
  'keep in touch',
  'future opportunities',
  'thank you for your interest',
  'stay connected',
  'talent team',
  'at this stage',
  'we hope',
  'better fit',
  'highly competitive',
  'match',
  'apply again',
  'at this time',
  'careful',
  'progressing further',
  'we were impressed',
  'all the best',
]

// 5×5 bingo lines: 5 rows + 5 cols + 2 diagonals
const BINGO_LINES = [
  [0,1,2,3,4],
  [5,6,7,8,9],
  [10,11,12,13,14],
  [15,16,17,18,19],
  [20,21,22,23,24],
  [0,5,10,15,20],
  [1,6,11,16,21],
  [2,7,12,17,22],
  [3,8,13,18,23],
  [4,9,14,19,24],
  [0,6,12,18,24],
  [4,8,12,16,20],
]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Build grid: pos 0 = fixed "unfortunately", pos 12 = fixed "FREE"
// The 23 shuffleable slots are positions 1-11 and 13-24
function buildGrid(shuffled: string[]): string[] {
  const grid: string[] = new Array(25)
  grid[0] = FIXED_TOP_LEFT
  grid[12] = 'FREE'
  let idx = 0
  for (let pos = 1; pos <= 24; pos++) {
    if (pos === 12) continue
    grid[pos] = shuffled[idx++]
  }
  return grid
}

function getInitialMarked(): Set<number> {
  return new Set([12]) // only FREE pre-marked
}

function hasBingo(marked: Set<number>): boolean {
  return BINGO_LINES.some(line => line.every(pos => marked.has(pos)))
}

function getCompletedLines(marked: Set<number>): number[][] {
  return BINGO_LINES.filter(line => line.every(pos => marked.has(pos)))
}

export default function App() {
  const [grid, setGrid] = useState<string[]>(() => buildGrid(shuffle(ALL_PHRASES)))
  const [marked, setMarked] = useState<Set<number>>(getInitialMarked)
  const [celebratedLines, setCelebratedLines] = useState<Set<string>>(new Set())

  const fireConfetti = useCallback(() => {
    const duration = 2500
    const end = Date.now() + duration
    const colors = ['#1950a3', '#fdf7e9', '#fbbf24', '#ffffff']
    const frame = () => {
      confetti({
        particleCount: 6,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
        scalar: 0.9,
      })
      confetti({
        particleCount: 6,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
        scalar: 0.9,
      })
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }, [])

  // Check for new bingo lines after mark changes
  useEffect(() => {
    const completed = getCompletedLines(marked)
    const completedKeys = new Set(completed.map(l => l.join(',')))
    const newLines = [...completedKeys].filter(k => !celebratedLines.has(k))
    if (newLines.length > 0) {
      setCelebratedLines(prev => new Set([...prev, ...newLines]))
      fireConfetti()
    }
  }, [marked]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleCell = useCallback((pos: number) => {
    if (pos === 12) return // FREE is always marked
    setMarked(prev => {
      const next = new Set(prev)
      // pos 0 is toggle-able but always starts marked
      next.has(pos) ? next.delete(pos) : next.add(pos)
      // ensure FREE and top-left stay marked
      next.add(12)
      return next
    })
  }, [])

  const reset = useCallback(() => {
    setGrid(buildGrid(shuffle(ALL_PHRASES)))
    setMarked(getInitialMarked())
    setCelebratedLines(new Set())
  }, [])

  const completedSet = new Set(getCompletedLines(marked).flat())

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start py-4 px-2"
      style={{ backgroundColor: 'var(--bingo-cream)' }}
    >
      {/* Header */}
      <div
        className="w-full max-w-md rounded-lg flex flex-col items-center justify-center py-6 px-4 mb-3"
        style={{ backgroundColor: 'var(--bingo-blue)' }}
      >
        <p
          className="text-3xl leading-tight italic"
          style={{
            fontFamily: '"Vampiro One", sans-serif',
            color: 'var(--bingo-cream)',
          }}
        >
          rejection
        </p>
        <p
          className="text-7xl sm:text-8xl leading-none tracking-tight"
          style={{
            fontFamily: '"Vampiro One", sans-serif',
            color: 'var(--bingo-cream)',
          }}
        >
          BiNGO
        </p>
      </div>

      {/* Grid */}
      <div
        className="w-full max-w-md border-2"
        style={{ borderColor: 'var(--bingo-blue)' }}
      >
        <div className="grid grid-cols-5">
          {grid.map((phrase, pos) => {
            const isMarked = marked.has(pos)
            const isFree = pos === CENTER_POS
            const isTopLeft = pos === 0
            const isWinning = completedSet.has(pos)

            return (
              <button
                key={pos}
                onClick={() => toggleCell(pos)}
                className="relative flex items-center justify-center aspect-square border transition-colors duration-200 select-none focus:outline-none active:scale-95"
                style={{
                  borderColor: 'var(--bingo-blue)',
                  backgroundColor: isMarked
                    ? isWinning
                      ? '#f59e0b'
                      : 'var(--bingo-blue)'
                    : 'var(--bingo-cream)',
                  cursor: isFree ? 'default' : 'pointer',
                }}
              >
                {isTopLeft ? (
                  <span className="absolute inset-0 flex items-center justify-center overflow-hidden">
                    <span
                      className="text-[8px] font-semibold uppercase tracking-widest leading-tight text-center block"
                      style={{
                        fontFamily: '"Roboto", sans-serif',
                        color: isMarked ? (isWinning ? '#1c1c1c' : 'var(--bingo-cream)') : 'var(--bingo-blue)',
                        transform: 'rotate(-45deg)',
                        width: '130%',
                      }}
                    >
                      unfortunately
                    </span>
                  </span>
                ) : isFree ? (
                  <span
                    className="text-xl sm:text-2xl font-bold"
                    style={{
                      fontFamily: '"Vampiro One", sans-serif',
                      color: isWinning ? '#1c1c1c' : 'var(--bingo-cream)',
                    }}
                  >
                    FREE
                  </span>
                ) : (
                  <span
                    className="text-[10px] sm:text-xs font-semibold uppercase text-center leading-tight px-1"
                    style={{
                      fontFamily: '"Roboto", sans-serif',
                      color: isMarked ? (isWinning ? '#1c1c1c' : 'var(--bingo-cream)') : 'var(--bingo-blue)',
                      wordBreak: 'break-word',
                    }}
                  >
                    {phrase}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Reset button */}
      <button
        onClick={reset}
        className="mt-5 px-8 py-3 rounded font-semibold text-sm uppercase tracking-widest border-2 transition-colors duration-150"
        style={{
          fontFamily: '"Roboto", sans-serif',
          borderColor: 'var(--bingo-blue)',
          color: 'var(--bingo-blue)',
          backgroundColor: 'transparent',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget
          el.style.backgroundColor = 'var(--bingo-blue)'
          el.style.color = 'var(--bingo-cream)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget
          el.style.backgroundColor = 'transparent'
          el.style.color = 'var(--bingo-blue)'
        }}
      >
        Shuffle & Reset
      </button>
    </div>
  )
}
