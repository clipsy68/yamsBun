import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

/** Renders a DOM node into a single-page PDF (one full-page image of the node). */
export async function nodeToPdfBytes(node: HTMLElement): Promise<Uint8Array> {
  const canvas = await html2canvas(node, { backgroundColor: '#f3f4f7', scale: 2 })
  const imgData = canvas.toDataURL('image/jpeg', 0.92)
  const orientation = canvas.width >= canvas.height ? 'landscape' : 'portrait'
  const doc = new jsPDF({ orientation, unit: 'px', format: [canvas.width, canvas.height] })
  doc.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height)
  return new Uint8Array(doc.output('arraybuffer'))
}
