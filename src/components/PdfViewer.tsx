import { useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import './PdfViewer.css'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

interface PdfViewerProps {
  data: Uint8Array
}

export default function PdfViewer({ data }: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let cancelled = false
    container.innerHTML = ''

    ;(async () => {
      try {
        const pdf = await pdfjsLib.getDocument({ data: data.slice() }).promise
        const outputScale = Math.min(2, window.devicePixelRatio || 1)

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          if (cancelled) return
          const page = await pdf.getPage(pageNum)
          const viewport = page.getViewport({ scale: 1 })
          const canvas = document.createElement('canvas')
          canvas.className = 'pdfv-page'
          canvas.width = Math.floor(viewport.width * outputScale)
          canvas.height = Math.floor(viewport.height * outputScale)
          const ctx = canvas.getContext('2d')
          if (!ctx) continue
          container.appendChild(canvas)
          await page.render({
            canvas,
            canvasContext: ctx,
            viewport,
            transform: [outputScale, 0, 0, outputScale, 0, 0],
          }).promise
        }
      } catch {
        if (!cancelled) setError('Nu am putut afișa PDF-ul.')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [data])

  return (
    <div className="pdfv-wrap">
      {error ? <div className="pdfv-error">{error}</div> : <div className="pdfv-pages" ref={containerRef} />}
    </div>
  )
}
