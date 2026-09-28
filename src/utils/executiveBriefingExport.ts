/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Executive Briefing Exporter (PDF & DOCX) — Strictly Sans Logo
 * Formats high-level AI document comprehension notes with pristine state administrative structure.
 */

import { jsPDF } from "jspdf";
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  AlignmentType, 
  BorderStyle, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType,
  ShadingType
} from "docx";

// Helper to sanitize any markdown artifact (#, *, _, `, etc.)
export function cleanMarkdownArtifacts(text: string): string {
  if (!text) return "";
  return text
    .replace(/^#{1,6}\s*/gm, "")      // remove markdown headers #, ##, ###
    .replace(/\*\*(.*?)\*\*/g, "$1")  // remove bold **text**
    .replace(/\*(.*?)\*/g, "$1")      // remove italic *text*
    .replace(/_{1,2}(.*?)_{1,2}/g, "$1") // remove underscores
    .replace(/`{1,3}(.*?)`{1,3}/g, "$1") // remove backticks
    .trim();
}

export interface ExecutiveSection {
  title: string;
  items: string[];
  type: 'summary' | 'data' | 'risks' | 'questions' | 'recommendations' | 'general';
}

// Parses raw AI text into structured semantic sections
export function parseAnalysisIntoSections(rawText: string): ExecutiveSection[] {
  if (!rawText) return [];

  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const sections: ExecutiveSection[] = [];
  let currentTitle = "Synthèse Exécutive Principale";
  let currentItems: string[] = [];
  let currentType: ExecutiveSection['type'] = 'summary';

  const determineType = (title: string): ExecutiveSection['type'] => {
    const t = title.toLowerCase();
    if (t.includes('synthèse') || t.includes('retenir') || t.includes('résumé')) return 'summary';
    if (t.includes('donnée') || t.includes('chiffre') || t.includes('indicateur') || t.includes('financ')) return 'data';
    if (t.includes('risque') || t.includes('vigilance') || t.includes('obligation') || t.includes('sanction')) return 'risks';
    if (t.includes('question') || t.includes('réponse') || t.includes('faq')) return 'questions';
    if (t.includes('recommandation') || t.includes('action') || t.includes('mesure')) return 'recommendations';
    return 'general';
  };

  for (const line of lines) {
    const isHeading = line.startsWith('#') || 
      line.startsWith('🎯') || 
      line.startsWith('📊') || 
      line.startsWith('⚠️') || 
      line.startsWith('❓') || 
      line.startsWith('💡') ||
      line.toUpperCase().includes('SYNTHÈSE') ||
      line.toUpperCase().includes('CHIFFRES CLÉS') ||
      line.toUpperCase().includes('POINTS DE VIGILANCE') ||
      line.toUpperCase().includes('QUESTIONS STRATÉGIQUES');

    if (isHeading && (line.length < 90)) {
      if (currentItems.length > 0) {
        sections.push({
          title: currentTitle,
          items: currentItems,
          type: currentType
        });
        currentItems = [];
      }
      currentTitle = cleanMarkdownArtifacts(line.replace(/^[🎯📊⚠️❓💡📌•-]\s*/, ''));
      currentType = determineType(currentTitle);
    } else {
      const cleanLine = cleanMarkdownArtifacts(line.replace(/^[•*-]\s*/, ''));
      if (cleanLine.length > 0) {
        currentItems.push(cleanLine);
      }
    }
  }

  if (currentItems.length > 0) {
    sections.push({
      title: currentTitle,
      items: currentItems,
      type: currentType
    });
  }

  return sections.length > 0 ? sections : [
    {
      title: "Synthèse Administrative",
      items: [cleanMarkdownArtifacts(rawText)],
      type: 'summary'
    }
  ];
}

/**
 * 1. EXPORT PDF ADMINISTRATIF HAUTE QUALITÉ — STRICTEMENT SANS LOGO
 */
export function exportExecutiveBriefingPDF(
  docName: string,
  rawAnalysis: string,
  pageCount: number = 1,
  wordCount: number = 0
): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - (margin * 2); // 182 mm
  const rightMargin = pageWidth - margin; // 196 mm
  const bottomLimit = pageHeight - 18;

  let currentY = 14;

  const checkPageBreak = (neededSpace: number = 15) => {
    if (currentY + neededSpace > bottomLimit) {
      doc.addPage();
      currentY = 16;
      renderRunningHeader();
    }
  };

  const renderRunningHeader = () => {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text("CNIPLC • République de Djibouti — Note de Synthèse Exécutive (Sans Logo)", margin, 10);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(margin, 12, rightMargin, 12);
  };

  // 1. OFFICIAL STATE HEADER — SANS LOGO (Full width typography)
  // Double fine framing lines
  doc.setDrawColor(30, 41, 59); // slate-800
  doc.setLineWidth(0.3);
  doc.line(margin, currentY, rightMargin, currentY);
  currentY += 4.5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text("RÉPUBLIQUE DE DJIBOUTI", pageWidth / 2, currentY, { align: "center" });
  currentY += 4;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text("COMMISSION NATIONALE INDÉPENDANTE POUR LA PRÉVENTION ET LA LUTTE CONTRE LA CORRUPTION", pageWidth / 2, currentY, { align: "center" });
  currentY += 3.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text("Secrétariat Général • Direction de l'Audit & de l'Analyse Stratégique", pageWidth / 2, currentY, { align: "center" });
  currentY += 4;

  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.2);
  doc.line(margin, currentY, rightMargin, currentY);
  currentY += 7;

  // 2. DOCUMENT TITLE & CLASSIFICATION BANNER
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(218, 222, 229);
  doc.setLineWidth(0.35);
  doc.roundedRect(margin, currentY, contentWidth, 14, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("NOTE DE SYNTHÈSE EXÉCUTIVE DÉCISIONNELLE", margin + 4, currentY + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const dateFormatted = new Date().toLocaleDateString("fr-FR", { day: '2-digit', month: 'long', year: 'numeric' });
  doc.text(`Émise le : ${dateFormatted} • Classification : DIFFUSION RESTREINTE / CONSEIL D'ÉTAT`, margin + 4, currentY + 11);

  // Status stamp on the right
  doc.setFillColor(254, 243, 199); // amber-100
  doc.setDrawColor(245, 158, 11); // amber-500
  doc.setLineWidth(0.3);
  doc.roundedRect(rightMargin - 42, currentY + 2.5, 39, 9, 1, 1, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(180, 83, 9); // amber-700
  doc.text("SYNTHÈSE CERTIFIÉE", rightMargin - 22.5, currentY + 8, { align: "center" });

  currentY += 18;

  // 3. SOURCE DOCUMENT METADATA TABLE
  doc.setFillColor(241, 245, 249); // slate-100
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.25);
  doc.roundedRect(margin, currentY, contentWidth, 13, 1, 1, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text("DOCUMENT SOURCE :", margin + 3, currentY + 5);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  const truncatedDocName = docName.length > 55 ? docName.substring(0, 52) + "..." : docName;
  doc.text(truncatedDocName, margin + 34, currentY + 5);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(51, 65, 85);
  doc.text("VOLUME & COUVERTURE :", margin + 3, currentY + 10);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(`${pageCount} page(s) numérisée(s) • ${wordCount.toLocaleString()} mots traités • Analyse IA Haute Fidélité`, margin + 39, currentY + 10);

  currentY += 17;

  // 4. SECTIONS RENDERING
  const sections = parseAnalysisIntoSections(rawAnalysis);

  sections.forEach((sec, idx) => {
    checkPageBreak(25);

    // Section title pill/box
    let badgeColor = [241, 245, 249]; // default slate
    let titleColor = [15, 23, 42];

    if (sec.type === 'summary') {
      badgeColor = [254, 243, 199]; // amber-100
      titleColor = [146, 64, 14];  // amber-800
    } else if (sec.type === 'data') {
      badgeColor = [239, 246, 255]; // blue-100
      titleColor = [30, 64, 175];  // blue-800
    } else if (sec.type === 'risks') {
      badgeColor = [254, 242, 242]; // red-100
      titleColor = [153, 27, 27];  // red-800
    } else if (sec.type === 'questions') {
      badgeColor = [236, 253, 245]; // emerald-100
      titleColor = [6, 95, 70];   // emerald-800
    }

    doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.2);
    doc.roundedRect(margin, currentY, contentWidth, 7.5, 1, 1, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(titleColor[0], titleColor[1], titleColor[2]);
    doc.text(sec.title.toUpperCase(), margin + 3, currentY + 5.2);

    currentY += 10;

    // Items list
    sec.items.forEach((item) => {
      checkPageBreak(12);

      // Clean item text
      const cleanItem = cleanMarkdownArtifacts(item);

      // Bullet dot
      doc.setFillColor(titleColor[0], titleColor[1], titleColor[2]);
      doc.circle(margin + 2.5, currentY + 2.5, 0.8, "F");

      // Split text into lines
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59); // slate-800

      const textLines = doc.splitTextToSize(cleanItem, contentWidth - 8);
      doc.text(textLines, margin + 6, currentY + 3.2);

      const blockHeight = (textLines.length * 4) + 2;
      currentY += blockHeight;
    });

    currentY += 3; // spacing after section
  });

  // 5. OFFICIAL ADMINISTRATIVE FOOTER STAMP
  checkPageBreak(25);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.25);
  doc.line(margin, currentY + 2, rightMargin, currentY + 2);
  currentY += 6;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("Certifié conforme aux pièces versées au dossier documentaire • Commission Nationale Indépendante (CNIPLC)", margin, currentY);
  currentY += 3.5;
  doc.text("Document à usage administratif exclusif • Zéro altération du texte d'origine • Document officiel sans logo", margin, currentY);

  // Add page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} sur ${totalPages}`, rightMargin, pageHeight - 7, { align: "right" });
  }

  const cleanFilename = `Synthese_Executive_${docName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
  doc.save(cleanFilename);
}

/**
 * 2. EXPORT WORD (.DOCX) ADMINISTRATIF HAUTE QUALITÉ — STRICTEMENT SANS LOGO
 */
export async function exportExecutiveBriefingWord(
  docName: string,
  rawAnalysis: string,
  pageCount: number = 1,
  wordCount: number = 0
): Promise<void> {
  const sections = parseAnalysisIntoSections(rawAnalysis);
  const dateFormatted = new Date().toLocaleDateString("fr-FR", { day: '2-digit', month: 'long', year: 'numeric' });

  const paragraphs: Paragraph[] = [];

  // 1. STATE ADMINISTRATIVE HEADER — SANS LOGO
  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: "RÉPUBLIQUE DE DJIBOUTI",
          bold: true,
          size: 24, // 12pt
          color: "0F172A",
          font: "Calibri"
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: "COMMISSION NATIONALE INDÉPENDANTE POUR LA PRÉVENTION ET LA LUTTE CONTRE LA CORRUPTION",
          bold: true,
          size: 17, // 8.5pt
          color: "334155",
          font: "Calibri"
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: "Secrétariat Général • Direction de l'Audit & de l'Analyse Stratégique",
          italics: true,
          size: 16,
          color: "64748B",
          font: "Calibri"
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 150 },
      children: [
        new TextRun({
          text: "NOTE DE SYNTHÈSE EXÉCUTIVE DÉCISIONNELLE",
          bold: true,
          size: 26,
          color: "1E3A8A",
          font: "Calibri"
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 250 },
      children: [
        new TextRun({
          text: `Document Source : ${docName} • ${pageCount} page(s) • ${wordCount.toLocaleString()} mots • Émis le : ${dateFormatted}`,
          size: 16,
          color: "475569",
          font: "Calibri"
        })
      ]
    })
  );

  // 2. SECTIONS CONTENT
  sections.forEach(sec => {
    // Section Header
    paragraphs.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
        children: [
          new TextRun({
            text: sec.title.toUpperCase(),
            bold: true,
            size: 20,
            color: "0F172A",
            font: "Calibri"
          })
        ]
      })
    );

    // Section Items
    sec.items.forEach(item => {
      const cleanItem = cleanMarkdownArtifacts(item);
      paragraphs.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 80, line: 260 },
          children: [
            new TextRun({
              text: cleanItem,
              size: 18, // 9pt
              color: "1E293B",
              font: "Calibri"
            })
          ]
        })
      );
    });
  });

  // 3. FINAL SIGNATURE / VALIDATION STRIP
  paragraphs.push(
    new Paragraph({
      spacing: { before: 300, after: 100 },
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({
          text: "Pour la Commission Nationale Indépendante (CNIPLC)",
          bold: true,
          size: 18,
          color: "334155"
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({
          text: "L'Inspecteur Général d'État • Secrétariat Technique",
          italics: true,
          size: 16,
          color: "64748B"
        })
      ]
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1000,
              bottom: 1000,
              left: 1000,
              right: 1000
            }
          }
        },
        children: paragraphs
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  const cleanFilename = `Synthese_Executive_${docName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_")}.docx`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = cleanFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
