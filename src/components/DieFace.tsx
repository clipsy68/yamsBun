const PIPS: Record<number, [number, number][]> = {
  1: [[20, 20]],
  2: [
    [12, 10],
    [28, 30],
  ],
  3: [
    [12, 10],
    [20, 20],
    [28, 30],
  ],
  4: [
    [12, 10],
    [28, 10],
    [12, 30],
    [28, 30],
  ],
  5: [
    [12, 10],
    [28, 10],
    [20, 20],
    [12, 30],
    [28, 30],
  ],
  6: [
    [12, 10],
    [12, 20],
    [12, 30],
    [28, 10],
    [28, 20],
    [28, 30],
  ],
}

interface DieFaceProps {
  face: number
  size?: number
  pipColor?: string
}

export default function DieFace({ face, size = 26, pipColor = 'currentColor' }: DieFaceProps) {
  const pips = PIPS[face] ?? []
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      {pips.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3.4} fill={pipColor} />
      ))}
    </svg>
  )
}
