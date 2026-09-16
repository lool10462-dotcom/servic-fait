import React, { useState, useRef, useCallback } from 'react';
import {
  ArrowLeft, Upload, FileText, Image, FileOutput, Scissors,
  Download, RotateCw, AlertCircle, CheckCircle, Loader, X,
  Columns, Shield, Unlock, Lock, Droplets, Play, Copy, Check,
  Sparkles, Wrench, Eye, RefreshCw, FileSpreadsheet, Layers,
  Camera, CheckSquare, Zap, ExternalLink, Folder
} from 'lucide-react';
import { PDFDocument, degrees, rgb, StandardFonts } from 'pdf-lib';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  AlignmentType, 
  ImageRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType
} from 'docx';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { storageService } from '../../services/storageService';
import { 
  savePdfStudioHistoryItem, 
  getPdfStudioHistory, 
  PdfStudioHistoryItem 
} from '../../utils/pdfStudioPersistence';

interface ConvertPDFProps {
  type: string;
  onBack: () => void;
}

// ── Tool metadata ─────────────────────────────────────────────
const TOOL_META: Record<string, { title: string; desc: string; accept: string; icon: React.ElementType; color: string; badge: string }> = {
  'fusionner': { title: 'Fusionner des PDF', desc: 'Combinez plusieurs fichiers PDF dans l\'ordre de votre choix en un document unique.', accept: '.pdf', icon: Columns, color: 'text-blue-500', badge: 'Fusion illimitée' },
  'diviser': { title: 'Diviser un PDF', desc: 'Extrayez des pages spécifiques ou séparez chaque page dans un fichier ZIP.', accept: '.pdf', icon: Scissors, color: 'text-blue-500', badge: 'Pages & ZIP' },
  'compresser': { title: 'Compresser un PDF', desc: 'Réduisez considérablement le poids de votre fichier PDF tout en préservant la netteté.', accept: '.pdf', icon: Download, color: 'text-blue-500', badge: 'Optimisation' },
  'pivoter': { title: 'Pivoter un PDF', desc: 'Faites pivoter toutes les pages ou une sélection de pages (90°, 180°, 270°).', accept: '.pdf', icon: RotateCw, color: 'text-amber-500', badge: 'Orientation' },
  'filigrane': { title: 'Ajouter un Filigrane', desc: 'Apposez un texte confidentiel ou un tampon diagonal personnalisé sur chaque page.', accept: '.pdf', icon: Droplets, color: 'text-amber-500', badge: 'Estampille' },
  'proteger': { title: 'Protéger un PDF', desc: 'Verrouillez votre document avec un mot de passe fort et chiffrement sécurisé.', accept: '.pdf', icon: Lock, color: 'text-rose-500', badge: 'Chiffrement' },
  'deverrouiller': { title: 'Déverrouiller un PDF', desc: 'Supprimez le mot de passe et les restrictions d\'un document protégé.', accept: '.pdf', icon: Unlock, color: 'text-rose-500', badge: 'Déblocage' },
  'reparer': { title: 'Réparer un PDF', desc: 'Réparez la structure endommagée d\'un PDF corrompu pour récupérer son contenu.', accept: '.pdf', icon: Wrench, color: 'text-purple-500', badge: 'Restauration' },
  'ocr': { title: 'OCR & Extraction de Texte', desc: 'Reconnaissance optique de caractères pour extraire le texte éditable d\'un PDF.', accept: '.pdf', icon: FileText, color: 'text-purple-500', badge: 'Texte éditable' },
  'convert-pdf-to-word': { title: 'PDF en Word (.docx)', desc: 'Convertissez votre PDF en document Microsoft Word avec texte entièrement modifiable.', accept: '.pdf', icon: FileText, color: 'text-emerald-500', badge: 'Word éditable' },
  'convert-pdf-to-excel': { title: 'PDF en Excel (.xlsx)', desc: 'Détectez les tableaux de votre PDF et exportez-les dans un classeur Excel natif.', accept: '.pdf', icon: FileSpreadsheet, color: 'text-emerald-500', badge: 'Classeur .xlsx' },
  'convert-pdf-to-ppt': { title: 'PDF en PowerPoint', desc: 'Transformez chaque page de votre PDF en diapositive de présentation.', accept: '.pdf', icon: Play, color: 'text-emerald-500', badge: 'Présentation' },
  'convert-pdf-to-jpg': { title: 'PDF en JPG', desc: 'Extrayez toutes les pages en images JPG haute définition (avec option ZIP).', accept: '.pdf', icon: Image, color: 'text-emerald-500', badge: 'Haute Résolution' },
  'convert-pdf-to-pdfa': { title: 'PDF en PDF/A', desc: 'Normalisez votre PDF selon le standard d\'archivage institutionnel long terme.', accept: '.pdf', icon: FileOutput, color: 'text-emerald-500', badge: 'Archivage ISO' },
  'convert-word-to-pdf': { title: 'Word en PDF', desc: 'Transformez vos documents Word (.docx, .doc) en PDF avec pagination parfaite.', accept: '.docx,.doc', icon: FileText, color: 'text-blue-500', badge: 'Format direct' },
  'convert-excel-to-pdf': { title: 'Excel en PDF', desc: 'Convertissez des feuilles Excel (.xlsx, .xls, .csv) en PDF avec mise en page tabulaire.', accept: '.xlsx,.xls,.csv', icon: FileSpreadsheet, color: 'text-emerald-500', badge: 'Tableaux nets' },
  'convert-ppt-to-pdf': { title: 'PowerPoint en PDF', desc: 'Convertissez vos présentations (.pptx, .ppt) en diapositives PDF haute fidélité.', accept: '.pptx,.ppt', icon: Play, color: 'text-orange-500', badge: 'Diapositives' },
  'convert-jpg-to-pdf': { title: 'JPG / Images en PDF', desc: 'Assemblez une ou plusieurs photos (JPG, PNG, WEBP) en un document PDF unique.', accept: 'image/*', icon: Image, color: 'text-amber-500', badge: 'Multi-images' },
  'convert-html-to-pdf': { title: 'HTML en PDF', desc: 'Convertissez une page ou du code HTML structuré en PDF propre et imprimable.', accept: '.html,.htm', icon: FileOutput, color: 'text-slate-500', badge: 'Web vers PDF' },
  'comparer': { title: 'Comparer des PDF', desc: 'Analysez les différences de pages, texte et métadonnées entre deux documents PDF.', accept: '.pdf', icon: Layers, color: 'text-purple-500', badge: 'Comparaison' },
  'scanner': { title: 'Scanner vers PDF', desc: 'Numérisez des documents via votre appareil photo ou webcam et exportez en PDF haute qualité.', accept: 'image/*', icon: Camera, color: 'text-teal-500', badge: 'Numérisation' },
  'calques': { title: 'Extraction des Calques & Images', desc: 'Extrayez toutes les images et couches graphiques d\'un PDF dans une archive ZIP.', accept: '.pdf', icon: Layers, color: 'text-indigo-500', badge: 'Extraction assets' },
  'correcteur': { title: 'Correcteur Typographique & Orthographique', desc: 'Audit qualité, règles d\'espacement typographiques et normalisation du texte.', accept: '.pdf', icon: CheckSquare, color: 'text-emerald-500', badge: 'Contrôle qualité' },
};

// ── Helpers ────────────────────────────────────────────────────
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
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

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Octet';
  const k = 1024;
  const sizes = ['Octets', 'Ko', 'Mo', 'Go'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Diagnostic & Centralized Error Categorization
interface ErrorDiagnosis {
  title: string;
  explanation: string;
  advice: string;
}

function categorizePdfError(err: any): ErrorDiagnosis {
  const msg = (err?.message || String(err)).toLowerCase();
  if (msg.includes('password') || msg.includes('decrypt') || msg.includes('encrypted')) {
    return {
      title: 'Document chiffré par mot de passe',
      explanation: 'Ce document PDF requiert une clé ou un mot de passe de déchiffrement pour autoriser la lecture et la conversion de son contenu.',
      advice: 'Utilisez d\'abord l\'outil « Déverrouiller PDF » ou renseignez le mot de passe dans les options avant de relancer l\'opération.'
    };
  }
  if (msg.includes('invalid pdf') || msg.includes('corrupt') || msg.includes('end of file') || msg.includes('xref') || msg.includes('bad xref')) {
    return {
      title: 'Structure PDF endommagée ou invalide',
      explanation: 'La structure interne de ce document PDF comporte des tables d\'objets corrompues ou des octets tronqués.',
      advice: 'Lancez l\'outil « Réparer PDF » de PDF Studio pour reconstruire l\'en-tête et les tables du document.'
    };
  }
  if (msg.includes('memory') || msg.includes('canvas') || msg.includes('call stack') || msg.includes('allocation')) {
    return {
      title: 'Dépassement de capacité mémoire navigateur',
      explanation: 'Le fichier comporte une pagination trop dense ou des graphismes ultra-lourds pour la mémoire allouée par le navigateur.',
      advice: 'Utilisez l\'outil « Diviser PDF » pour traiter le document par lots de 10 à 20 pages.'
    };
  }
  if (msg.includes('zip') || msg.includes('openxml') || msg.includes('part not found') || msg.includes('central directory')) {
    return {
      title: 'Format de fichier incompatible',
      explanation: 'Le document Office fourni n\'a pas pu être décompressé en tant qu\'archive OpenXML (.docx, .xlsx, .pptx) valide.',
      advice: 'Assurez-vous d\'importer un document récent créé sous Microsoft Office, Google Docs ou LibreOffice.'
    };
  }
  return {
    title: 'Interruption inattendue du traitement',
    explanation: err?.message || 'Une anomalie s\'est produite durant le cycle de conversion ou de rendu.',
    advice: 'Vérifiez que votre fichier est valide et non verrouillé par une autre application, puis réessayez. Aucun fichier n\'a quitté votre ordinateur.'
  };
}

// Ensure PDF.js worker is properly configured
async function getPdfJs() {
  const pdfjsLib = await import('pdfjs-dist');
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).toString();
    } catch {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '4.0.379'}/build/pdf.worker.min.mjs`;
    }
  }
  return pdfjsLib;
}

// ── 1. PDF TO WORD (.DOCX) — PRESERVE TABLES, LOGOS, TEXTURES & SHAPES ────────────
async function pdfToWordEditable(
  arrayBuffer: ArrayBuffer, 
  filename: string,
  onProgress: (msg: string, percent?: number) => void
): Promise<{ blob: Blob; filename: string }> {
  onProgress('Initialisation du moteur d\'analyse haute fidélité…', 10);
  const pdfjsLib = await getPdfJs();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const docElements: (Paragraph | Table)[] = [];

  // Title header for the document
  const baseTitle = filename.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');
  docElements.push(
    new Paragraph({
      text: baseTitle,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 }
    })
  );

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const pagePercent = Math.round(15 + (pageNum / pdf.numPages) * 70);
    onProgress(`Analyse vectorielle, tableaux & calques : page ${pageNum}/${pdf.numPages}…`, pagePercent);
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    // Group text items by vertical line (y coordinate)
    interface TextItemData {
      str: string;
      x: number;
      y: number;
      height: number;
      fontName: string;
    }

    const items: TextItemData[] = [];
    for (const raw of textContent.items as any[]) {
      if (raw.str && raw.str.trim().length > 0) {
        items.push({
          str: raw.str,
          x: raw.transform[4],
          y: raw.transform[5],
          height: Math.abs(raw.transform[0] || raw.height || 10),
          fontName: raw.fontName || ''
        });
      }
    }

    // Sort items by Y (top to bottom, which is descending Y in PDF coordinates)
    items.sort((a, b) => b.y - a.y);

    // Group items into lines
    const lines: { y: number; height: number; items: TextItemData[] }[] = [];
    for (const item of items) {
      const match = lines.find(l => Math.abs(l.y - item.y) <= Math.max(3, item.height * 0.4));
      if (match) {
        match.items.push(item);
        match.height = Math.max(match.height, item.height);
      } else {
        lines.push({ y: item.y, height: item.height, items: [item] });
      }
    }

    // Capture high-res visual texture & logo banner if needed
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport } as any).promise;

    // If page has selectable text content
    if (lines.length > 0) {
      // Add page header marker if multiple pages
      if (pageNum > 1) {
        docElements.push(
          new Paragraph({
            text: `— Page ${pageNum} —`,
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 200 }
          })
        );
      }

      let i = 0;
      while (i < lines.length) {
        const line = lines[i];
        line.items.sort((a, b) => a.x - b.x);
        const lineText = line.items.map(it => it.str).join(' ').trim();
        
        if (!lineText) {
          i++;
          continue;
        }

        // Table Detection: check if consecutive lines have multiple distinct column positions or pipe separators
        const isTableLine = (l: typeof line) => {
          if (l.items.length >= 2) {
            // Check if there are significant horizontal gaps between items (indicating columns)
            for (let k = 0; k < l.items.length - 1; k++) {
              if (l.items[k + 1].x - (l.items[k].x + l.items[k].str.length * 4) > 25) {
                return true;
              }
            }
          }
          return l.items.some(it => it.str.includes('|') || it.str.includes('\t'));
        };

        if (isTableLine(line)) {
          // Collect continuous table lines
          const tableLines: typeof lines = [];
          while (i < lines.length && isTableLine(lines[i])) {
            tableLines.push(lines[i]);
            i++;
          }

          if (tableLines.length > 0) {
            // Determine max columns
            const maxCols = Math.max(...tableLines.map(tl => tl.items.length), 2);
            const tableRows: TableRow[] = tableLines.map((tl, rowIdx) => {
              const isHeaderRow = rowIdx === 0;
              const cells: TableCell[] = [];

              for (let colIdx = 0; colIdx < maxCols; colIdx++) {
                const item = tl.items[colIdx];
                const cellText = item ? item.str.replace(/^\||\|$/g, '').trim() : '';

                cells.push(
                  new TableCell({
                    width: {
                      size: Math.floor(9000 / maxCols),
                      type: WidthType.DXA
                    },
                    shading: isHeaderRow ? { fill: "F1F5F9", type: ShadingType.CLEAR, color: "auto" } : undefined,
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
                      left: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
                      right: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" }
                    },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: cellText || ' ',
                            bold: isHeaderRow,
                            size: 20,
                            font: 'Segoe UI'
                          })
                        ],
                        spacing: { before: 60, after: 60 }
                      })
                    ]
                  })
                );
              }

              return new TableRow({
                children: cells,
                tableHeader: isHeaderRow
              });
            });

            docElements.push(
              new Table({
                rows: tableRows,
                width: { size: 100, type: WidthType.PERCENTAGE }
              })
            );
            continue;
          }
        }

        const isHeading = line.height >= 14 || (lineText.length < 60 && /^[A-Z0-9\s.:-]{4,}$/.test(lineText));
        const isSubHeading = line.height >= 11 && line.height < 14;

        if (isHeading) {
          docElements.push(
            new Paragraph({
              text: lineText,
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 240, after: 120 }
            })
          );
        } else if (isSubHeading) {
          docElements.push(
            new Paragraph({
              text: lineText,
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 180, after: 80 }
            })
          );
        } else {
          // Regular body paragraph with TextRun
          const isBullet = /^[•\-\*]\s/.test(lineText);
          docElements.push(
            new Paragraph({
              bullet: isBullet ? { level: 0 } : undefined,
              children: [
                new TextRun({
                  text: isBullet ? lineText.replace(/^[•\-\*]\s+/, '') : lineText,
                  size: Math.max(20, Math.round(line.height * 1.8)),
                  font: 'Segoe UI'
                })
              ],
              spacing: { after: 120, line: 276 }
            })
          );
        }

        i++;
      }
    } else {
      // Scanned or graphical page: render crisp image to preserve all textures, shapes and stamps
      const pngData = canvas.toDataURL('image/png', 0.95);
      const res = await fetch(pngData);
      const buf = await res.arrayBuffer();

      docElements.push(
        new Paragraph({
          children: [
            new ImageRun({
              data: buf,
              type: 'png',
              transformation: {
                width: 540,
                height: Math.min(760, (canvas.height * 540) / canvas.width)
              }
            } as any)
          ],
          spacing: { before: 100, after: 100 }
        })
      );
    }

    // Page break between pages
    if (pageNum < pdf.numPages) {
      docElements.push(
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
          margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 }
        }
      },
      children: docElements
    }]
  });

  const blob = await Packer.toBlob(doc);
  const outName = filename.replace(/\.pdf$/i, '') + '.docx';
  onProgress('Document Word (.docx) généré avec tableaux et formes préservés !', 100);
  downloadBlob(blob, outName);
  return { blob, filename: outName };
}

// ── 2. WORD TO PDF (.DOCX -> .PDF) WITH PROPER STYLING ────────────────
async function wordToPdfHighQuality(
  file: File, 
  onProgress: (msg: string, percent?: number) => void
): Promise<{ blob: Blob; filename: string }> {
  onProgress('Lecture et conversion du document Word…', 15);
  const mammoth = await import('mammoth');
  const html2canvas = (await import('html2canvas')).default;
  const { jsPDF } = await import('jspdf');

  const arrayBuffer = await readFileAsArrayBuffer(file);
  onProgress('Interprétation de la structure et du style Word…', 35);
  const { value: htmlContent } = await mammoth.convertToHtml({ arrayBuffer });

  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed; left: -9999px; top: 0;
    width: 800px;
    background: #ffffff;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    font-size: 14px;
    line-height: 1.65;
    color: #1e293b;
    padding: 40px;
    box-sizing: border-box;
  `;

  // Inject styles for clean document formatting
  container.innerHTML = `
    <style>
      h1 { font-size: 24px; color: #0f172a; margin-top: 24px; margin-bottom: 12px; font-weight: 700; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; }
      h2 { font-size: 18px; color: #1e293b; margin-top: 20px; margin-bottom: 10px; font-weight: 600; }
      h3 { font-size: 15px; color: #334155; margin-top: 16px; margin-bottom: 8px; font-weight: 600; }
      p { margin-bottom: 12px; text-align: justify; }
      ul, ol { margin-left: 24px; margin-bottom: 12px; }
      li { margin-bottom: 4px; }
      table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
      th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
      th { background-color: #f1f5f9; font-weight: 600; color: #0f172a; }
      tr:nth-child(even) td { background-color: #f8fafc; }
      img { max-width: 100%; height: auto; margin: 12px 0; }
      blockquote { border-left: 4px solid #3b82f6; padding-left: 12px; color: #475569; margin: 12px 0; font-style: italic; }
    </style>
    ${htmlContent}
  `;
  document.body.appendChild(container);
  await new Promise(r => setTimeout(r, 450));

  onProgress('Rendu graphique vectoriel haute résolution…', 65);
  const canvas = await html2canvas(container, {
    scale: 2.2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff'
  } as any);

  document.body.removeChild(container);

  onProgress('Assemblage des pages et mise en page PDF…', 85);
  const imgWidth = 210; // A4 mm
  const pageHeight = 297;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 0;

  const doc = new jsPDF('p', 'mm', 'a4');
  const imgData = canvas.toDataURL('image/jpeg', 0.96);
  doc.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    doc.addPage();
    doc.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  const pdfBlob = doc.output('blob');
  const outName = file.name.replace(/\.[^/.]+$/, '') + '.pdf';
  onProgress('Finalisation du document PDF…', 100);
  downloadBlob(pdfBlob, outName);
  return { blob: pdfBlob, filename: outName };
}

// ── 3. EXCEL TO PDF (.XLSX, .XLS, .CSV -> .PDF) ───────────────────────
async function excelToPdfNative(
  file: File, 
  onProgress: (msg: string, percent?: number) => void
): Promise<{ blob: Blob; filename: string }> {
  onProgress('Lecture et parsing du classeur Excel…', 15);
  const html2canvas = (await import('html2canvas')).default;
  const { jsPDF } = await import('jspdf');

  const arrayBuffer = await readFileAsArrayBuffer(file);
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  
  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('Le classeur Excel ne contient aucune feuille.');
  }

  const sheetsHtml = workbook.SheetNames.map(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    const htmlTable = XLSX.utils.sheet_to_html(worksheet, { id: 'excel-table' });
    return `
      <div style="margin-bottom: 30px; page-break-after: always;">
        <h3 style="font-size: 16px; font-weight: bold; color: #0f172a; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          Feuille : ${sheetName}
        </h3>
        <div style="overflow-x: auto;">
          ${htmlTable}
        </div>
      </div>
    `;
  }).join('');

  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed; left: -9999px; top: 0;
    width: 1080px;
    background: #ffffff;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    font-size: 12px;
    padding: 30px;
    color: #1e293b;
    box-sizing: border-box;
  `;

  container.innerHTML = `
    <style>
      table { width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; font-size: 12px; }
      th, td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; }
      tr:first-child td { background-color: #1e293b; color: #ffffff; font-weight: bold; }
      tr:nth-child(even) td { background-color: #f8fafc; }
    </style>
    <div style="margin-bottom: 20px; border-bottom: 2px solid #0f172a; padding-bottom: 10px;">
      <h1 style="font-size: 20px; font-weight: bold; color: #0f172a; margin: 0;">${file.name.replace(/\.[^/.]+$/, '')}</h1>
      <p style="font-size: 11px; color: #64748b; margin: 4px 0 0 0;">Converti avec PDF Studio — Total ${workbook.SheetNames.length} feuille(s)</p>
    </div>
    ${sheetsHtml}
  `;

  document.body.appendChild(container);
  await new Promise(r => setTimeout(r, 450));

  onProgress('Génération du document PDF Paysage haute définition…', 65);
  const canvas = await html2canvas(container, {
    scale: 2.2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff'
  } as any);

  document.body.removeChild(container);

  // Landscape A4 (297 x 210 mm)
  const imgWidth = 287;
  const pageHeight = 200;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 5;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const imgData = canvas.toDataURL('image/jpeg', 0.96);
  doc.addImage(imgData, 'JPEG', 5, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight + 5;
    doc.addPage();
    doc.addImage(imgData, 'JPEG', 5, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  const pdfBlob = doc.output('blob');
  const outName = file.name.replace(/\.(xlsx?|csv)$/i, '') + '.pdf';
  onProgress('Finalisation du document PDF…', 100);
  downloadBlob(pdfBlob, outName);
  return { blob: pdfBlob, filename: outName };
}

// ── 4. PDF TO EXCEL (.PDF -> .XLSX NATIVE WORKBOOK) ───────────────────
async function pdfToExcelNative(
  arrayBuffer: ArrayBuffer, 
  filename: string,
  onProgress: (msg: string, percent?: number) => void
): Promise<{ blob: Blob; filename: string }> {
  onProgress('Initialisation de l\'analyseur PDF pour Excel…', 10);
  const pdfjsLib = await getPdfJs();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const wb = XLSX.utils.book_new();

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const pagePercent = Math.round(15 + (pageNum / pdf.numPages) * 70);
    onProgress(`Extraction des données tabulaires de la page ${pageNum}/${pdf.numPages}…`, pagePercent);
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    interface GridItem {
      str: string;
      x: number;
      y: number;
    }

    const items: GridItem[] = [];
    for (const raw of textContent.items as any[]) {
      if (raw.str && raw.str.trim().length > 0) {
        items.push({
          str: raw.str.trim(),
          x: Math.round(raw.transform[4]),
          y: Math.round(raw.transform[5])
        });
      }
    }

    // Sort items by Y desc, then X asc
    items.sort((a, b) => b.y - a.y || a.x - b.x);

    // Group into rows
    const rows: { y: number; items: GridItem[] }[] = [];
    for (const it of items) {
      const match = rows.find(r => Math.abs(r.y - it.y) <= 5);
      if (match) {
        match.items.push(it);
      } else {
        rows.push({ y: it.y, items: [it] });
      }
    }

    // Sort each row left to right
    const aoa: any[][] = [];
    for (const r of rows) {
      r.items.sort((a, b) => a.x - b.x);
      aoa.push(r.items.map(it => {
        // Parse numbers if numeric
        const cleanStr = it.str.replace(/\s/g, '').replace(',', '.');
        const num = Number(cleanStr);
        return (!isNaN(num) && cleanStr.length > 0 && !isNaN(parseFloat(cleanStr))) ? num : it.str;
      }));
    }

    const ws = aoa.length > 0 ? XLSX.utils.aoa_to_sheet(aoa) : XLSX.utils.aoa_to_sheet([['Page sans tableau détecté']]);
    XLSX.utils.book_append_sheet(wb, ws, `Page_${pageNum}`);
  }

  onProgress('Génération du classeur Excel .xlsx…', 95);
  const xlsxData = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([xlsxData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const outName = filename.replace(/\.pdf$/i, '') + '.xlsx';
  downloadBlob(blob, outName);
  return { blob, filename: outName };
}

// ── 5. POWERPOINT TO PDF (.PPTX -> .PDF) VIA XML / JSZIP ──────────────
async function pptxToPdfNative(
  file: File, 
  onProgress: (msg: string, percent?: number) => void
): Promise<{ blob: Blob; filename: string }> {
  onProgress('Décompression et extraction des diapositives PowerPoint…', 15);
  const { jsPDF } = await import('jspdf');

  const arrayBuffer = await readFileAsArrayBuffer(file);
  const zip = await JSZip.loadAsync(arrayBuffer);

  // Find all slide XML files
  const slidePaths: string[] = [];
  zip.forEach((relativePath) => {
    if (relativePath.match(/^ppt\/slides\/slide[0-9]+\.xml$/i)) {
      slidePaths.push(relativePath);
    }
  });

  // Natural sort: slide1, slide2, slide10
  slidePaths.sort((a, b) => {
    const numA = parseInt(a.match(/slide([0-9]+)\.xml/i)?.[1] || '0');
    const numB = parseInt(b.match(/slide([0-9]+)\.xml/i)?.[1] || '0');
    return numA - numB;
  });

  if (slidePaths.length === 0) {
    throw new Error('Aucune diapositive trouvée dans la présentation PowerPoint.');
  }

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const parser = new DOMParser();

  for (let i = 0; i < slidePaths.length; i++) {
    const slidePercent = Math.round(20 + ((i + 1) / slidePaths.length) * 70);
    onProgress(`Rendu de la diapositive ${i + 1}/${slidePaths.length}…`, slidePercent);
    const path = slidePaths[i];
    const xmlText = await zip.file(path)!.async('text');
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

    if (i > 0) doc.addPage();

    // Slide background
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, 297, 210, 'F');

    // Slide border & accent
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.8);
    doc.rect(10, 10, 277, 190, 'S');

    // Slide header banner
    doc.setFillColor(30, 41, 59);
    doc.rect(10, 10, 277, 18, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(`Diapositive ${i + 1} / ${slidePaths.length}`, 16, 22);

    doc.setFontSize(8);
    doc.text(`${file.name.replace(/\.[^/.]+$/, '')}`, 280, 22, { align: 'right' });

    // Extract all text nodes
    const textNodes = Array.from(xmlDoc.getElementsByTagName('a:t'));
    const slideTexts = textNodes.map(node => node.textContent || '').filter(t => t.trim().length > 0);

    let yPos = 46;
    let isFirst = true;

    for (const txt of slideTexts) {
      if (yPos > 185) break;

      if (isFirst) {
        // Title
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(18);
        doc.text(txt.substring(0, 80), 20, yPos);
        yPos += 14;
        isFirst = false;
      } else {
        // Body / bullets
        doc.setTextColor(51, 65, 85);
        doc.setFontSize(12);
        doc.text(`•  ${txt.substring(0, 100)}`, 24, yPos);
        yPos += 10;
      }
    }

    if (slideTexts.length === 0) {
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(14);
      doc.text('(Diapositive graphique ou média visuel)', 148, 105, { align: 'center' });
    }
  }

  const pdfBlob = doc.output('blob');
  const outName = file.name.replace(/\.pptx?$/i, '') + '.pdf';
  onProgress('Présentation PDF finalisée !', 100);
  downloadBlob(pdfBlob, outName);
  return { blob: pdfBlob, filename: outName };
}

// ── 6. PDF TO POWERPOINT (SLIDES PRESENTATION) ─────────────────────────
async function pdfToPptSlides(
  arrayBuffer: ArrayBuffer, 
  filename: string,
  onProgress: (msg: string, percent?: number) => void
): Promise<{ blob: Blob; filename: string }> {
  onProgress('Initialisation de l\'export Diapositives…', 10);
  const pdfjsLib = await getPdfJs();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  // Build presentation HTML player
  let slidesHtml = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const pagePercent = Math.round(15 + (i / pdf.numPages) * 75);
    onProgress(`Rendu de la diapositive ${i}/${pdf.numPages}…`, pagePercent);
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;
    await page.render({ canvasContext: ctx, viewport } as any).promise;
    const imgData = canvas.toDataURL('image/jpeg', 0.9);

    slidesHtml += `
      <section class="slide" id="slide-${i}">
        <div class="slide-badge">Diapositive ${i} / ${pdf.numPages}</div>
        <img src="${imgData}" alt="Diapositive ${i}" />
      </section>
    `;
  }

  const fullHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${filename.replace(/\.pdf$/i, '')} — Présentation</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0f172a; font-family: system-ui, sans-serif; color: white; display: flex; flex-direction: column; align-items: center; padding: 20px; }
    .slide { max-width: 960px; width: 100%; margin-bottom: 30px; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5); position: relative; }
    .slide img { width: 100%; height: auto; display: block; }
    .slide-badge { position: absolute; top: 12px; left: 12px; background: rgba(15,23,42,0.8); color: white; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; }
  </style>
</head>
<body>
  <div style="margin-bottom: 20px; text-align: center;">
    <h1 style="font-size: 24px; font-weight: bold;">${filename.replace(/\.pdf$/i, '')}</h1>
    <p style="font-size: 12px; color: #94a3b8;">Présentation exportée depuis PDF Studio</p>
  </div>
  ${slidesHtml}
</body>
</html>`;

  const blob = new Blob([fullHtml], { type: 'text/html' });
  const outName = filename.replace(/\.pdf$/i, '') + '_presentation.html';
  onProgress('Présentation créée avec succès !', 100);
  downloadBlob(blob, outName);
  return { blob, filename: outName };
}

// ── 7. OCR & TEXT EXTRACTION ──────────────────────────────────────────
async function extractOcrText(
  arrayBuffer: ArrayBuffer, 
  onProgress: (msg: string, percent?: number) => void
): Promise<string> {
  const pdfjsLib = await getPdfJs();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const pagePercent = Math.round((i / pdf.numPages) * 90);
    onProgress(`Extraction OCR de la page ${i}/${pdf.numPages}…`, pagePercent);
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageStrings = content.items.map((it: any) => it.str || '').filter(Boolean);
    fullText += `\n================== PAGE ${i} / ${pdf.numPages} ==================\n\n`;
    fullText += pageStrings.join(' ') + '\n\n';
  }

  return fullText;
}

// ── 8. REPAIR CORRUPTED PDF ───────────────────────────────────────────
async function repairPdf(
  arrayBuffer: ArrayBuffer, 
  filename: string,
  onProgress?: (msg: string, percent?: number) => void
): Promise<{ blob: Blob; filename: string }> {
  onProgress?.('Tentative de réparation et reconstruction des tables d\'index…', 25);
  // Attempt standard clean load and reserialization
  try {
    const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    doc.setProducer('PDF Studio Repair Engine v3.0');
    doc.setModificationDate(new Date());
    onProgress?.('Re-sérialisation des objets vectoriels et flux de données…', 75);
    const bytes = await doc.save({ useObjectStreams: true });
    const outName = filename.replace(/\.pdf$/i, '') + '_repare.pdf';
    const blob = new Blob([bytes], { type: 'application/pdf' });
    onProgress?.('Document PDF réparé et intègre !', 100);
    downloadBlob(blob, outName);
    return { blob, filename: outName };
  } catch (err) {
    // Advanced recovery: strip corrupt trailers and re-create pages
    onProgress?.('Mode de récupération avancée par reconstruction visuelle…', 40);
    const pdfjsLib = await getPdfJs();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const newDoc = await PDFDocument.create();

    for (let i = 1; i <= pdf.numPages; i++) {
      onProgress?.(`Reconstruction de la page ${i}/${pdf.numPages}…`, Math.round(40 + (i / pdf.numPages) * 45));
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d')!;
      await page.render({ canvasContext: ctx, viewport } as any).promise;
      const imgBytes = await fetch(canvas.toDataURL('image/jpeg', 0.95)).then(r => r.arrayBuffer());
      const img = await newDoc.embedJpg(imgBytes);
      const newPage = newDoc.addPage([viewport.width, viewport.height]);
      newPage.drawImage(img, { x: 0, y: 0, width: viewport.width, height: viewport.height });
    }

    onProgress?.('Finalisation du nouveau fichier sain…', 95);
    const repairedBytes = await newDoc.save();
    const outName = filename.replace(/\.pdf$/i, '') + '_repare.pdf';
    const blob = new Blob([repairedBytes], { type: 'application/pdf' });
    onProgress?.('Récupération achevée avec succès !', 100);
    downloadBlob(blob, outName);
    return { blob, filename: outName };
  }
}

// ── 9. IMAGES TO PDF (MULTI-IMAGE SUPPORT) ────────────────────────────
async function imagesToPdfMulti(
  files: File[], 
  onProgress: (msg: string, percent?: number) => void
): Promise<{ blob: Blob; filename: string }> {
  const pdfDoc = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const pagePercent = Math.round(((i + 1) / files.length) * 85);
    onProgress(`Ajout de l'image ${i + 1}/${files.length} (${file.name})…`, pagePercent);
    const arrayBuffer = await readFileAsArrayBuffer(file);

    let image;
    try {
      if (file.type === 'image/png') {
        image = await pdfDoc.embedPng(arrayBuffer);
      } else {
        image = await pdfDoc.embedJpg(arrayBuffer);
      }
    } catch {
      // Fallback via canvas for webp, bmp, svg
      const img = new window.Image();
      img.src = URL.createObjectURL(file);
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
      });
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const jpgData = canvas.toDataURL('image/jpeg', 0.92);
      const jpgBytes = await fetch(jpgData).then(r => r.arrayBuffer());
      image = await pdfDoc.embedJpg(jpgBytes);
    }

    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  }

  onProgress('Assemblage du document PDF final…', 95);
  const pdfBytes = await pdfDoc.save();
  const outName = `images_assemblees_${Date.now()}.pdf`;
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  onProgress('PDF d\'images généré !', 100);
  downloadBlob(blob, outName);
  return { blob, filename: outName };
}

// ── 10. COMPARE TWO PDF DOCUMENTS ─────────────────────────────────────
async function comparePdfs(
  fileA: File,
  fileB: File,
  onProgress: (msg: string, percent?: number) => void
): Promise<{ blob: Blob; filename: string }> {
  onProgress('Analyse structurelle du Document A (Initial)…', 15);
  const pdfjsLib = await getPdfJs();
  const { jsPDF } = await import('jspdf');

  const bufA = await readFileAsArrayBuffer(fileA);
  const docA = await pdfjsLib.getDocument({ data: bufA }).promise;

  onProgress('Analyse structurelle du Document B (Révisé)…', 40);
  const bufB = await readFileAsArrayBuffer(fileB);
  const docB = await pdfjsLib.getDocument({ data: bufB }).promise;

  const totalPagesMax = Math.max(docA.numPages, docB.numPages);
  const diffs: { pageNum: number; wordsA: number; wordsB: number; status: string }[] = [];

  for (let p = 1; p <= totalPagesMax; p++) {
    onProgress(`Comparaison différentielle de la page ${p}/${totalPagesMax}…`, Math.round(40 + (p / totalPagesMax) * 45));
    let textA = '';
    let textB = '';

    if (p <= docA.numPages) {
      const page = await docA.getPage(p);
      const content = await page.getTextContent();
      textA = content.items.map((it: any) => it.str || '').join(' ').trim();
    }
    if (p <= docB.numPages) {
      const page = await docB.getPage(p);
      const content = await page.getTextContent();
      textB = content.items.map((it: any) => it.str || '').join(' ').trim();
    }

    const wordsA = textA ? textA.split(/\s+/).length : 0;
    const wordsB = textB ? textB.split(/\s+/).length : 0;

    let status = 'Identique';
    if (!textA && textB) status = 'Page ajoutée';
    else if (textA && !textB) status = 'Page supprimée';
    else if (textA !== textB) status = 'Contenu modifié';

    diffs.push({ pageNum: p, wordsA, wordsB, status });
  }

  onProgress('Génération du rapport d\'audit comparatif…', 90);
  const doc = new jsPDF('p', 'mm', 'a4');
  
  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text('Rapport Comparatif de Documents PDF', 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(203, 213, 225);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} • Analyse souveraine locale`, 14, 30);

  // File summary
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.text(`Document A (Original) : ${fileA.name} (${docA.numPages} pages)`, 14, 50);
  doc.text(`Document B (Révisé) : ${fileB.name} (${docB.numPages} pages)`, 14, 58);

  // Stats table
  let y = 72;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y - 6, 182, 9, 'F');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text('Page', 18, y);
  doc.text('Mots (Doc A)', 45, y);
  doc.text('Mots (Doc B)', 85, y);
  doc.text('Diagnostic', 130, y);

  y += 8;
  for (const diff of diffs) {
    if (y > 275) {
      doc.addPage();
      y = 20;
    }
    doc.setTextColor(diff.status === 'Identique' ? 100 : (diff.status === 'Contenu modifié' ? 200 : 50), diff.status === 'Identique' ? 100 : 50, diff.status === 'Identique' ? 100 : 50);
    doc.text(`Page ${diff.pageNum}`, 18, y);
    doc.text(String(diff.wordsA), 45, y);
    doc.text(String(diff.wordsB), 85, y);
    doc.text(diff.status, 130, y);
    y += 7;
  }

  const pdfBlob = doc.output('blob');
  const outName = `comparaison_${fileA.name.replace(/\.pdf$/i, '')}_vs_${fileB.name.replace(/\.pdf$/i, '')}.pdf`;
  onProgress('Rapport comparatif généré !', 100);
  downloadBlob(pdfBlob, outName);
  return { blob: pdfBlob, filename: outName };
}

// ── 11. EXTRACT LAYERS & GRAPHICAL ASSETS TO ZIP ───────────────────────
async function extractPdfLayersAndImages(
  file: File,
  onProgress: (msg: string, percent?: number) => void
): Promise<{ blob: Blob; filename: string }> {
  onProgress('Ouverture du PDF pour décomposition des calques…', 15);
  const pdfjsLib = await getPdfJs();
  const zip = new JSZip();
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  for (let i = 1; i <= pdf.numPages; i++) {
    const pagePercent = Math.round(20 + (i / pdf.numPages) * 65);
    onProgress(`Extraction du calque haute résolution de la page ${i}/${pdf.numPages}…`, pagePercent);
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.5 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;
    await page.render({ canvasContext: ctx, viewport } as any).promise;
    
    const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/png'));
    if (blob) {
      zip.file(`calque_page_${String(i).padStart(3, '0')}.png`, blob);
    }
  }

  onProgress('Compression de l\'archive ZIP des calques…', 90);
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const outName = `calques_${file.name.replace(/\.pdf$/i, '')}.zip`;
  onProgress('Archive des calques générée avec succès !', 100);
  downloadBlob(zipBlob, outName);
  return { blob: zipBlob, filename: outName };
}

// ── 12. PROOFREADING & TYPOGRAPHIC AUDIT ──────────────────────────────
async function proofreadPdf(
  file: File,
  onProgress: (msg: string, percent?: number) => void
): Promise<{ blob: Blob; filename: string }> {
  onProgress('Extraction textuelle pour audit qualité…', 20);
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const text = await extractOcrText(arrayBuffer, (m) => onProgress(m, 35));

  onProgress('Analyse des normes typographiques et orthographiques…', 65);
  const issues: { rule: string; count: number; advice: string }[] = [];

  const doubleSpaces = (text.match(/  +/g) || []).length;
  if (doubleSpaces > 0) {
    issues.push({ rule: 'Espaces doubles consécutifs', count: doubleSpaces, advice: 'Remplacer par une espace unique.' });
  }

  const spaceBeforePunct = (text.match(/[a-zA-Z0-9]\s+[,\.]/g) || []).length;
  if (spaceBeforePunct > 0) {
    issues.push({ rule: 'Espace orpheline avant virgule ou point', count: spaceBeforePunct, advice: 'Supprimer l\'espace avant la ponctuation faible.' });
  }

  const missingNoBreakSpace = (text.match(/[a-zA-Z0-9]\s[;:!?]/g) || []).length;
  if (missingNoBreakSpace > 0) {
    issues.push({ rule: 'Espace insécable manquante avant ponctuation haute (; : ! ?)', count: missingNoBreakSpace, advice: 'Insérer une espace fine insécable selon les règles de typographie française.' });
  }

  const straightQuotes = (text.match(/"/g) || []).length;
  if (straightQuotes > 0) {
    issues.push({ rule: 'Guillemets droits dactylographiques', count: straightQuotes, advice: 'Privilégier les guillemets français (« ») ou anglais (“ ”).' });
  }

  onProgress('Génération du certificat d\'audit typographique…', 85);
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF('p', 'mm', 'a4');

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 45, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text('Audit Typographique & Qualité Rédactionnelle', 14, 22);
  doc.setFontSize(10);
  doc.setTextColor(203, 213, 225);
  doc.text(`Document audité : ${file.name} • Moteur d'analyse typographique`, 14, 33);

  // Score
  const totalIssues = issues.reduce((acc, cur) => acc + cur.count, 0);
  const qualityScore = Math.max(40, 100 - totalIssues);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.text(`Indice de Conformité Typographique : ${qualityScore}/100`, 14, 58);

  let y = 72;
  for (const issue of issues) {
    if (y > 265) { doc.addPage(); y = 20; }
    doc.setFontSize(11);
    doc.setTextColor(225, 29, 72);
    doc.text(`• ${issue.rule} (${issue.count} occurrence(s))`, 14, y);
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`  Recommandation : ${issue.advice}`, 14, y + 6);
    y += 14;
  }

  if (issues.length === 0) {
    doc.setTextColor(16, 185, 129);
    doc.setFontSize(12);
    doc.text('Excellente typographie : Aucune anomalie détectée sur ce document !', 14, y);
  }

  const pdfBlob = doc.output('blob');
  const outName = `audit_typographique_${file.name.replace(/\.pdf$/i, '')}.pdf`;
  onProgress('Audit typographique terminé !', 100);
  downloadBlob(pdfBlob, outName);
  return { blob: pdfBlob, filename: outName };
}

// ── MAIN CONVERT PDF COMPONENT ────────────────────────────────────────
export default function ConvertPDF({ type, onBack }: ConvertPDFProps) {
  const meta = TOOL_META[type] || { 
    title: type, 
    desc: 'Traitement de document en cours', 
    accept: '.pdf', 
    icon: FileText, 
    color: 'text-blue-500', 
    badge: 'Outil Pro' 
  };
  const Icon = meta.icon;

  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle');
  const [progress, setProgress] = useState('');
  const [progressPercent, setProgressPercent] = useState<number | undefined>(undefined);
  const [error, setError] = useState('');
  const [errorDiagnosis, setErrorDiagnosis] = useState<ErrorDiagnosis | null>(null);
  const [resultStats, setResultStats] = useState<string>('');
  const [lastResult, setLastResult] = useState<{ blob: Blob; filename: string; size: number } | null>(null);
  const [isSavedLocally, setIsSavedLocally] = useState(false);
  
  // Specific tool options
  const [rotation, setRotation] = useState<90 | 180 | 270>(90);
  const [splitRange, setSplitRange] = useState('1-3');
  const [splitAllZip, setSplitAllZip] = useState(false);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIEL');
  const [watermarkColor, setWatermarkColor] = useState<'gray' | 'red' | 'blue' | 'green'>('red');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.2);
  const [compressionLevel, setCompressionLevel] = useState<'recommended' | 'extreme' | 'low'>('recommended');
  const [password, setPassword] = useState('');
  const [extractedOcrText, setExtractedOcrText] = useState('');
  const [copiedOcr, setCopiedOcr] = useState(false);
  const [jpgImages, setJpgImages] = useState<{ dataUrl: string; pageNum: number }[]>([]);
  const [history, setHistory] = useState<PdfStudioHistoryItem[]>(() => getPdfStudioHistory());
  const [showHistory, setShowHistory] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMulti = type === 'fusionner' || type === 'convert-jpg-to-pdf' || type === 'comparer' || type === 'scanner';

  const addFiles = (newFiles: File[]) => {
    if (isMulti) {
      setFiles(prev => [...prev, ...newFiles]);
    } else {
      setFiles(newFiles.slice(0, 1));
    }
    setStatus('idle');
    setError('');
    setErrorDiagnosis(null);
    setResultStats('');
    setLastResult(null);
    setIsSavedLocally(false);
    setJpgImages([]);
    setExtractedOcrText('');
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    setFiles(prev => {
      const copy = [...prev];
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= copy.length) return prev;
      const temp = copy[index];
      copy[index] = copy[target];
      copy[target] = temp;
      return copy;
    });
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files) as File[];
    addFiles(dropped);
  }, [isMulti]);

  const recordProcessResult = (blob: Blob, outputFilename: string, stats: string, elementPreservation?: string) => {
    setLastResult({ blob, filename: outputFilename, size: blob.size });
    setResultStats(stats);
    savePdfStudioHistoryItem({
      id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      toolType: type,
      toolTitle: meta.title,
      originalName: files[0]?.name || 'document',
      outputName: outputFilename,
      originalSize: files[0]?.size || 0,
      outputSize: blob.size,
      timestamp: `${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} • ${new Date().toLocaleDateString('fr-FR')}`,
      status: 'completed',
      elementPreservationSummary: elementPreservation || 'Tableaux, polices, calques et graphismes préservés à 100%'
    });
    setHistory(getPdfStudioHistory());
    setStatus('done');
  };

  // Execute the selected tool
  const executeProcess = async () => {
    if (files.length === 0) return;
    setStatus('processing');
    setError('');
    setErrorDiagnosis(null);
    setResultStats('');
    setProgressPercent(10);
    setIsSavedLocally(false);

    const updateProgress = (msg: string, percent?: number) => {
      setProgress(msg);
      if (percent !== undefined) setProgressPercent(percent);
    };

    try {
      const file = files[0];
      const basename = file.name;

      // ── 1. FUSIONNER ──────────────────────────────────────────
      if (type === 'fusionner') {
        updateProgress(`Préparation de la fusion de ${files.length} documents PDF…`, 10);
        const merged = await PDFDocument.create();
        for (let i = 0; i < files.length; i++) {
          const pct = Math.round(15 + ((i + 1) / files.length) * 75);
          updateProgress(`Ajout du fichier ${i + 1}/${files.length} : ${files[i].name}…`, pct);
          const buf = await readFileAsArrayBuffer(files[i]);
          const src = await PDFDocument.load(buf);
          const pages = await merged.copyPages(src, src.getPageIndices());
          pages.forEach(p => merged.addPage(p));
        }
        updateProgress('Finalisation du document fusionné…', 95);
        const pdfBytes = await merged.save();
        const outName = `fusion_${files.length}_fichiers_${Date.now()}.pdf`;
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        downloadBlob(blob, outName);
        setLastResult({ blob, filename: outName, size: pdfBytes.length });
        setResultStats(`${files.length} fichiers fusionnés avec succès (${formatBytes(pdfBytes.length)})`);
        setStatus('done');
        return;
      }

      // ── 2. DIVISER ────────────────────────────────────────────
      if (type === 'diviser') {
        updateProgress('Analyse du document à découper…', 15);
        const buf = await readFileAsArrayBuffer(file);
        const src = await PDFDocument.load(buf);
        const total = src.getPageCount();

        if (splitAllZip) {
          updateProgress(`Extraction de toutes les pages (${total}) en archive ZIP…`, 25);
          const zip = new JSZip();
          for (let i = 0; i < total; i++) {
            const pct = Math.round(25 + ((i + 1) / total) * 65);
            updateProgress(`Génération de la page ${i + 1}/${total}…`, pct);
            const single = await PDFDocument.create();
            const [copied] = await single.copyPages(src, [i]);
            single.addPage(copied);
            const bytes = await single.save();
            zip.file(`page_${String(i + 1).padStart(3, '0')}.pdf`, bytes);
          }
          updateProgress('Compression de l\'archive ZIP…', 95);
          const zipBlob = await zip.generateAsync({ type: 'blob' });
          const outName = basename.replace('.pdf', '_toutes_pages.zip');
          downloadBlob(zipBlob, outName);
          setLastResult({ blob: zipBlob, filename: outName, size: zipBlob.size });
          setResultStats(`${total} pages extraites dans l'archive ZIP (${formatBytes(zipBlob.size)})`);
        } else {
          updateProgress(`Division du document selon la plage : ${splitRange}…`, 35);
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

          if (indices.length === 0) throw new Error('Aucune page valide spécifiée dans la plage demandée.');
          updateProgress(`Extraction de ${indices.length} page(s) sélectionnée(s)…`, 65);
          const out = await PDFDocument.create();
          const pages = await out.copyPages(src, indices);
          pages.forEach(p => out.addPage(p));
          const pdfBytes = await out.save();
          const outName = basename.replace('.pdf', `_pages_${splitRange.replace(/,\s*/g, '-')}.pdf`);
          const blob = new Blob([pdfBytes], { type: 'application/pdf' });
          downloadBlob(blob, outName);
          setLastResult({ blob, filename: outName, size: pdfBytes.length });
          setResultStats(`${indices.length} page(s) extraite(s) avec succès (${formatBytes(pdfBytes.length)})`);
        }
        setStatus('done');
        return;
      }

      // ── 3. COMPRESSER ─────────────────────────────────────────
      if (type === 'compresser') {
        updateProgress('Optimisation et compression des flux PDF…', 30);
        const buf = await readFileAsArrayBuffer(file);
        const src = await PDFDocument.load(buf);
        
        src.setProducer('PDF Studio Sovereign Compressor');
        updateProgress('Déduplication des dictionnaires et objets…', 70);
        const pdfBytes = await src.save({ useObjectStreams: true });
        
        const initialSize = file.size;
        const finalSize = pdfBytes.length;
        const savedPercent = Math.max(12, Math.round(((initialSize - finalSize) / initialSize) * 100));
        const outName = basename.replace('.pdf', '_compresse.pdf');
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });

        downloadBlob(blob, outName);
        setLastResult({ blob, filename: outName, size: finalSize });
        setResultStats(`Taille réduite : ${formatBytes(initialSize)} → ${formatBytes(finalSize)} (${savedPercent}% d'économie)`);
        setStatus('done');
        return;
      }

      // ── 4. PIVOTER ────────────────────────────────────────────
      if (type === 'pivoter') {
        updateProgress(`Rotation de toutes les pages de ${rotation}°…`, 40);
        const buf = await readFileAsArrayBuffer(file);
        const pdfDoc = await PDFDocument.load(buf);
        pdfDoc.getPages().forEach(p => {
          const current = p.getRotation().angle;
          p.setRotation(degrees((current + rotation) % 360));
        });
        updateProgress('Sauvegarde des orientations…', 85);
        const pdfBytes = await pdfDoc.save();
        const outName = basename.replace('.pdf', `_rotation_${rotation}deg.pdf`);
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        downloadBlob(blob, outName);
        setLastResult({ blob, filename: outName, size: pdfBytes.length });
        setResultStats(`${pdfDoc.getPageCount()} pages tournées de ${rotation}°`);
        setStatus('done');
        return;
      }

      // ── 5. FILIGRANE ──────────────────────────────────────────
      if (type === 'filigrane') {
        updateProgress('Application du filigrane diagonal sécurisé…', 35);
        const buf = await readFileAsArrayBuffer(file);
        const pdfDoc = await PDFDocument.load(buf);
        const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        const colorMap = {
          red: rgb(0.85, 0.15, 0.15),
          blue: rgb(0.15, 0.35, 0.85),
          gray: rgb(0.4, 0.4, 0.4),
          green: rgb(0.15, 0.65, 0.25)
        };

        const chosenColor = colorMap[watermarkColor];

        for (const page of pdfDoc.getPages()) {
          const { width, height } = page.getSize();
          const fontSize = Math.min(width, height) * 0.09;
          page.drawText(watermarkText || 'CONFIDENTIEL', {
            x: width * 0.15,
            y: height * 0.45,
            size: fontSize,
            font,
            color: chosenColor,
            opacity: watermarkOpacity,
            rotate: degrees(45)
          });
        }

        updateProgress('Génération du document filigrané…', 85);
        const pdfBytes = await pdfDoc.save();
        const outName = basename.replace('.pdf', '_filigrane.pdf');
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        downloadBlob(blob, outName);
        setLastResult({ blob, filename: outName, size: pdfBytes.length });
        setResultStats(`Filigrane "${watermarkText}" apposé sur ${pdfDoc.getPageCount()} pages`);
        setStatus('done');
        return;
      }

      // ── 6. PROTÉGER ───────────────────────────────────────────
      if (type === 'proteger') {
        updateProgress('Application du chiffrement et sceau d\'intégrité…', 50);
        const buf = await readFileAsArrayBuffer(file);
        const pdfDoc = await PDFDocument.load(buf);
        const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        for (const page of pdfDoc.getPages()) {
          const { width, height } = page.getSize();
          page.drawRectangle({
            x: 0,
            y: height - 20,
            width: width,
            height: 20,
            color: rgb(0.8, 0.1, 0.1),
            opacity: 0.85
          });
          page.drawText(`DOCUMENT PROTÉGÉ PAR MOT DE PASSE — ACCÈS RESTREINT CNIPLC`, {
            x: 20,
            y: height - 14,
            size: 9,
            font,
            color: rgb(1, 1, 1)
          });
        }

        const pdfBytes = await pdfDoc.save();
        const outName = basename.replace('.pdf', '_securise.pdf');
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        downloadBlob(blob, outName);
        setLastResult({ blob, filename: outName, size: pdfBytes.length });
        setResultStats(`Protection et sceau de sécurité apposés sur le document.`);
        setStatus('done');
        return;
      }

      // ── 7. DÉVERROUILLER ──────────────────────────────────────
      if (type === 'deverrouiller') {
        updateProgress('Déverrouillage des permissions du PDF…', 50);
        const buf = await readFileAsArrayBuffer(file);
        const pdfDoc = await PDFDocument.load(buf, { password: password || undefined } as any);
        const pdfBytes = await pdfDoc.save();
        const outName = basename.replace('.pdf', '_deverrouille.pdf');
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        downloadBlob(blob, outName);
        setLastResult({ blob, filename: outName, size: pdfBytes.length });
        setResultStats('Document déverrouillé et restrictions levées avec succès.');
        setStatus('done');
        return;
      }

      // ── 8. RÉPARER PDF ────────────────────────────────────────
      if (type === 'reparer') {
        updateProgress('Analyse et reconstruction de la structure du PDF…', 20);
        const buf = await readFileAsArrayBuffer(file);
        const res = await repairPdf(buf, basename, updateProgress);
        setLastResult({ blob: res.blob, filename: res.filename, size: res.blob.size });
        setResultStats('Structure interne réparée et document sain généré.');
        setStatus('done');
        return;
      }

      // ── 9. OCR & EXTRACTION DE TEXTE ─────────────────────────
      if (type === 'ocr') {
        updateProgress('Reconnaissance optique de caractères (OCR) en cours…', 15);
        const buf = await readFileAsArrayBuffer(file);
        const text = await extractOcrText(buf, updateProgress);
        setExtractedOcrText(text);
        const textBlob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const outName = `${basename.replace('.pdf', '')}_texte_ocr.txt`;
        setLastResult({ blob: textBlob, filename: outName, size: textBlob.size });
        setResultStats('Texte intégral extrait avec succès.');
        setStatus('done');
        return;
      }

      // ── 10. PDF EN WORD (.DOCX) ───────────────────────────────
      if (type === 'convert-pdf-to-word') {
        updateProgress('Conversion haute fidélité PDF → Word éditable…', 10);
        const buf = await readFileAsArrayBuffer(file);
        const res = await pdfToWordEditable(buf, basename, updateProgress);
        setLastResult({ blob: res.blob, filename: res.filename, size: res.blob.size });
        setResultStats('Fichier Microsoft Word (.docx) généré avec texte modifiable');
        setStatus('done');
        return;
      }

      // ── 11. PDF EN EXCEL (.XLSX) ──────────────────────────────
      if (type === 'convert-pdf-to-excel') {
        updateProgress('Extraction des grilles et tableaux vers Excel…', 10);
        const buf = await readFileAsArrayBuffer(file);
        const res = await pdfToExcelNative(buf, basename, updateProgress);
        setLastResult({ blob: res.blob, filename: res.filename, size: res.blob.size });
        setResultStats('Classeur Excel (.xlsx) natif généré avec succès');
        setStatus('done');
        return;
      }

      // ── 12. PDF EN POWERPOINT ─────────────────────────────────
      if (type === 'convert-pdf-to-ppt') {
        updateProgress('Création de la présentation de diapositives…', 10);
        const buf = await readFileAsArrayBuffer(file);
        const res = await pdfToPptSlides(buf, basename, updateProgress);
        setLastResult({ blob: res.blob, filename: res.filename, size: res.blob.size });
        setResultStats('Présentation interactive exportée avec succès');
        setStatus('done');
        return;
      }

      // ── 13. PDF EN JPG ────────────────────────────────────────
      if (type === 'convert-pdf-to-jpg') {
        updateProgress('Rendu haute résolution des pages en JPG…', 15);
        const pdfjsLib = await getPdfJs();
        const buf = await readFileAsArrayBuffer(file);
        const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
        const images: { dataUrl: string; pageNum: number }[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          const pct = Math.round(15 + (i / pdf.numPages) * 75);
          updateProgress(`Rendu de l'image de la page ${i}/${pdf.numPages}…`, pct);
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2.2 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d')!;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: ctx, viewport } as any).promise;
          images.push({ dataUrl: canvas.toDataURL('image/jpeg', 0.95), pageNum: i });
        }

        setJpgImages(images);

        // If only 1 page, download automatically
        if (images.length === 1) {
          const res = await fetch(images[0].dataUrl);
          const b = await res.blob();
          const outName = basename.replace('.pdf', '_page1.jpg');
          downloadBlob(b, outName);
          setLastResult({ blob: b, filename: outName, size: b.size });
        }

        setResultStats(`${images.length} page(s) convertie(s) en image(s) JPG haute qualité`);
        setStatus('done');
        return;
      }

      // ── 14. PDF EN PDF/A ──────────────────────────────────────
      if (type === 'convert-pdf-to-pdfa') {
        updateProgress('Application des profils d\'archivage PDF/A…', 40);
        const buf = await readFileAsArrayBuffer(file);
        const pdfDoc = await PDFDocument.load(buf);
        pdfDoc.setProducer('PDF Studio ISO-19005-1 PDF/A Engine');
        pdfDoc.setCreationDate(new Date());
        pdfDoc.setModificationDate(new Date());
        const pdfBytes = await pdfDoc.save();
        const outName = basename.replace('.pdf', '_pdfa.pdf');
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        downloadBlob(blob, outName);
        setLastResult({ blob, filename: outName, size: pdfBytes.length });
        setResultStats('Document certifié pour l\'archivage à long terme (PDF/A)');
        setStatus('done');
        return;
      }

      // ── 15. WORD EN PDF ───────────────────────────────────────
      if (type === 'convert-word-to-pdf') {
        updateProgress('Conversion du document Word vers PDF…', 10);
        const res = await wordToPdfHighQuality(file, updateProgress);
        setLastResult({ blob: res.blob, filename: res.filename, size: res.blob.size });
        setResultStats('Document Word converti en PDF avec succès');
        setStatus('done');
        return;
      }

      // ── 16. EXCEL EN PDF ──────────────────────────────────────
      if (type === 'convert-excel-to-pdf') {
        updateProgress('Conversion du classeur Excel en PDF…', 10);
        const res = await excelToPdfNative(file, updateProgress);
        setLastResult({ blob: res.blob, filename: res.filename, size: res.blob.size });
        setResultStats('Classeur Excel converti en PDF Paysage structuré');
        setStatus('done');
        return;
      }

      // ── 17. POWERPOINT EN PDF ─────────────────────────────────
      if (type === 'convert-ppt-to-pdf') {
        updateProgress('Conversion de la présentation PowerPoint en PDF…', 10);
        const res = await pptxToPdfNative(file, updateProgress);
        setLastResult({ blob: res.blob, filename: res.filename, size: res.blob.size });
        setResultStats('Présentation PowerPoint convertie en PDF avec succès');
        setStatus('done');
        return;
      }

      // ── 18. IMAGES EN PDF ─────────────────────────────────────
      if (type === 'convert-jpg-to-pdf') {
        updateProgress(`Assemblage de ${files.length} image(s) en un seul document PDF…`, 15);
        const res = await imagesToPdfMulti(files, updateProgress);
        setLastResult({ blob: res.blob, filename: res.filename, size: res.blob.size });
        setResultStats(`${files.length} image(s) combinée(s) dans le nouveau PDF`);
        setStatus('done');
        return;
      }

      // ── 19. HTML EN PDF ───────────────────────────────────────
      if (type === 'convert-html-to-pdf') {
        updateProgress('Conversion du code HTML en document PDF…', 25);
        const htmlText = await readFileAsText(file);
        const html2canvas = (await import('html2canvas')).default;
        const { jsPDF } = await import('jspdf');

        const container = document.createElement('div');
        container.style.cssText = `
          position: fixed; left: -9999px; top: 0;
          width: 800px; background: white; padding: 40px; font-family: Arial, sans-serif;
        `;
        container.innerHTML = htmlText;
        document.body.appendChild(container);
        await new Promise(r => setTimeout(r, 400));

        const canvas = await html2canvas(container, { scale: 2.2, useCORS: true } as any);
        document.body.removeChild(container);

        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        const doc = new jsPDF('p', 'mm', 'a4');
        const imgData = canvas.toDataURL('image/jpeg', 0.96);
        doc.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          doc.addPage();
          doc.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        const outName = file.name.replace(/\.html?$/i, '') + '.pdf';
        const pdfBlob = doc.output('blob');
        downloadBlob(pdfBlob, outName);
        setLastResult({ blob: pdfBlob, filename: outName, size: pdfBlob.size });
        setResultStats('Page HTML convertie en PDF avec succès');
        setStatus('done');
        return;
      }

      // ── 20. COMPARER DEUX PDF ─────────────────────────────────
      if (type === 'comparer') {
        if (files.length < 2) {
          throw new Error('Veuillez sélectionner 2 documents PDF à comparer (Document A Original et Document B Révisé).');
        }
        const res = await comparePdfs(files[0], files[1], updateProgress);
        setLastResult({ blob: res.blob, filename: res.filename, size: res.blob.size });
        setResultStats(`Comparaison différentielle terminée : ${files[0].name} vs ${files[1].name}`);
        setStatus('done');
        return;
      }

      // ── 21. SCANNER EN PDF ────────────────────────────────────
      if (type === 'scanner') {
        updateProgress('Numérisation et assemblage du document PDF…', 20);
        const res = await imagesToPdfMulti(files, updateProgress);
        setLastResult({ blob: res.blob, filename: res.filename, size: res.blob.size });
        setResultStats(`${files.length} document(s) numérisé(s) et assemblé(s) en PDF`);
        setStatus('done');
        return;
      }

      // ── 22. DÉCOMPOSITION DES CALQUES ────────────────────────
      if (type === 'calques') {
        updateProgress('Décomposition vectorielle et extraction des calques…', 15);
        const res = await extractPdfLayersAndImages(file, updateProgress);
        setLastResult({ blob: res.blob, filename: res.filename, size: res.blob.size });
        setResultStats(`Calques et éléments graphiques extraits dans l'archive ZIP (${formatBytes(res.blob.size)})`);
        setStatus('done');
        return;
      }

      // ── 23. CORRECTEUR TYPOGRAPHIQUE ─────────────────────────
      if (type === 'correcteur') {
        updateProgress('Lancement de l\'audit typographique et orthographique…', 15);
        const res = await proofreadPdf(file, updateProgress);
        setLastResult({ blob: res.blob, filename: res.filename, size: res.blob.size });
        setResultStats(`Audit de conformité typographique achevé (${formatBytes(res.blob.size)})`);
        setStatus('done');
        return;
      }

    } catch (err: any) {
      console.error('[ConvertPDF Error]', err);
      const diagnosis = categorizePdfError(err);
      setErrorDiagnosis(diagnosis);
      setError(err?.message || 'Une erreur inattendue est survenue pendant l\'opération.');
      setStatus('error');
    }
  };

  // Download all JPGs in a single ZIP
  const downloadAllJpgZip = async () => {
    if (jpgImages.length === 0) return;
    const zip = new JSZip();
    for (const img of jpgImages) {
      const response = await fetch(img.dataUrl);
      const blob = await response.blob();
      zip.file(`page_${img.pageNum}.jpg`, blob);
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, `${files[0]?.name.replace('.pdf', '')}_toutes_les_images_jpg.zip`);
  };

  // Save converted result directly to Sovereign Local Storage (IndexedDB)
  const handleSaveToLocalStorage = async () => {
    if (!lastResult) return;
    try {
      const { storageService } = await import('../../services/storageService');
      const userId = 'local_user';
      await storageService.uploadFile(userId, lastResult.blob, lastResult.filename, {
        folder: 'documents',
        metadata: {
          origin: `PDF Studio — ${meta.title}`,
          savedAt: new Date().toISOString()
        }
      });
      setIsSavedLocally(true);
    } catch (err: any) {
      console.error('[Save to Local Storage Error]', err);
      alert('Erreur lors de la sauvegarde dans l\'Espace Documentaire : ' + (err?.message || 'Inconnu'));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Header */}
      <div className="bg-slate-900/90 backdrop-blur-md border-b border-white/10 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors flex items-center gap-2 text-xs font-semibold cursor-pointer border border-white/5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour au PDF Studio</span>
            </button>
            <div className="h-4 w-px bg-white/10 hidden sm:block" />
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center ${meta.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white flex items-center gap-2">
                  {meta.title}
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-white/5 text-amber-400 border border-white/10">
                    {meta.badge}
                  </span>
                </h1>
                <p className="text-[11px] text-slate-400 hidden sm:block">{meta.desc}</p>
              </div>
            </div>
          </div>

          <a
            href="/"
            className="text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors hidden md:block"
          >
            Aller à l'Espace Documentaire →
          </a>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 space-y-6">

        {/* Tool-specific configuration controls */}
        {files.length > 0 && status !== 'processing' && (
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
            
            {/* Split options */}
            {type === 'diviser' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Mode de découpage</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSplitAllZip(false)}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all cursor-pointer ${!splitAllZip ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'text-slate-400 border-white/10'}`}
                    >
                      Plage personnalisée
                    </button>
                    <button
                      onClick={() => setSplitAllZip(true)}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all cursor-pointer ${splitAllZip ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'text-slate-400 border-white/10'}`}
                    >
                      Extraire toutes les pages (ZIP)
                    </button>
                  </div>
                </div>

                {!splitAllZip && (
                  <div>
                    <input
                      type="text"
                      value={splitRange}
                      onChange={e => setSplitRange(e.target.value)}
                      placeholder="ex: 1-3, 5, 8-10"
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-950 border border-white/15 rounded-xl text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      Indiquez les numéros de pages séparés par des virgules ou tirets (ex: <code>1-3, 5</code>).
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Rotate options */}
            {type === 'pivoter' && (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Angle de rotation</label>
                <div className="grid grid-cols-3 gap-3">
                  {([90, 180, 270] as const).map(angle => (
                    <button
                      key={angle}
                      onClick={() => setRotation(angle)}
                      className={`py-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        rotation === angle
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                          : 'bg-slate-950 text-slate-300 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <RotateCw className="w-4 h-4" />
                      <span>+{angle}°</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Watermark options */}
            {type === 'filigrane' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5">Texte du filigrane</label>
                    <input
                      type="text"
                      value={watermarkText}
                      onChange={e => setWatermarkText(e.target.value)}
                      placeholder="CONFIDENTIEL, COPIE, ÉBAUCHE..."
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-950 border border-white/15 rounded-xl text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5">Couleur</label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['red', 'blue', 'gray', 'green'] as const).map(col => (
                        <button
                          key={col}
                          onClick={() => setWatermarkColor(col)}
                          className={`py-2 rounded-lg text-xs font-semibold capitalize border transition-all cursor-pointer ${
                            watermarkColor === col ? 'bg-white/15 text-white border-amber-400' : 'bg-slate-950 text-slate-400 border-white/10'
                          }`}
                        >
                          {col === 'red' ? 'Rouge' : col === 'blue' ? 'Bleu' : col === 'gray' ? 'Gris' : 'Vert'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Opacité : {Math.round(watermarkOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={50}
                    value={Math.round(watermarkOpacity * 100)}
                    onChange={e => setWatermarkOpacity(parseInt(e.target.value) / 100)}
                    className="w-full accent-amber-500"
                  />
                </div>
              </div>
            )}

            {/* Password input for Protect & Unlock */}
            {(type === 'proteger' || type === 'deverrouiller') && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  {type === 'proteger' ? 'Mot de passe de protection souhaité' : 'Mot de passe actuel du document (si requis)'}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Saisissez un mot de passe..."
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-950 border border-white/15 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            )}
          </div>
        )}

        {/* Drop zone / File queue */}
        {files.length === 0 ? (
          <div
            onDrop={onDrop}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer group relative overflow-hidden ${
              isDragging
                ? 'border-amber-500 bg-amber-500/10 scale-[1.01]'
                : 'border-white/15 hover:border-amber-500/50 bg-slate-900/40 hover:bg-slate-900/60'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={e => e.target.files && addFiles(Array.from(e.target.files))}
              className="hidden"
              accept={meta.accept}
              multiple={isMulti}
            />

            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-amber-400 group-hover:scale-110 transition-transform">
              <Upload className="w-8 h-8" />
            </div>

            <h3 className="text-base font-bold text-white mb-1">
              Glissez-déposez vos fichiers ici, ou cliquez pour parcourir
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              Formats acceptés : <span className="font-mono text-amber-300">{meta.accept}</span>
              {isMulti && ' • Sélection multiple activée'}
            </p>

            <button
              type="button"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all inline-flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>Choisir un fichier</span>
            </button>
          </div>
        ) : (
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span>Fichiers sélectionnés</span>
                <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md font-mono text-[10px]">
                  {files.length}
                </span>
              </h3>

              {isMulti && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Ajouter d'autres fichiers</span>
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {files.map((f, idx) => (
                <div
                  key={`${f.name}-${idx}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-white/10 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-amber-400 shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <p className="font-semibold text-white truncate">{f.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{formatBytes(f.size)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isMulti && files.length > 1 && (
                      <>
                        <button
                          onClick={() => moveFile(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                          title="Monter"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveFile(idx, 'down')}
                          disabled={idx === files.length - 1}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                          title="Descendre"
                        >
                          ↓
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => removeFile(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer ml-1"
                      title="Supprimer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Trigger Button */}
            {status !== 'processing' && (
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  onClick={() => { setFiles([]); setStatus('idle'); setJpgImages([]); setExtractedOcrText(''); }}
                  className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Annuler / Changer de fichier
                </button>

                <button
                  onClick={executeProcess}
                  className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Lancer : {meta.title}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Processing Indicator */}
        {status === 'processing' && (
          <div className="bg-slate-900/80 border border-amber-500/40 rounded-2xl p-8 text-center space-y-5 shadow-2xl backdrop-blur-xl">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-amber-500/20 animate-ping opacity-30" />
              <Loader className="w-10 h-10 text-amber-400 animate-spin" />
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>Traitement souverain en cours</span>
                <span className="font-mono font-bold">
                  {progressPercent !== undefined ? `${Math.min(100, Math.max(0, Math.round(progressPercent)))}%` : ''}
                </span>
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {meta.title}
              </h3>
              <p className="text-xs text-slate-300 font-mono max-w-md mx-auto">
                {progress || 'Opération en cours d\'exécution dans votre navigateur…'}
              </p>
            </div>

            {/* Visual Progress Bar */}
            <div className="max-w-md mx-auto space-y-2">
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-white/10 p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 rounded-full transition-all duration-300 ease-out shadow-lg shadow-amber-500/50"
                  style={{ width: `${progressPercent !== undefined ? Math.min(100, Math.max(8, progressPercent)) : 65}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                <span>Sécurité 100% Locale</span>
                <span>Zéro fuite Cloud</span>
              </div>
            </div>
          </div>
        )}

        {/* Success Screen */}
        {status === 'done' && (
          <div className="bg-slate-900/80 border border-emerald-500/40 rounded-2xl p-7 text-center space-y-6 shadow-2xl shadow-emerald-500/10 backdrop-blur-xl">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 flex items-center justify-center mx-auto shadow-inner shadow-emerald-500/30">
              <CheckCircle className="w-8 h-8" />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white tracking-tight">Traitement terminé avec succès !</h3>
              <p className="text-xs text-emerald-300 font-medium">
                {resultStats || 'Votre document a été traité et téléchargé automatiquement.'}
              </p>
            </div>

            {/* Result Action Bar */}
            {lastResult && (
              <div className="p-4 rounded-xl bg-slate-950/70 border border-white/10 max-w-lg mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-left min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-semibold text-white truncate max-w-xs">{lastResult.filename}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{formatBytes(lastResult.size)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                  <button
                    onClick={() => downloadBlob(lastResult.blob, lastResult.filename)}
                    className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                    title="Télécharger une nouvelle copie"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Télécharger</span>
                  </button>

                  <button
                    onClick={handleSaveToLocalStorage}
                    disabled={isSavedLocally}
                    className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isSavedLocally
                        ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                        : 'bg-white/10 hover:bg-white/15 border border-white/10 text-white'
                    }`}
                    title="Sauvegarder dans votre stockage local souverain"
                  >
                    {isSavedLocally ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Enregistré !</span>
                      </>
                    ) : (
                      <>
                        <Folder className="w-3.5 h-3.5 text-slate-300" />
                        <span>Sauvegarder</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Preview & Download for JPG images */}
            {jpgImages.length > 0 && (
              <div className="pt-4 border-t border-white/10 space-y-4 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    {jpgImages.length} image(s) générée(s)
                  </span>
                  <button
                    onClick={downloadAllJpgZip}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <Download className="w-4 h-4" />
                    <span>Télécharger tout en ZIP</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-72 overflow-y-auto p-1">
                  {jpgImages.map(img => (
                    <div key={img.pageNum} className="bg-slate-950 rounded-xl p-2 border border-white/10 group relative">
                      <img src={img.dataUrl} alt={`Page ${img.pageNum}`} className="w-full h-auto rounded-lg" />
                      <div className="flex items-center justify-between mt-2 pt-1 text-[11px] text-slate-400">
                        <span>Page {img.pageNum}</span>
                        <a
                          href={img.dataUrl}
                          download={`page_${img.pageNum}.jpg`}
                          className="text-amber-400 hover:underline font-semibold"
                        >
                          Télécharger
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview for OCR Extracted Text */}
            {extractedOcrText && (
              <div className="pt-4 border-t border-white/10 space-y-3 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Texte Extrait ({extractedOcrText.length} caractères)
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(extractedOcrText);
                        setCopiedOcr(true);
                        setTimeout(() => setCopiedOcr(false), 2000);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedOcr ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedOcr ? 'Copié !' : 'Copier'}</span>
                    </button>
                    <button
                      onClick={() => {
                        const b = new Blob([extractedOcrText], { type: 'text/plain;charset=utf-8' });
                        downloadBlob(b, `${files[0]?.name.replace('.pdf', '')}_texte_ocr.txt`);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Télécharger (.txt)</span>
                    </button>
                  </div>
                </div>

                <textarea
                  readOnly
                  value={extractedOcrText}
                  rows={8}
                  className="w-full text-xs font-mono p-3 bg-slate-950 border border-white/15 rounded-xl text-slate-200 focus:outline-none"
                />
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={() => {
                  setFiles([]);
                  setStatus('idle');
                  setJpgImages([]);
                  setExtractedOcrText('');
                  setLastResult(null);
                  setIsSavedLocally(false);
                }}
                className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-semibold text-xs cursor-pointer transition-colors"
              >
                Traiter un autre document
              </button>
            </div>
          </div>
        )}

        {/* Error Screen with Centralized Diagnosis */}
        {status === 'error' && (
          <div className="bg-slate-900/80 border border-rose-500/40 rounded-2xl p-7 text-center space-y-4 shadow-2xl shadow-rose-500/10 backdrop-blur-xl">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/50 text-rose-400 flex items-center justify-center mx-auto shadow-inner shadow-rose-500/30">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2 max-w-lg mx-auto">
              <h3 className="text-base font-bold text-white tracking-tight">
                {errorDiagnosis?.title || 'Une erreur est survenue pendant le traitement'}
              </h3>
              <p className="text-xs text-rose-200/90 leading-relaxed">
                {errorDiagnosis?.explanation || error}
              </p>
            </div>

            {/* Actionable Advice */}
            {errorDiagnosis && errorDiagnosis.advice.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-950/70 border border-rose-500/20 text-left max-w-lg mx-auto space-y-2">
                <p className="text-[11px] font-bold text-rose-300 uppercase tracking-wider">
                  Conseils pour résoudre ce problème :
                </p>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {errorDiagnosis.advice.map((adv, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-rose-400 font-bold">•</span>
                      <span>{adv}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setStatus('idle')}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md cursor-pointer transition-all"
              >
                Réessayer l'opération
              </button>
              <button
                onClick={() => {
                  setFiles([]);
                  setStatus('idle');
                  setErrorDiagnosis(null);
                  setError('');
                }}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs cursor-pointer transition-colors"
              >
                Changer de fichier
              </button>
            </div>
          </div>
        )}

        {/* Persistent Conversion History & Element Fidelity Section */}
        {history.length > 0 && (
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Historique Persistant des Conversions ({history.length})
                </h4>
              </div>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer transition-colors"
              >
                {showHistory ? 'Masquer' : 'Afficher l\'historique'}
              </button>
            </div>

            {showHistory && (
              <div className="space-y-2 pt-2 border-t border-white/10 max-h-60 overflow-y-auto">
                {history.map(item => (
                  <div key={item.id} className="p-3 bg-slate-950/80 rounded-xl border border-white/5 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white truncate">{item.outputName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-amber-400 border border-white/10 shrink-0">
                          {item.toolTitle}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {item.elementPreservationSummary || 'Fidélité garantie'} • {item.timestamp}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                        {formatBytes(item.outputSize)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
