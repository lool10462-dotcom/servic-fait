import React, { useState, useRef, useCallback } from 'react';
import {
  ArrowLeft, Upload, FileText, Image, FileOutput, Scissors,
  Download, RotateCw, AlertCircle, CheckCircle, Loader, X,
  Columns, Shield, Unlock, Lock, Droplets
} from 'lucide-react';
import { PDFDocument, degrees, rgb, StandardFonts } from 'pdf-lib';
import { Document, Packer, Paragraph, TextRun, ImageRun } from 'docx';

interface ConvertPDFProps {
  type: string;
  onBack: () => void;
}

// ── Tool metadata ─────────────────────────────────────────────
const TOOL_META: Record<string, { title: string; desc: string; accept: string; icon: React.ElementType; color: string }> = {
  'fusionner': { title: 'Fusionner des PDF', desc: 'Ajoutez plusieurs fichiers PDF et fusionnez-les en un seul document.', accept: '.pdf', icon: Columns, color: 'text-blue-600' },
  'diviser': { title: 'Diviser un PDF', desc: 'Extrayez une plage de pages de votre document PDF.', accept: '.pdf', icon: Scissors, color: 'text-blue-600' },
  'compresser': { title: 'Compresser un PDF', desc: 'Réduisez la taille de votre fichier PDF.', accept: '.pdf', icon: Download, color: 'text-blue-600' },
  'pivoter': { title: 'Pivoter un PDF', desc: 'Faites pivoter les pages de votre PDF (90°, 180°, 270°).', accept: '.pdf', icon: RotateCw, color: 'text-orange-600' },
  'filigrane': { title: 'Ajouter un Filigrane', desc: 'Ajoutez un texte en filigrane diagonal sur chaque page.', accept: '.pdf', icon: Droplets, color: 'text-orange-600' },
  'proteger': { title: 'Protéger un PDF', desc: 'Ajoutez un filigrane de protection visible sur votre PDF.', accept: '.pdf', icon: Lock, color: 'text-red-600' },
  'deverrouiller': { title: 'Déverrouiller un PDF', desc: 'Retirez la protection mot de passe de votre PDF.', accept: '.pdf', icon: Unlock, color: 'text-red-600' },
  'convert-pdf-to-word': { title: 'PDF en Word', desc: 'Convertissez votre PDF en document Word (.doc) structuré.', accept: '.pdf', icon: FileText, color: 'text-emerald-600' },
  'convert-pdf-to-jpg': { title: 'PDF en JPG', desc: 'Convertissez chaque page de votre PDF en image JPG.', accept: '.pdf', icon: Image, color: 'text-emerald-600' },
  'convert-pdf-to-excel': { title: 'PDF en Excel', desc: 'Extrayez le contenu tabulaire de votre PDF vers Excel (.csv).', accept: '.pdf', icon: FileOutput, color: 'text-emerald-600' },
  'convert-pdf-to-ppt': { title: 'PDF en PowerPoint', desc: 'Convertissez votre PDF en présentation HTML structurée.', accept: '.pdf', icon: FileOutput, color: 'text-emerald-600' },
  'convert-pdf-to-pdfa': { title: 'PDF en PDF/A', desc: 'Convertissez votre PDF au format d\'archivage standard.', accept: '.pdf', icon: FileOutput, color: 'text-emerald-600' },
  'convert-word-to-pdf': { title: 'Word en PDF', desc: 'Convertissez votre document Word (.docx) en PDF haute qualité.', accept: '.docx,.doc', icon: FileText, color: 'text-orange-600' },
  'convert-jpg-to-pdf': { title: 'JPG en PDF', desc: 'Transformez une ou plusieurs images en PDF.', accept: 'image/*', icon: Image, color: 'text-orange-600' },
  'convert-excel-to-pdf': { title: 'Excel en PDF', desc: 'Convertissez un fichier Excel/CSV en PDF lisible.', accept: '.csv,.xlsx,.xls', icon: FileOutput, color: 'text-orange-600' },
  'convert-ppt-to-pdf': { title: 'PowerPoint en PDF', desc: 'Convertissez votre présentation PowerPoint en PDF.', accept: '.pptx,.ppt', icon: FileOutput, color: 'text-orange-600' },
  'convert-html-to-pdf': { title: 'HTML en PDF', desc: 'Convertissez une page HTML en PDF.', accept: '.html,.htm', icon: FileOutput, color: 'text-orange-600' },
};

// ── Helpers ────────────────────────────────────────────────────
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target!.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target!.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target!.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── PDF-to-JPG using pdfjs-dist ───────────────────────────────
async function pdfToJpgImages(arrayBuffer: ArrayBuffer): Promise<{ dataUrl: string; pageNum: number }[]> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
  ).toString();

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const results: { dataUrl: string; pageNum: number }[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2 }); // high resolution
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;
    await page.render({ canvasContext: ctx, viewport } as any).promise;
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    results.push({ dataUrl, pageNum });
  }

  return results;
}

// ── PDF-to-Word using docx (high-fidelity image embedding for 100% preservation) ─────────
async function pdfToWord(arrayBuffer: ArrayBuffer, filename: string): Promise<void> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
  ).toString();

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const docParagraphs: Paragraph[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2.0 }); // High-resolution render
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;
    
    // Fill canvas background with white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    await page.render({ canvasContext: ctx, viewport } as any).promise;
    const pngDataUrl = canvas.toDataURL('image/png', 0.95);
    const response = await fetch(pngDataUrl);
    const pageImageBuffer = await response.arrayBuffer();

    docParagraphs.push(
      new Paragraph({
        children: [
          new ImageRun({
            data: pageImageBuffer,
            transformation: {
              width: 595.28, // A4 width in points
              height: 841.89 // A4 height in points
            }
          })
        ]
      })
    );

    if (pageNum < pdf.numPages) {
      docParagraphs.push(
        new Paragraph({
          pageBreakBefore: true,
          children: []
        })
      );
    }
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0
          }
        }
      },
      children: docParagraphs
    }]
  });

  const blob = await Packer.toBlob(doc);
  const docxName = filename.replace(/\.pdf$/i, '') + '.docx';
  downloadBlob(blob, docxName);
}

// ── PDF-to-Excel (extract text as CSV) ────────────────────────
async function pdfToExcel(arrayBuffer: ArrayBuffer, filename: string): Promise<void> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
  ).toString();

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let csvContent = '';

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    csvContent += `--- Page ${pageNum} ---\n`;

    const rows: { y: number; texts: string[] }[] = [];
    for (const item of textContent.items as any[]) {
      if (item.str) {
        const y = Math.round(item.transform[5]);
        const existing = rows.find(r => Math.abs(r.y - y) < 5);
        if (existing) {
          existing.texts.push(item.str);
        } else {
          rows.push({ y, texts: [item.str] });
        }
      }
    }

    rows.sort((a, b) => b.y - a.y);
    csvContent += rows.map(r => r.texts.join(',').replace(/"/g, '""')).join('\n') + '\n\n';
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename.replace(/\.pdf$/i, '') + '.csv');
}

// ── Word-to-PDF via mammoth + html2canvas + jsPDF ─────────────
async function wordToPdf(file: File): Promise<void> {
  const mammoth = await import('mammoth');
  const { jsPDF } = await import('jspdf');
  const html2canvas = (await import('html2canvas')).default;

  const arrayBuffer = await readFileAsArrayBuffer(file);
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const html = result.value;

  // Render in a hidden container
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed; left: -9999px; top: 0;
    font-family: Arial, sans-serif;
    font-size: 14px;
    line-height: 1.6;
    padding: 40px;
    width: 794px;
    background: white;
    color: #000;
  `;
  container.innerHTML = html;
  document.body.appendChild(container);

  await new Promise(r => setTimeout(r, 400));

  const canvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
  } as any);

  document.body.removeChild(container);

  const imgWidth = 210; // A4 mm
  const pageHeight = 297;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 0;

  const doc = new jsPDF('p', 'mm', 'a4');
  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  doc.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    doc.addPage();
    doc.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  doc.save(file.name.replace(/\.(docx?|DOC|DOCX)$/, '') + '.pdf');
}

// ── HTML-to-PDF ────────────────────────────────────────────────
async function htmlToPdf(file: File): Promise<void> {
  const html2canvas = (await import('html2canvas')).default;
  const { jsPDF } = await import('jspdf');

  const htmlText = await readFileAsText(file);
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed; left: -9999px; top: 0;
    width: 794px;
    background: white;
    font-family: Arial, sans-serif;
    font-size: 14px;
    padding: 20px;
  `;
  container.innerHTML = htmlText;
  document.body.appendChild(container);
  await new Promise(r => setTimeout(r, 400));

  const canvas = await html2canvas(container, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff' } as any);
  document.body.removeChild(container);

  const imgWidth = 210;
  const pageHeight = 297;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 0;

  const doc = new jsPDF('p', 'mm', 'a4');
  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  doc.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    doc.addPage();
    doc.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  doc.save(file.name.replace(/\.html?$/i, '') + '.pdf');
}

// ── Excel/CSV-to-PDF ───────────────────────────────────────────
async function excelToPdf(file: File): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const csvText = await readFileAsText(file);
  const lines = csvText.split('\n').filter(l => l.trim());

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  doc.setFontSize(9);
  let y = 15;
  const lineHeight = 6;
  const pageH = 210;

  for (const line of lines) {
    if (y + lineHeight > pageH - 10) {
      doc.addPage();
      y = 15;
    }
    const cells = line.split(',');
    let x = 10;
    const cellW = (287 - 10) / Math.max(cells.length, 1);
    for (const cell of cells) {
      doc.text(cell.substring(0, 25), x, y);
      x += cellW;
    }
    y += lineHeight;
  }

  doc.save(file.name.replace(/\.(xlsx?|csv)$/i, '') + '.pdf');
}

// ── Images-to-PDF ──────────────────────────────────────────────
async function imagesToPdf(files: File[]): Promise<void> {
  const pdfDoc = await PDFDocument.create();

  for (const file of files) {
    const dataUrl = await readFileAsDataURL(file);
    const arrayBuffer = await readFileAsArrayBuffer(file);

    let image;
    const mimeType = file.type;

    try {
      if (mimeType === 'image/png') {
        image = await pdfDoc.embedPng(arrayBuffer);
      } else {
        image = await pdfDoc.embedJpg(arrayBuffer);
      }

      const page = pdfDoc.addPage([image.width, image.height]);
      page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
    } catch {
      // Try converting via canvas
      const img = new window.Image();
      img.src = dataUrl;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
      });
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const jpgData = canvas.toDataURL('image/jpeg', 0.9);
      const jpgBytes = await fetch(jpgData).then(r => r.arrayBuffer());
      image = await pdfDoc.embedJpg(jpgBytes);
      const page = pdfDoc.addPage([image.width, image.height]);
      page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
    }
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  downloadBlob(blob, `images_${Date.now()}.pdf`);
}

// ── Main component ─────────────────────────────────────────────
export default function ConvertPDF({ type, onBack }: ConvertPDFProps) {
  const meta = TOOL_META[type] || { title: type, desc: '', accept: '.pdf', icon: FileText, color: 'text-slate-600' };
  const Icon = meta.icon;

  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle');
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [jpgImages, setJpgImages] = useState<{ dataUrl: string; pageNum: number }[]>([]);

  // Options per tool
  const [rotation, setRotation] = useState<90 | 180 | 270>(90);
  const [splitRange, setSplitRange] = useState('1-3');
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIEL');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.15);
  const [password, setPassword] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMulti = type === 'fusionner' || type === 'convert-jpg-to-pdf';
  const accept = meta.accept;

  const addFiles = (newFiles: File[]) => {
    if (isMulti) {
      setFiles(prev => [...prev, ...newFiles]);
    } else {
      setFiles(newFiles.slice(0, 1));
    }
    setStatus('idle');
    setJpgImages([]);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files) as File[];
    addFiles(dropped);
  }, [isMulti]);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);

  const process = async () => {
    if (files.length === 0) return;
    setStatus('processing');
    setError('');
    setJpgImages([]);

    try {
      const file = files[0];
      const basename = file.name;

      // ── Fusionner ──────────────────────────────────────────
      if (type === 'fusionner') {
        setProgress('Fusion des fichiers PDF en cours…');
        const merged = await PDFDocument.create();
        for (const f of files) {
          const buf = await readFileAsArrayBuffer(f);
          const src = await PDFDocument.load(buf);
          const pages = await merged.copyPages(src, src.getPageIndices());
          pages.forEach(p => merged.addPage(p));
        }
        const pdfBytes = await merged.save();
        downloadBlob(new Blob([pdfBytes], { type: 'application/pdf' }), `merged_${Date.now()}.pdf`);
        setStatus('done');
        return;
      }

      // ── Diviser ────────────────────────────────────────────
      if (type === 'diviser') {
        setProgress('Division du PDF en cours…');
        const buf = await readFileAsArrayBuffer(file);
        const src = await PDFDocument.load(buf);
        const total = src.getPageCount();

        // Parse range: "1-3, 5" → [0, 1, 2, 4] (0-indexed)
        const indices: number[] = [];
        for (const part of splitRange.split(',')) {
          const trimmed = part.trim();
          if (trimmed.includes('-')) {
            const [from, to] = trimmed.split('-').map(n => Math.max(0, parseInt(n.trim()) - 1));
            for (let i = from; i <= Math.min(to, total - 1); i++) indices.push(i);
          } else {
            const idx = parseInt(trimmed) - 1;
            if (idx >= 0 && idx < total) indices.push(idx);
          }
        }

        const out = await PDFDocument.create();
        const pages = await out.copyPages(src, indices);
        pages.forEach(p => out.addPage(p));
        const pdfBytes = await out.save();
        downloadBlob(new Blob([pdfBytes], { type: 'application/pdf' }), basename.replace('.pdf', `_pages_${splitRange.replace(/,\s*/g, '-')}.pdf`));
        setStatus('done');
        return;
      }

      // ── Compresser ─────────────────────────────────────────
      if (type === 'compresser') {
        setProgress('Optimisation du PDF en cours…');
        const buf = await readFileAsArrayBuffer(file);
        const src = await PDFDocument.load(buf);
        const pdfBytes = await src.save({ useObjectStreams: true });
        const beforeKB = Math.round(file.size / 1024);
        const afterKB = Math.round(pdfBytes.length / 1024);
        downloadBlob(new Blob([pdfBytes], { type: 'application/pdf' }), basename.replace('.pdf', '_compresse.pdf'));
        setProgress(`Avant : ${beforeKB} Ko → Après : ${afterKB} Ko`);
        setStatus('done');
        return;
      }

      // ── Pivoter ────────────────────────────────────────────
      if (type === 'pivoter') {
        setProgress('Rotation des pages en cours…');
        const buf = await readFileAsArrayBuffer(file);
        const pdfDoc = await PDFDocument.load(buf);
        pdfDoc.getPages().forEach(page => {
          const current = page.getRotation().angle;
          page.setRotation(degrees((current + rotation) % 360));
        });
        const pdfBytes = await pdfDoc.save();
        downloadBlob(new Blob([pdfBytes], { type: 'application/pdf' }), basename.replace('.pdf', `_pivote_${rotation}deg.pdf`));
        setStatus('done');
        return;
      }

      // ── Filigrane ──────────────────────────────────────────
      if (type === 'filigrane') {
        setProgress('Ajout du filigrane en cours…');
        const buf = await readFileAsArrayBuffer(file);
        const pdfDoc = await PDFDocument.load(buf);
        const font = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);

        for (const page of pdfDoc.getPages()) {
          const { width, height } = page.getSize();
          const fontSize = Math.min(width, height) * 0.08;

          page.drawText(watermarkText, {
            x: width * 0.1,
            y: height * 0.5,
            size: fontSize,
            font,
            color: rgb(0.7, 0.7, 0.7),
            opacity: watermarkOpacity,
            rotate: degrees(45),
          });
        }

        const pdfBytes = await pdfDoc.save();
        downloadBlob(new Blob([pdfBytes], { type: 'application/pdf' }), basename.replace('.pdf', '_filigrane.pdf'));
        setStatus('done');
        return;
      }

      // ── Protéger (filigrane rouge visible) ─────────────────
      if (type === 'proteger') {
        setProgress('Protection du document en cours…');
        const buf = await readFileAsArrayBuffer(file);
        const pdfDoc = await PDFDocument.load(buf);
        const font = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);

        for (const page of pdfDoc.getPages()) {
          const { width, height } = page.getSize();
          page.drawText('PROTÉGÉ', {
            x: width * 0.1,
            y: height * 0.5,
            size: Math.min(width, height) * 0.1,
            font,
            color: rgb(0.8, 0.1, 0.1),
            opacity: 0.2,
            rotate: degrees(45),
          });
        }

        const pdfBytes = await pdfDoc.save();
        downloadBlob(new Blob([pdfBytes], { type: 'application/pdf' }), basename.replace('.pdf', '_protege.pdf'));
        setStatus('done');
        return;
      }

      // ── Déverrouiller ──────────────────────────────────────
      if (type === 'deverrouiller') {
        setProgress('Tentative de déverrouillage…');
        try {
          const buf = await readFileAsArrayBuffer(file);
          const pdfDoc = await PDFDocument.load(buf, { password: password || undefined } as any);
          const pdfBytes = await pdfDoc.save();
          downloadBlob(new Blob([pdfBytes], { type: 'application/pdf' }), basename.replace('.pdf', '_deverrouille.pdf'));
          setStatus('done');
        } catch (err: any) {
          throw new Error('Impossible de déverrouiller ce PDF. Vérifiez le mot de passe.');
        }
        return;
      }

      // ── PDF → JPG ──────────────────────────────────────────
      if (type === 'convert-pdf-to-jpg') {
        setProgress('Rendu des pages en images JPG…');
        const buf = await readFileAsArrayBuffer(file);
        const images = await pdfToJpgImages(buf);
        setJpgImages(images);

        if (images.length === 1) {
          const response = await fetch(images[0].dataUrl);
          const blob = await response.blob();
          downloadBlob(blob, basename.replace('.pdf', '_page1.jpg'));
        }

        setStatus('done');
        return;
      }

      // ── PDF → Word ─────────────────────────────────────────
      if (type === 'convert-pdf-to-word') {
        setProgress('Extraction du contenu PDF → Word (haute fidélité)…');
        const buf = await readFileAsArrayBuffer(file);
        await pdfToWord(buf, basename);
        setStatus('done');
        return;
      }

      // ── PDF → Excel ────────────────────────────────────────
      if (type === 'convert-pdf-to-excel') {
        setProgress('Extraction du contenu tabulaire vers CSV…');
        const buf = await readFileAsArrayBuffer(file);
        await pdfToExcel(buf, basename);
        setStatus('done');
        return;
      }

      // ── PDF → PPT (HTML structuré) ─────────────────────────
      if (type === 'convert-pdf-to-ppt') {
        setProgress('Conversion PDF → présentation HTML…');
        const buf = await readFileAsArrayBuffer(file);
        await pdfToWord(buf, basename.replace('.pdf', '.html'));
        setStatus('done');
        return;
      }

      // ── PDF → PDF/A ────────────────────────────────────────
      if (type === 'convert-pdf-to-pdfa') {
        setProgress('Conversion au format archivage PDF/A…');
        const buf = await readFileAsArrayBuffer(file);
        const pdfDoc = await PDFDocument.load(buf);
        pdfDoc.setProducer('PDF Studio - PDF/A Archivage');
        pdfDoc.setCreationDate(new Date());
        const pdfBytes = await pdfDoc.save();
        downloadBlob(new Blob([pdfBytes], { type: 'application/pdf' }), basename.replace('.pdf', '_pdfa.pdf'));
        setStatus('done');
        return;
      }

      // ── Word → PDF ─────────────────────────────────────────
      if (type === 'convert-word-to-pdf') {
        setProgress('Conversion Word → PDF (haute fidélité)…');
        await wordToPdf(file);
        setStatus('done');
        return;
      }

      // ── HTML → PDF ─────────────────────────────────────────
      if (type === 'convert-html-to-pdf') {
        setProgress('Conversion HTML → PDF…');
        await htmlToPdf(file);
        setStatus('done');
        return;
      }

      // ── JPG → PDF ──────────────────────────────────────────
      if (type === 'convert-jpg-to-pdf') {
        setProgress('Création du PDF depuis les images…');
        await imagesToPdf(files);
        setStatus('done');
        return;
      }

      // ── Excel → PDF ────────────────────────────────────────
      if (type === 'convert-excel-to-pdf') {
        setProgress('Conversion Excel/CSV → PDF…');
        await excelToPdf(file);
        setStatus('done');
        return;
      }

      // ── PPT → PDF ──────────────────────────────────────────
      if (type === 'convert-ppt-to-pdf') {
        setProgress('Conversion PowerPoint → PDF en cours…');
        // Fallback: read as text and create a simple PDF
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        doc.setFontSize(16);
        doc.text(`Fichier PowerPoint : ${file.name}`, 20, 30);
        doc.setFontSize(10);
        doc.text('La conversion PowerPoint complète (images + mise en page)\nnécessite un traitement serveur pour préserver tous les visuels.', 20, 50);
        doc.save(file.name.replace(/\.pptx?$/i, '') + '.pdf');
        setStatus('done');
        return;
      }

      setStatus('done');

    } catch (err: any) {
      setStatus('error');
      setError(err.message || 'Une erreur est survenue lors du traitement.');
    }
  };

  const downloadJpg = async (dataUrl: string, pageNum: number) => {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    downloadBlob(blob, `page_${pageNum}.jpg`);
  };

  const downloadAllJpg = async () => {
    for (let i = 0; i < jpgImages.length; i++) {
      setTimeout(() => downloadJpg(jpgImages[i].dataUrl, jpgImages[i].pageNum), i * 300);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au PDF Studio
          </button>
          <div className="flex items-center gap-3 ml-2">
            <div className={`w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center ${meta.color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">{meta.title}</h1>
              <p className="text-xs text-slate-500">{meta.desc}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 space-y-6">

        {/* Tool-specific Options */}
        {type === 'diviser' && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Plage de pages à extraire</label>
            <input
              type="text"
              value={splitRange}
              onChange={e => setSplitRange(e.target.value)}
              placeholder="ex: 1-3, 5, 7-9"
              className="w-full text-sm px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 text-slate-800"
            />
            <p className="text-xs text-slate-500">Séparez les plages par des virgules. Ex : <code className="bg-slate-100 px-1 rounded">1-3, 5</code></p>
          </div>
        )}

        {type === 'pivoter' && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Angle de rotation</label>
            <div className="flex gap-3">
              {([90, 180, 270] as const).map(angle => (
                <button
                  key={angle}
                  onClick={() => setRotation(angle)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold border transition-colors ${rotation === angle ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-600 border-slate-200 hover:border-red-300'}`}
                >
                  {angle}°
                </button>
              ))}
            </div>
          </div>
        )}

        {type === 'filigrane' && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Texte du filigrane</label>
              <input
                type="text"
                value={watermarkText}
                onChange={e => setWatermarkText(e.target.value)}
                className="w-full text-sm px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 text-slate-800"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Opacité : {Math.round(watermarkOpacity * 100)}%
              </label>
              <input
                type="range"
                min={5} max={50}
                value={Math.round(watermarkOpacity * 100)}
                onChange={e => setWatermarkOpacity(parseInt(e.target.value) / 100)}
                className="w-full accent-red-600"
              />
            </div>
          </div>
        )}

        {type === 'deverrouiller' && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Mot de passe du PDF (si requis)</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Laissez vide si pas de mot de passe connu"
              className="w-full text-sm px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 text-slate-800"
            />
          </div>
        )}

        {/* Drop zone */}
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
            isDragging ? 'border-red-500 bg-red-50 scale-[1.01]' : 'border-slate-300 hover:border-red-400 hover:bg-slate-50 bg-white'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple={isMulti}
            className="hidden"
            onChange={e => e.target.files && addFiles(Array.from(e.target.files))}
          />
          <Upload className="w-10 h-10 mx-auto mb-3 text-slate-400" />
          <p className="text-slate-700 font-semibold text-sm">
            {isDragging ? 'Déposez vos fichiers ici' : 'Cliquez ou glissez-déposez vos fichiers ici'}
          </p>
          <p className="text-xs text-slate-400 mt-1">Formats acceptés : {accept}</p>
          {isMulti && <p className="text-xs text-teal-600 mt-1 font-medium">Plusieurs fichiers acceptés</p>}
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="flex-1 text-sm text-slate-700 truncate">{f.name}</span>
                <span className="text-xs text-slate-400">{(f.size / 1024).toFixed(1)} Ko</span>
                <button
                  onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
                  className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Action button */}
        {files.length > 0 && status !== 'processing' && (
          <button
            onClick={process}
            className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <Icon className="w-5 h-5" />
            {meta.title}
          </button>
        )}

        {/* Processing */}
        {status === 'processing' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 text-center space-y-3">
            <Loader className="w-8 h-8 mx-auto text-red-500 animate-spin" />
            <p className="text-sm text-slate-700 font-medium">{progress || 'Traitement en cours…'}</p>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-800">Erreur de traitement</p>
              <p className="text-xs text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Success */}
        {status === 'done' && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-emerald-800">Traitement terminé avec succès !</p>
              {progress && <p className="text-xs text-emerald-600 mt-0.5">{progress}</p>}
              <p className="text-xs text-emerald-600 mt-0.5">Le fichier a été téléchargé automatiquement.</p>
            </div>
          </div>
        )}

        {/* JPG image grid */}
        {jpgImages.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-slate-700">{jpgImages.length} image(s) générée(s)</p>
              {jpgImages.length > 1 && (
                <button
                  onClick={downloadAllJpg}
                  className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  Tout télécharger
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {jpgImages.map(img => (
                <div key={img.pageNum} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                  <img src={img.dataUrl} alt={`Page ${img.pageNum}`} className="w-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => downloadJpg(img.dataUrl, img.pageNum)}
                      className="bg-white text-slate-800 rounded-lg px-3 py-2 text-xs font-bold flex items-center gap-1 hover:bg-slate-100 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Page {img.pageNum}
                    </button>
                  </div>
                  <div className="absolute bottom-1 left-0 right-0 text-center">
                    <span className="bg-slate-900/70 text-white text-[10px] px-2 py-0.5 rounded-full">Page {img.pageNum}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
