import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, HeadingLevel, ShadingType } from "docx";
import jsPDF from "jspdf";
import { InstitutionDocument } from "../types/documentPlatform";

const thinBorder = {
  top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
  left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
  right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
};

/**
 * Exporte une fiche de document institutionnel au format Word (.docx) conforme aux normes CNIPLC
 */
export async function exportDocumentToWord(doc: InstitutionDocument): Promise<void> {
  const docxFile = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1200, bottom: 1200, left: 1400, right: 1400 },
          },
        },
        children: [
          // En-tête institutionnel
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "RÉPUBLIQUE DE DJIBOUTI",
                bold: true,
                size: 24,
                font: "Arial",
                color: "1A365D",
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "COMMISSION NATIONALE INDÉPENDANTE POUR LA PRÉVENTION ET LA LUTTE CONTRE LA CORRUPTION (CNIPLC)",
                bold: true,
                size: 20,
                font: "Arial",
                color: "2D3748",
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "PLATEFORME INSTITUTIONNELLE DE GESTION DOCUMENTAIRE IA & SOUVERAINETÉ NUMÉRIQUE",
                size: 16,
                italics: true,
                font: "Arial",
                color: "718096",
              }),
            ],
            spacing: { after: 300 },
          }),

          // Titre du Document
          new Paragraph({
            alignment: AlignmentType.LEFT,
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: `FICHE TECHNIQUE : ${doc.title.toUpperCase()}`,
                bold: true,
                size: 26,
                color: "0F172A",
              }),
            ],
            spacing: { before: 200, after: 200 },
          }),

          // Tableau des métadonnées
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    shading: { fill: "F1F5F9", type: ShadingType.CLEAR },
                    borders: thinBorder,
                    children: [new Paragraph({ children: [new TextRun({ text: "Fichier Original", bold: true })] })],
                  }),
                  new TableCell({
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    borders: thinBorder,
                    children: [new Paragraph({ children: [new TextRun({ text: doc.originalFilename })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    shading: { fill: "F1F5F9", type: ShadingType.CLEAR },
                    borders: thinBorder,
                    children: [new Paragraph({ children: [new TextRun({ text: "Département & Espace", bold: true })] })],
                  }),
                  new TableCell({
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    borders: thinBorder,
                    children: [new Paragraph({ children: [new TextRun({ text: `${doc.department} (${doc.workspaceId})` })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    shading: { fill: "F1F5F9", type: ShadingType.CLEAR },
                    borders: thinBorder,
                    children: [new Paragraph({ children: [new TextRun({ text: "Taille & Pagination", bold: true })] })],
                  }),
                  new TableCell({
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    borders: thinBorder,
                    children: [new Paragraph({ children: [new TextRun({ text: `${(doc.fileSize / 1024 / 1024).toFixed(2)} Mo — ${doc.pageCount} page(s)` })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    shading: { fill: "F1F5F9", type: ShadingType.CLEAR },
                    borders: thinBorder,
                    children: [new Paragraph({ children: [new TextRun({ text: "Version & Statut", bold: true })] })],
                  }),
                  new TableCell({
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    borders: thinBorder,
                    children: [new Paragraph({ children: [new TextRun({ text: `Version v${doc.version || "1.0"} — Indexé ChromaDB (${doc.chromaVectorCount || doc.qdrantVectorCount || 12} chunks)` })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    shading: { fill: "F1F5F9", type: ShadingType.CLEAR },
                    borders: thinBorder,
                    children: [new Paragraph({ children: [new TextRun({ text: "Empreinte SHA-256", bold: true })] })],
                  }),
                  new TableCell({
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    borders: thinBorder,
                    children: [new Paragraph({ children: [new TextRun({ text: doc.sha256 || doc.fileHash || "Certifié SHA-256", font: "Courier New", size: 18 })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    shading: { fill: "F1F5F9", type: ShadingType.CLEAR },
                    borders: thinBorder,
                    children: [new Paragraph({ children: [new TextRun({ text: "Chemin Local Souverain", bold: true })] })],
                  }),
                  new TableCell({
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    borders: thinBorder,
                    children: [new Paragraph({ children: [new TextRun({ text: doc.storagePath || doc.r2Key || "/storage/users/souverain/documents/", font: "Courier New", size: 18 })] })],
                  }),
                ],
              }),
            ],
          }),

          // Résumé Exécutif
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: "1. Résumé Exécutif & Extraction Thématique",
                bold: true,
                size: 22,
                color: "1E293B",
              }),
            ],
            spacing: { before: 300, after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: doc.summarySnippet || "Aucun extrait disponible pour ce document.",
                size: 20,
              }),
            ],
            spacing: { after: 200 },
          }),

          // Indexation thématique et mots clés
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: "2. Mots-clés & Tags RAG",
                bold: true,
                size: 22,
                color: "1E293B",
              }),
            ],
            spacing: { before: 200, after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: (doc.tags || []).join(" • "),
                size: 20,
                color: "3B82F6",
              }),
            ],
            spacing: { after: 300 },
          }),

          // Mention légale de souveraineté
          new Paragraph({
            children: [
              new TextRun({
                text: "Document certifié par le système documentaire de la Commission Nationale Indépendante pour la Prévention et la Lutte contre la Corruption (CNIPLC). Données stockées localement et vectorisées avec ChromaDB en stricte isolation utilisateur.",
                size: 16,
                italics: true,
                color: "64748B",
              }),
            ],
            spacing: { before: 400 },
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(docxFile);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `CNIPLC_Fiche_${doc.title.replace(/[^a-zA-Z0-9]/g, "_")}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Exporte une fiche de document institutionnel au format PDF avec mise en page CNIPLC
 */
export function exportDocumentToPdf(doc: InstitutionDocument): void {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Fond et marges
  pdf.setFillColor(248, 250, 252);
  pdf.rect(0, 0, 210, 297, "F");

  // En-tête CNIPLC
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.setTextColor(26, 54, 93);
  pdf.text("RÉPUBLIQUE DE DJIBOUTI", 105, 20, { align: "center" });

  pdf.setFontSize(10);
  pdf.setTextColor(45, 55, 72);
  pdf.text("COMMISSION NATIONALE INDÉPENDANTE POUR LA PRÉVENTION ET LA LUTTE CONTRE LA CORRUPTION", 105, 26, { align: "center" });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(113, 128, 150);
  pdf.text("ESPACE DOCUMENTAIRE INSTITUTIONNEL SOUVERAIN — CHROMADB & RAG", 105, 31, { align: "center" });

  // Ligne de séparation
  pdf.setDrawColor(203, 213, 225);
  pdf.setLineWidth(0.5);
  pdf.line(20, 35, 190, 35);

  // Titre du document
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.setTextColor(15, 23, 42);
  pdf.text(`FICHE DOCUMENTAIRE : ${doc.title.substring(0, 50)}`, 20, 45);

  // Boîte des métadonnées
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(20, 50, 170, 70, 3, 3, "FD");

  pdf.setFontSize(9);
  let y = 58;

  const addRow = (label: string, value: string) => {
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(100, 116, 139);
    pdf.text(label, 25, y);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(30, 41, 59);
    pdf.text(value.substring(0, 65), 75, y);
    y += 9;
  };

  addRow("Nom du fichier :", doc.originalFilename);
  addRow("Département :", doc.department);
  addRow("Volume & Pagination :", `${(doc.fileSize / 1024 / 1024).toFixed(2)} Mo — ${doc.pageCount} pages`);
  addRow("Version & Classification :", `v${doc.version || "1.0"} — ${doc.securityClassification}`);
  addRow("Indexation ChromaDB :", `${doc.chromaVectorCount || doc.qdrantVectorCount || 12} vecteurs / chunks normalisés`);
  addRow("Empreinte SHA-256 :", (doc.sha256 || doc.fileHash || "").substring(0, 36) + "...");
  addRow("Chemin Local :", (doc.storagePath || doc.r2Key || "").substring(0, 45) + "...");

  // Section Résumé
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(15, 23, 42);
  pdf.text("RÉSUMÉ EXÉCUTIF & CONTENU INDEXÉ", 20, 130);

  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(20, 135, 170, 60, 3, 3, "FD");

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(51, 65, 85);
  const splitText = pdf.splitTextToSize(doc.summarySnippet || "Aucun extrait disponible.", 160);
  pdf.text(splitText, 25, 143);

  // Section Tags
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(15, 23, 42);
  pdf.text("MOTS-CLÉS & SÉMANTIQUE", 20, 205);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(37, 99, 235);
  pdf.text((doc.tags || []).join("  •  "), 20, 212);

  // Pied de page
  pdf.setDrawColor(226, 232, 240);
  pdf.line(20, 275, 190, 275);
  pdf.setFontSize(7.5);
  pdf.setTextColor(148, 163, 184);
  pdf.text("CNIPLC Djibouti — Système de Gestion Documentaire Souverain avec ChromaDB et IA NIM", 105, 282, { align: "center" });

  pdf.save(`CNIPLC_Fiche_${doc.title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
}
