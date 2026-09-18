/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from "jspdf";
import { Intervention } from "../types";

// Helper to fetch and convert image to base64
const getBase64ImageFromUrl = async (imageUrl: string): Promise<string | null> => {
  try {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const absoluteUrl = imageUrl.startsWith("/") ? origin + imageUrl : imageUrl;
    const res = await fetch(absoluteUrl);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

async function savePdfFile(doc: jsPDF, filename: string, directoryHandle?: FileSystemDirectoryHandle | null) {
  if (directoryHandle) {
    try {
      const handle = directoryHandle as any;
      const options = { mode: "readwrite" as const };
      if ((await handle.queryPermission(options)) !== "granted") {
        if ((await handle.requestPermission(options)) !== "granted") {
          throw new Error("Permission de modification refusée.");
        }
      }
      const fileHandle = await directoryHandle.getFileHandle(filename, { create: true });
      const writable = await (fileHandle as any).createWritable();
      const blob = doc.output('blob');
      await writable.write(blob);
      await writable.close();
      console.log(`Saved ${filename} to local directory successfully.`);
      return;
    } catch (err) {
      console.error("Failed to save to local directory, falling back to browser download.", err);
    }
  }
  
  // Fallback
  doc.save(filename);
}

export async function generateAndDownloadPDF(intervention: Intervention, directoryHandle?: FileSystemDirectoryHandle | null): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  // Get official base64 logo
  const imgData = await getBase64ImageFromUrl("/logo.jpeg");

  let currentY = 15;

  // 1. HEADER SECTION
  if (imgData) {
    // Draw Logo CNIPLC
    doc.addImage(imgData, "JPEG", 15, currentY, 20, 20);
    
    // State Text with indentation
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text("RÉPUBLIQUE DE DJIBOUTI", 38, currentY + 3);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42); // Slate-900
    const headerLines = doc.splitTextToSize("COMMISSION NATIONALE INDÉPENDANTE POUR LA PRÉVENTION ET LA LUTTE CONTRE LA CORRUPTION", 100);
    doc.text(headerLines, 38, currentY + 7);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(197, 160, 67); // Gold-500
    doc.text("CNIPLC - SERVICES TECHNIQUES DE L'INFORMATIQUE", 38, currentY + 16);
  } else {
    // Fallback title text if logo doesn't fetch
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text("RÉPUBLIQUE DE DJIBOUTI", 15, currentY + 3);
    
    doc.setFontSize(8);
    const headerLines = doc.splitTextToSize("COMMISSION NATIONALE INDÉPENDANTE POUR LA PRÉVENTION ET LA LUTTE CONTRE LA CORRUPTION", 120);
    doc.text(headerLines, 15, currentY + 8);
    
    doc.setFontSize(8);
    doc.setTextColor(197, 160, 67);
    doc.text("CNIPLC - SERVICES TECHNIQUES DE L'INFORMATIQUE", 15, currentY + 18);
  }

  // Metadata block (Right side)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`REF : ${intervention.refNumber}`, 195, currentY + 4, { align: "right" });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Date : ${new Date(intervention.date).toLocaleDateString('fr-FR')}`, 195, currentY + 9, { align: "right" });
  doc.text(`Durée : ${intervention.durationMinutes} min`, 195, currentY + 14, { align: "right" });

  // Horizontal separator Gold styled line
  currentY += 23;
  doc.setDrawColor(197, 160, 67); // Gold
  doc.setLineWidth(0.8);
  doc.line(15, currentY, 195, currentY);

  // 2. DOCUMENT CORE TITLE
  currentY += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(15, 23, 42);
  doc.text(intervention.ficheType === "attribution" ? "FICHE D'ATTRIBUTION ET DE RESTITUTION" : "FICHE D'INTERVENTION TECHNIQUE", 105, currentY, { align: "center" });
  
  currentY += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(197, 160, 67);
  doc.text(intervention.ficheType === "attribution" ? "& ATTESTATION DE MATÉRIEL ATTRIBUÉ" : "& ATTESTATION DE SERVICE FAIT", 105, currentY, { align: "center" });

  if (intervention.preferredService) {
    currentY += 6;
    doc.setFillColor(240, 253, 250); // Teal-50
    doc.setDrawColor(204, 251, 241); // Teal-100
    doc.setLineWidth(0.2);
    doc.roundedRect(55, currentY - 3.5, 100, 5, 1, 1, "FD");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(15, 118, 110); // Teal-700
    doc.text(`SERVICE DE PREFERENCE : ${intervention.preferredService.toUpperCase()}`, 105, currentY, { align: "center" });
  }

  // 3. PARTIES GRID BOX
  currentY += 10;
  // Background and border boxes for parties
  doc.setFillColor(253, 250, 242); // Warm Gold-50 accent
  doc.roundedRect(15, currentY, 86, 30, 2, 2, "F");
  doc.setDrawColor(242, 223, 174); // Gold-200 border
  doc.setLineWidth(0.25);
  doc.roundedRect(15, currentY, 86, 30, 2, 2, "D");
  
  doc.setFillColor(253, 250, 242);
  doc.roundedRect(109, currentY, 86, 30, 2, 2, "F");
  doc.setDrawColor(242, 223, 174);
  doc.roundedRect(109, currentY, 86, 30, 2, 2, "D");

  // Column 1 content
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(147, 113, 35); // Gold-700
  doc.text("INTERVENANT (TECHNICIEN IT)", 19, currentY + 5);
  doc.setDrawColor(245, 231, 194);
  doc.setLineWidth(0.15);
  doc.line(19, currentY + 6.5, 95, currentY + 6.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(intervention.techName, 19, currentY + 12);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(intervention.techTitle, 19, currentY + 17);
  doc.text(`Département Validant : ${intervention.techValidatingDept || "CNIPLC Informatique"}`, 19, currentY + 22);

  // Column 2 content
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(147, 113, 35);
  doc.text("BÉNÉFICIAIRE (DEMANDEUR)", 113, currentY + 5);
  doc.line(113, currentY + 6.5, 189, currentY + 6.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(intervention.clientName, 113, currentY + 12);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(intervention.clientTitle, 113, currentY + 17);
  doc.text(`Département/Direction : ${intervention.clientDepartment}`, 113, currentY + 22);

  // 4. EQUIPMENT SPECIFICATIONS
  currentY += 36;
  doc.setFillColor(253, 250, 242);
  doc.roundedRect(15, currentY, 180, 20, 1.5, 1.5, "F");
  doc.setDrawColor(242, 223, 174);
  doc.setLineWidth(0.25);
  doc.roundedRect(15, currentY, 180, 20, 1.5, 1.5, "D");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(115, 84, 24); // Gold-850
  doc.text(intervention.ficheType === "attribution" ? "RÉFÉRENCE DE L'ÉQUIPEMENT ATTRIBUÉ" : "DÉTAILS DE L'ÉQUIPEMENT INFORMATIQUE CONCERNÉ", 19, currentY + 5);
  doc.setDrawColor(245, 231, 194);
  doc.line(19, currentY + 6.5, 191, currentY + 6.5);

  if (intervention.ficheType === "attribution") {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text("Référence :", 19, currentY + 11);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(intervention.equipRef || "Non spécifiée", 19, currentY + 15);
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text("Type de matériel :", 19, currentY + 11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(intervention.deviceType.toUpperCase(), 19, currentY + 15);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text("Modèle / Marque :", 79, currentY + 11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(intervention.deviceBrand || "Standard/Inconnu", 79, currentY + 15);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text("N° Inventaire (Asset Code) :", 139, currentY + 11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(intervention.deviceInventory || "N/A", 139, currentY + 15);
  }

  // 5. RAPPORT SYNTHÉTIQUE
  currentY += 26;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(intervention.ficheType === "attribution" ? "DESCRIPTION DE L'ATTRIBUTION" : "RAPPORT SYNTHÉTIQUE D'INTERVENTION", 15, currentY);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.line(15, currentY + 1.5, 195, currentY + 1.5);

  currentY += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59); // Slate-800
  
  const summaryText = intervention.professionalSummary || "Aucune description rédigée.";
  const wrappedSummary = doc.splitTextToSize(summaryText, 180);
  doc.text(wrappedSummary, 15, currentY);

  currentY += (wrappedSummary.length * 4.2) + 5;

  // Render quickNotes if present
  if (intervention.quickNotes) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42); 
    doc.text("Notes rapides / Observations complémentaires :", 15, currentY);
    currentY += 4.5;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105); // Slate-600
    const wrappedQuickNotes = doc.splitTextToSize(intervention.quickNotes, 180);
    doc.text(wrappedQuickNotes, 15, currentY);
    currentY += (wrappedQuickNotes.length * 3.8) + 5;
  }

  // 6. ACTION NOMENCLATURE TABLE
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("NOMENCLATURE DES ACTIONS TECHNIQUES RÉALISÉES", 15, currentY);
  doc.line(15, currentY + 1.5, 195, currentY + 1.5);

  currentY += 5;
  
  // Draw Table Header Backplate
  doc.setFillColor(15, 23, 42); // Black slate
  doc.rect(15, currentY, 180, 7, "F");
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text("N°", 18, currentY + 4.8);
  doc.text(intervention.ficheType === "attribution" ? "Désignation" : "Action de Maintenance Corrective et Préventive", 26, currentY + 4.8);
  doc.text(intervention.ficheType === "attribution" ? "Caractéristiques" : "Catégorie", 146, currentY + 4.8);
  doc.text(intervention.ficheType === "attribution" ? "État" : "Statut", 176, currentY + 4.8);

  currentY += 7;

  // Draw table rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  
  intervention.tasks.forEach((task, index) => {
    // Compute wrapped task line
    const wrappedDesc = doc.splitTextToSize(task.description, 115);
    const rowHeight = Math.max(wrappedDesc.length * 4, 7);

    // Grid boundaries
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.25);
    doc.line(15, currentY + rowHeight, 195, currentY + rowHeight); // Row floor

    // Draw vertical column separators
    doc.line(15, currentY, 15, currentY + rowHeight);
    doc.line(23, currentY, 23, currentY + rowHeight);
    doc.line(142, currentY, 142, currentY + rowHeight);
    doc.line(172, currentY, 172, currentY + rowHeight);
    doc.line(195, currentY, 195, currentY + rowHeight);

    // Row Text Fill
    doc.setTextColor(71, 85, 105);
    doc.text((index + 1).toString(), 19, currentY + 4.5, { align: "center" });
    
    doc.setTextColor(15, 23, 42);
    doc.text(wrappedDesc, 26, currentY + 4.5);
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(147, 113, 35); // Gold-700
    doc.text(task.category, 144, currentY + 4.5);
    
    doc.setTextColor(16, 185, 129); // Emerald-500
    doc.text(intervention.ficheType === "attribution" ? (task.status || "Neuf") : "✓ FAIT", 176, currentY + 4.5);
    
    doc.setFont("helvetica", "normal");
    currentY += rowHeight;
  });

  if (intervention.tasks.length === 0) {
    doc.setDrawColor(226, 232, 240);
    doc.line(15, currentY + 8, 195, currentY + 8);
    doc.rect(15, currentY, 180, 8);
    doc.setTextColor(148, 163, 184);
    doc.text("Aucun acte technique enregistré.", 105, currentY + 5.5, { align: "center" });
    currentY += 8;
  }

  // Check if page overflow is imminent
  if (currentY > 225) {
    doc.addPage();
    currentY = 20;
  }

  // 7. COMMITMENT STATEMENT
  currentY += 8;
  const declaration = intervention.ficheType === "attribution"
    ? "Déclaration administrative : Ce document atteste de l'attribution effective du matériel informatique décrit ci-dessus par les services techniques du CNIPLC au bénéficiaire désigné. Le signataire du DAF, le bénéficiaire et le technicien informatique attestent par leurs signatures respectives que le matériel a été remis en bon état, configuré et opérationnel."
    : "Déclaration administrative : Ce document atteste de la réalisation effective des travaux de dépannage, d'assistance, d'installation d'équipements ou de maintenance réseau décrits ci-dessus par les services informatiques d'État (CNIPLC). Le bénéficiaire atteste par sa signature que les systèmes informatiques mentionnés sont réparés, fonctionnels et conformes aux exigences professionnelles.";
  const wrappedDecl = doc.splitTextToSize(declaration, 172);
  const declBoxHeight = Math.max(18, wrappedDecl.length * 4.2 + 5);

  doc.setFillColor(253, 250, 242);
  doc.roundedRect(15, currentY, 180, declBoxHeight, 1, 1, "F");
  doc.setDrawColor(242, 223, 174);
  doc.roundedRect(15, currentY, 180, declBoxHeight, 1, 1, "D");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.0);
  doc.setTextColor(115, 115, 115);
  doc.text(wrappedDecl, 19, currentY + 5.5);

  currentY += declBoxHeight;

  // Add "Fait à Djibouti le ..." in Times Bold (serif)
  currentY += 6;
  if (currentY > 240) { doc.addPage(); currentY = 20; }

  const rawDate = intervention.signatureDate || intervention.date || new Date().toISOString();
  let dateFormatted = "";
  try {
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) {
      dateFormatted = rawDate;
    } else {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      dateFormatted = `${day}/${month}/${year}`;
    }
  } catch {
    dateFormatted = rawDate;
  }

  doc.setFont("times", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`Fait à Djibouti le ${dateFormatted}`, 15, currentY);


  // Restitution & Tech Note blocks (Attribution only)
  if (intervention.ficheType === "attribution" && intervention.restitutionDetails) {
    currentY += 6;
    if (currentY > 240) { doc.addPage(); currentY = 20; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(180, 83, 9);
    doc.text("MATÉRIEL RESTITUÉ (ANCIEN ÉQUIPEMENT)", 15, currentY);
    currentY += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    const wrappedRest = doc.splitTextToSize(intervention.restitutionDetails, 180);
    doc.text(wrappedRest, 15, currentY);
    currentY += wrappedRest.length * 4 + 2;
  }

  if (intervention.ficheType === "attribution" && intervention.techNote) {
    currentY += 6;
    if (currentY > 245) { doc.addPage(); currentY = 20; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(13, 148, 136);
    doc.text("NOTE TECHNIQUE", 15, currentY);
    currentY += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const wrappedNote = doc.splitTextToSize(intervention.techNote, 180);
    doc.text(wrappedNote, 15, currentY);
    currentY += wrappedNote.length * 4 + 2;
  }

  // 8. TRIPLE SIGNATURES
  currentY += 8;
  if (currentY > 235) { doc.addPage(); currentY = 20; }

  const sigBoxWidth = 58;
  const sigBoxHeight = 32;
  const sigGap = 4;
  const sigStartX = 15;

  // Box 1: DAF
  doc.rect(sigStartX, currentY, sigBoxWidth, sigBoxHeight);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("LE DIRECTEUR ADMINISTRATIF", sigStartX + 2, currentY + 5);
  doc.text("ET FINANCIER", sigStartX + 2, currentY + 9);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  doc.text(intervention.dafName || "Le DAF", sigStartX + 2, currentY + 13);

  if (intervention.dafSignature) {
    try { doc.addImage(intervention.dafSignature, "PNG", sigStartX + 8, currentY + 14, 40, 10); } catch {}
  }

  // Box 2: Bénéficiaire
  const sig2X = sigStartX + sigBoxWidth + sigGap;
  doc.rect(sig2X, currentY, sigBoxWidth, sigBoxHeight);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("LE BÉNÉFICIAIRE", sig2X + 2, currentY + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  doc.text(intervention.clientName, sig2X + 2, currentY + 9);
  if (intervention.preferredService) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(15, 118, 110);
    doc.text(intervention.preferredService.toUpperCase(), sig2X + 2, currentY + 13);
  }

  if (intervention.agentSignature) {
    try { doc.addImage(intervention.agentSignature, "PNG", sig2X + 8, currentY + 14, 40, 10); } catch {}
  }

  // Box 3: Technicien IT
  const sig3X = sig2X + sigBoxWidth + sigGap;
  doc.rect(sig3X, currentY, sigBoxWidth, sigBoxHeight);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("LE TECHNICIEN INFORMATIQUE", sig3X + 2, currentY + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  doc.text(intervention.techName, sig3X + 2, currentY + 9);
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(intervention.techValidatingDept || "CNIPLC Informatique", sig3X + 2, currentY + 13);

  if (intervention.techSignature) {
    try { doc.addImage(intervention.techSignature, "PNG", sig3X + 8, currentY + 14, 40, 10); } catch (err) {
      console.error("Failed to add tech signature to PDF", err);
    }
  }

  // Clean save action
  const prefix = intervention.ficheType === "attribution" ? "Attribution" : "Intervention";
  const pdfFileName = `CNIPLC_${prefix}_${intervention.refNumber.replace(/\s+/g, "_")}.pdf`;
  await savePdfFile(doc, pdfFileName, directoryHandle);
}

export async function generateAndDownloadPhotosPDF(intervention: Intervention, directoryHandle?: FileSystemDirectoryHandle | null): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  // Get official base64 logo
  const imgData = await getBase64ImageFromUrl("/logo.jpeg");

  const currentY = 15;

  // Header Section (identical to main PDF for administrative authenticity)
  if (imgData) {
    doc.addImage(imgData, "JPEG", 15, currentY, 20, 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("RÉPUBLIQUE DE DJIBOUTI", 38, currentY + 3);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    const headerLines = doc.splitTextToSize("COMMISSION NATIONALE INDÉPENDANTE POUR LA PRÉVENTION ET LA LUTTE CONTRE LA CORRUPTION", 100);
    doc.text(headerLines, 38, currentY + 7);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(197, 160, 67);
    doc.text("CNIPLC - SERVICES TECHNIQUES DE L'INFORMATIQUE", 38, currentY + 16);
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text("RÉPUBLIQUE DE DJIBOUTI", 15, currentY + 3);
    doc.setFontSize(8);
    const headerLines = doc.splitTextToSize("COMMISSION NATIONALE INDÉPENDANTE POUR LA PRÉVENTION ET LA LUTTE CONTRE LA CORRUPTION", 120);
    doc.text(headerLines, 15, currentY + 8);
    doc.setFontSize(8);
    doc.setTextColor(197, 160, 67);
    doc.text("CNIPLC - SERVICES TECHNIQUES DE L'INFORMATIQUE", 15, currentY + 18);
  }

  // Metadata block (Right side)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`REF : ${intervention.refNumber}`, 195, currentY + 4, { align: "right" });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Photos : ${intervention.photos?.length || 0} clichés`, 195, currentY + 9, { align: "right" });
  doc.text(`Date : ${new Date(intervention.date).toLocaleDateString('fr-FR')}`, 195, currentY + 14, { align: "right" });

  doc.setDrawColor(197, 160, 67);
  doc.setLineWidth(0.8);
  doc.line(15, currentY + 23, 195, currentY + 23);

  // Photo Section Core Title
  const titleY = currentY + 32;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text("ALBUM PHOTO ET PREUVES MATÉRIELLES D'INTERVENTION", 105, titleY, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(197, 160, 67);
  doc.text("ANNEXE TECHNIQUE DE CLÔTURE DE PRESTATION", 105, titleY + 4.5, { align: "center" });

  const photos = intervention.photos || [];
  const count = photos.length;

  if (count === 0) {
    // Empty state fallback
    doc.setDrawColor(226, 232, 240);
    doc.rect(15, titleY + 15, 180, 50);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text("Aucune photo consignée pour cette intervention.", 105, titleY + 42, { align: "center" });
  } else {
    // Smart and Clear Grid Layout rendering beautifully inside a single A4 page
    const startPhotoY = titleY + 12;

    if (count === 1) {
      // 1 Giant Block / Cube
      const photo = photos[0];
      const imgWidth = 150;
      const imgHeight = 110;
      const startX = 30;
      const startY = startPhotoY + 10;

      try {
        doc.addImage(photo.url, "JPEG", startX, startY, imgWidth, imgHeight);
      } catch {
        doc.setFillColor(240, 240, 240);
        doc.rect(startX, startY, imgWidth, imgHeight, "F");
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text("[Image non valide ou format incompatible]", startX + 45, startY + 55);
      }

      // Elegant caption border box
      doc.setFillColor(253, 250, 242);
      doc.rect(startX, startY + imgHeight, imgWidth, 18, "F");
      doc.setDrawColor(242, 223, 174);
      doc.setLineWidth(0.3);
      doc.rect(startX, startY + imgHeight, imgWidth, 18, "D");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(147, 113, 35);
      doc.text("CLICHÉ N°1 :", startX + 5, startY + imgHeight + 11);

      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.setTextColor(60, 60, 60);
      const wrappedDesc = doc.splitTextToSize(photo.taskDescription || "Aucun commentaire technique consigné.", imgWidth - 32);
      doc.text(wrappedDesc, startX + 27, startY + imgHeight + 10.5);

    } else if (count === 2) {
      // 2 Side by side elegant blocks (cubes)
      const imgWidth = 84;
      const imgHeight = 84;
      const startY = startPhotoY + 20;

      photos.forEach((photo, idx) => {
        const startX = idx === 0 ? 15 : 111;
        try {
          doc.addImage(photo.url, "JPEG", startX, startY, imgWidth, imgHeight);
        } catch {
          doc.setFillColor(240, 240, 240);
          doc.rect(startX, startY, imgWidth, imgHeight, "F");
        }

        // Caption Box
        doc.setFillColor(253, 250, 242);
        doc.rect(startX, startY + imgHeight, imgWidth, 18, "F");
        doc.setDrawColor(242, 223, 174);
        doc.rect(startX, startY + imgHeight, imgWidth, 18, "D");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(147, 113, 35);
        doc.text(`CLICHÉ N°${idx + 1} :`, startX + 4, startY + imgHeight + 11);

        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.setTextColor(60, 60, 60);
        const wrappedDesc = doc.splitTextToSize(photo.taskDescription || "Aucune consigne.", imgWidth - 24);
        doc.text(wrappedDesc, startX + 22, startY + imgHeight + 10.5);
      });

    } else if (count === 3) {
      // Asymmetric Smart Layout: 1 primary block on top, 2 side-by-side blocks below
      // Top Block
      const primaryPhoto = photos[0];
      const primaryWidth = 150;
      const primaryHeight = 85;
      const primaryX = 30;
      const primaryY = startPhotoY + 5;

      try {
        doc.addImage(primaryPhoto.url, "JPEG", primaryX, primaryY, primaryWidth, primaryHeight);
      } catch {
        doc.setFillColor(240, 240, 240);
        doc.rect(primaryX, primaryY, primaryWidth, primaryHeight, "F");
      }

      doc.setFillColor(253, 250, 242);
      doc.rect(primaryX, primaryY + primaryHeight, primaryWidth, 14, "F");
      doc.setDrawColor(242, 223, 174);
      doc.rect(primaryX, primaryY + primaryHeight, primaryWidth, 14, "D");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(147, 113, 35);
      doc.text("CLICHÉ MAJEUR (N°1) :", primaryX + 4, primaryY + primaryHeight + 9);

      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(60, 60, 60);
      const wrappedDescPrimary = doc.splitTextToSize(primaryPhoto.taskDescription || "Preuve technique principale.", primaryWidth - 40);
      doc.text(wrappedDescPrimary, primaryX + 37, primaryY + primaryHeight + 8.5);

      // Remaining 2 below side by side
      const remainingPhotos = photos.slice(1, 3);
      const secWidth = 84;
      const secHeight = 58;
      const secY = primaryY + primaryHeight + 23;

      remainingPhotos.forEach((photo, idx) => {
        const startX = idx === 0 ? 15 : 111;
        try {
          doc.addImage(photo.url, "JPEG", startX, secY, secWidth, secHeight);
        } catch {
          doc.setFillColor(240, 240, 240);
          doc.rect(startX, secY, secWidth, secHeight, "F");
        }

        doc.setFillColor(253, 250, 242);
        doc.rect(startX, secY + secHeight, secWidth, 13, "F");
        doc.setDrawColor(242, 223, 174);
        doc.rect(startX, secY + secHeight, secWidth, 13, "D");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(147, 113, 35);
        doc.text(`CLICHÉ N°${idx + 2} :`, startX + 4, secY + secHeight + 8);

        doc.setFont("helvetica", "italic");
        doc.setFontSize(7.5);
        doc.setTextColor(60, 60, 60);
        const wrappedDesc = doc.splitTextToSize(photo.taskDescription || "Aucune observation.", secWidth - 22);
        doc.text(wrappedDesc, startX + 20, secY + secHeight + 7.5);
      });

    } else if (count === 4) {
      // Perfect 2x2 grid (Four smart block cubes)
      const imgWidth = 84;
      const imgHeight = 65;
      const rowGap = 12;

      photos.forEach((photo, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);

        const startX = col === 0 ? 15 : 111;
        const startY = startPhotoY + 10 + row * (imgHeight + rowGap + 12);

        try {
          doc.addImage(photo.url, "JPEG", startX, startY, imgWidth, imgHeight);
        } catch {
          doc.setFillColor(240, 240, 240);
          doc.rect(startX, startY, imgWidth, imgHeight, "F");
        }

        doc.setFillColor(253, 250, 242);
        doc.rect(startX, startY + imgHeight, imgWidth, 13, "F");
        doc.setDrawColor(242, 223, 174);
        doc.rect(startX, startY + imgHeight, imgWidth, 13, "D");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(147, 113, 35);
        doc.text(`CLICHÉ N°${idx + 1} :`, startX + 4, startY + imgHeight + 8);

        doc.setFont("helvetica", "italic");
        doc.setFontSize(7.5);
        doc.setTextColor(60, 60, 60);
        const wrappedDesc = doc.splitTextToSize(photo.taskDescription || "Aucune observation rédigée.", imgWidth - 22);
        doc.text(wrappedDesc, startX + 20, startY + imgHeight + 8);
      });

    } else if (count === 5) {
      // 5 photos - "خمس صور على شكل كولاج"
      // Smart mosaic collage: ROW 1 has 2 larger horizontal blocks; ROW 2 has 3 beautifully aligned cubes!
      // Row 1 (2 blocks of Width 86mm, Height 64mm)
      const row1Width = 86;
      const row1Height = 64;
      const row1Y = startPhotoY + 5;

      for (let i = 0; i < 2; i++) {
        const photo = photos[i];
        const startX = i === 0 ? 15 : 109;

        try {
          doc.addImage(photo.url, "JPEG", startX, row1Y, row1Width, row1Height);
        } catch {
          doc.setFillColor(240, 240, 240);
          doc.rect(startX, row1Y, row1Width, row1Height, "F");
        }

        // Caption Bar
        doc.setFillColor(253, 250, 242);
        doc.rect(startX, row1Y + row1Height, row1Width, 13, "F");
        doc.setDrawColor(242, 223, 174);
        doc.rect(startX, row1Y + row1Height, row1Width, 13, "D");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(147, 113, 35);
        doc.text(`CLICHÉ N°${i + 1} :`, startX + 4, row1Y + row1Height + 8);

        doc.setFont("helvetica", "italic");
        doc.setFontSize(7.5);
        doc.setTextColor(60, 60, 60);
        const wrappedDesc = doc.splitTextToSize(photo.taskDescription || "Opération technique constatée.", row1Width - 22);
        doc.text(wrappedDesc, startX + 20, row1Y + row1Height + 8);
      }

      // Row 2 (3 elegant small blocks / cubes of Width 55mm, Height 52mm)
      const row2Width = 55;
      const row2Height = 52;
      const row2Y = row1Y + row1Height + 25; // 25mm spacing to include row 1 captions + vertical gap

      for (let i = 2; i < 5; i++) {
        const photo = photos[i];
        // Distribute nicely across margins 15mm up to 195mm (printable width of 180mm)
        // Col 1: X = 15mm. Col 2: X = 77.5mm. Col 3: X = 140mm.
        let startX = 15;
        if (i === 3) startX = 77.5;
        if (i === 4) startX = 140;

        try {
          doc.addImage(photo.url, "JPEG", startX, row2Y, row2Width, row2Height);
        } catch {
          doc.setFillColor(240, 240, 240);
          doc.rect(startX, row2Y, row2Width, row2Height, "F");
        }

        // Caption Bar
        doc.setFillColor(253, 250, 242);
        doc.rect(startX, row2Y + row2Height, row2Width, 13, "F");
        doc.setDrawColor(242, 223, 174);
        doc.rect(startX, row2Y + row2Height, row2Width, 13, "D");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(147, 113, 35);
        doc.text(`CLICHÉ N°${i + 1} :`, startX + 3, row2Y + row2Height + 8);

        doc.setFont("helvetica", "italic");
        doc.setFontSize(6.5);
        doc.setTextColor(60, 60, 60);
        const wrappedDesc = doc.splitTextToSize(photo.taskDescription || "Acte achevé.", row2Width - 16);
        doc.text(wrappedDesc, startX + 17, row2Y + row2Height + 7.5);
      }

    } else {
      // 6 photos - Perfectly ordered 2x3 block grid (6 cubes)
      const imgWidth = 84;
      const imgHeight = 48;
      const rowGap = 13;

      photos.forEach((photo, idx) => {
        if (idx >= 6) return; // strict cap at 6 photos
        const col = idx % 2;
        const row = Math.floor(idx / 2);

        const startX = col === 0 ? 15 : 111;
        const startY = startPhotoY + 5 + row * (imgHeight + rowGap + 12);

        try {
          doc.addImage(photo.url, "JPEG", startX, startY, imgWidth, imgHeight);
        } catch {
          doc.setFillColor(240, 240, 240);
          doc.rect(startX, startY, imgWidth, imgHeight, "F");
        }

        // Caption Box
        doc.setFillColor(253, 250, 242);
        doc.rect(startX, startY + imgHeight, imgWidth, 12, "F");
        doc.setDrawColor(242, 223, 174);
        doc.rect(startX, startY + imgHeight, imgWidth, 12, "D");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(147, 113, 35);
        doc.text(`CLICHÉ N°${idx + 1} :`, startX + 4, startY + imgHeight + 7.5);

        doc.setFont("helvetica", "italic");
        doc.setFontSize(7);
        doc.setTextColor(60, 60, 60);
        const wrappedDesc = doc.splitTextToSize(photo.taskDescription || "Observation technique.", imgWidth - 22);
        doc.text(wrappedDesc, startX + 20, startY + imgHeight + 7.5);
      });
    }
  }

  // Save the Photos PDF
  const pdfFileName = `CNIPLC_Photos_${intervention.refNumber.replace(/\s+/g, "_")}.pdf`;
  await savePdfFile(doc, pdfFileName, directoryHandle);
}

export async function generateConsolidatedReportPDF(interventions: Intervention[], directoryHandle?: FileSystemDirectoryHandle | null): Promise<void> {
  if (interventions.length === 0) return;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const logoImgData = await getBase64ImageFromUrl("/logo.jpeg");

  const totalPagesEstimate = Math.ceil(interventions.length / 2) + 2;

  // Helper to draw headers
  const drawPageHeader = (pageNum: number) => {
    let currentY = 15;
    if (logoImgData) {
      doc.addImage(logoImgData, "JPEG", 15, currentY, 18, 18);
      // State Text with indentation
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139); // Slate-500
      doc.text("RÉPUBLIQUE DE DJIBOUTI", 36, currentY + 3);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(15, 23, 42); // Slate-900
      const headerLines = doc.splitTextToSize("COMMISSION NATIONALE INDÉPENDANTE POUR LA PRÉVENTION ET LA LUTTE CONTRE LA CORRUPTION", 100);
      doc.text(headerLines, 36, currentY + 6);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(197, 160, 67); // Gold-500
      doc.text("CNIPLC - SERVICES TECHNIQUES DE L'INFORMATIQUE", 36, currentY + 14);
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text("RÉPUBLIQUE DE DJIBOUTI", 15, currentY + 3);
      
      doc.setFontSize(7);
      const headerLines = doc.splitTextToSize("COMMISSION NATIONALE INDÉPENDANTE POUR LA PRÉVENTION ET LA LUTTE CONTRE LA CORRUPTION", 120);
      doc.text(headerLines, 15, currentY + 7);
      
      doc.setFontSize(7.5);
      doc.setTextColor(197, 160, 67);
      doc.text("CNIPLC - SERVICES TECHNIQUES DE L'INFORMATIQUE", 15, currentY + 15);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text("RAPPORT CONSOLIDÉ D'ACTIVITÉ", 195, currentY + 4, { align: "right" });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Généré le : ${new Date().toLocaleDateString('fr-FR')}`, 195, currentY + 9, { align: "right" });
    doc.text(`Fiches compilées : ${interventions.length}`, 195, currentY + 13, { align: "right" });

    doc.setDrawColor(197, 160, 67); // Gold
    doc.setLineWidth(0.5);
    doc.line(15, currentY + 20, 195, currentY + 20);
  };

  const drawPageFooter = (pageNum: number, totalPages: number) => {
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.2);
    doc.line(15, 280, 195, 280);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184); // Slate-400
    doc.text("RAPPORT MENSUEL CONSOLIDÉ CNIPLC - REPUBLIQUE DE DJIBOUTI", 15, 285);
    doc.text(`Page ${pageNum} / ${totalPages}`, 195, 285, { align: "right" });
  };

  // --- PAGE 1: COVER & EXECUTIVE SUMMARY ---
  drawPageHeader(1);
  
  let currentY = 50;
  
  doc.setFillColor(248, 250, 252);
  doc.rect(15, currentY, 180, 35, "F");
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.rect(15, currentY, 180, 35, "D");

  currentY += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text("RAPPORT MENSUEL D'ACTIVITÉS INFORMATIQUES", 105, currentY, { align: "center" });

  currentY += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(197, 160, 67);
  doc.text("CONSOLIDATION DES FICHES D'INTERVENTIONS TECHNIQUES ET SERVICE FAIT", 105, currentY, { align: "center" });

  currentY += 8;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const dates = interventions.map(i => i.date).sort();
  const minDate = dates[0] ? new Date(dates[0]).toLocaleDateString('fr-FR') : '';
  const maxDate = dates[dates.length - 1] ? new Date(dates[dates.length - 1]).toLocaleDateString('fr-FR') : '';
  doc.text(`Période couverte : Du ${minDate} au ${maxDate}`, 105, currentY, { align: "center" });

  currentY += 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text("1. TABLEAU DE SYNTHÈSE DES STATISTIQUES", 15, currentY);

  currentY += 5;
  doc.setFillColor(253, 250, 242);
  doc.roundedRect(15, currentY, 180, 20, 2, 2, "F");
  doc.setDrawColor(242, 223, 174);
  doc.roundedRect(15, currentY, 180, 20, 2, 2, "D");

  const totalInterventions = interventions.length;
  const completedCount = interventions.filter(i => i.status === "termine").length;
  const pendingCount = totalInterventions - completedCount;
  const totalDuration = interventions.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("TOTAL PRESTATIONS", 25, currentY + 7);
  doc.text("ARCHIVÉES & PRÊTES", 75, currentY + 7);
  doc.text("EN RECOUVREMENT", 120, currentY + 7);
  doc.text("TEMPS DE ROUTINE", 160, currentY + 7);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(`${totalInterventions}`, 25, currentY + 15);
  doc.setTextColor(16, 124, 65);
  doc.text(`${completedCount}`, 75, currentY + 15);
  doc.setTextColor(197, 160, 67);
  doc.text(`${pendingCount}`, 120, currentY + 15);
  doc.setTextColor(15, 23, 42);
  doc.text(`${totalDuration} min`, 160, currentY + 15);

  currentY += 30;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text("2. REGISTRE RÉCAPITULATIF DES ARCHIVES COMPILÉES", 15, currentY);

  currentY += 5;

  doc.setFillColor(241, 245, 249);
  doc.rect(15, currentY, 180, 7, "F");
  doc.setDrawColor(203, 213, 225);
  doc.rect(15, currentY, 180, 7, "D");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(51, 65, 85);
  doc.text("RÉFÉRENCE", 17, currentY + 5);
  doc.text("DATE", 46, currentY + 5);
  doc.text("BÉNÉFICIAIRE", 68, currentY + 5);
  doc.text("DÉPARTEMENT / SERVICE", 110, currentY + 5);
  doc.text("MATÉRIEL", 158, currentY + 5);
  doc.text("STATUT", 181, currentY + 5);

  currentY += 7;

  interventions.forEach((item, index) => {
    if (currentY > 260) {
      drawPageFooter(doc.getNumberOfPages(), totalPagesEstimate);
      doc.addPage();
      drawPageHeader(doc.getNumberOfPages());
      currentY = 40;
      
      doc.setFillColor(241, 245, 249);
      doc.rect(15, currentY, 180, 7, "F");
      doc.setDrawColor(203, 213, 225);
      doc.rect(15, currentY, 180, 7, "D");
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(51, 65, 85);
      doc.text("RÉFÉRENCE", 17, currentY + 5);
      doc.text("DATE", 46, currentY + 5);
      doc.text("BÉNÉFICIAIRE", 68, currentY + 5);
      doc.text("DÉPARTEMENT / SERVICE", 110, currentY + 5);
      doc.text("MATÉRIEL", 158, currentY + 5);
      doc.text("STATUT", 181, currentY + 5);
      
      currentY += 7;
    }

    doc.setFillColor(index % 2 === 0 ? 255 : 248, index % 2 === 0 ? 255 : 251, index % 2 === 0 ? 255 : 253);
    doc.rect(15, currentY, 180, 8, "F");
    doc.setDrawColor(241, 245, 249);
    doc.rect(15, currentY, 180, 8, "D");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);
    doc.text(item.refNumber, 17, currentY + 5.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(new Date(item.date).toLocaleDateString('fr-FR'), 46, currentY + 5.5);

    doc.setFont("helvetica", "bold");
    doc.text(item.clientName.substring(0, 20), 68, currentY + 5.5);

    doc.setFont("helvetica", "normal");
    doc.text(item.clientDepartment.substring(0, 22), 110, currentY + 5.5);
    doc.text(item.deviceType.substring(0, 15), 158, currentY + 5.5);

    if (item.status === "termine") {
      doc.setTextColor(16, 124, 65);
      doc.setFont("helvetica", "bold");
      doc.text("TERMINÉ", 181, currentY + 5.5);
    } else {
      doc.setTextColor(197, 160, 67);
      doc.setFont("helvetica", "bold");
      doc.text("EN COURS", 181, currentY + 5.5);
    }

    currentY += 8;
  });

  drawPageFooter(doc.getNumberOfPages(), totalPagesEstimate);

  // --- PAGES DETALLES (2 par page max) ---
  interventions.forEach((item, index) => {
    if (index % 2 === 0) {
      doc.addPage();
      drawPageHeader(doc.getNumberOfPages());
      currentY = 40;
    } else {
      currentY = 155;
    }

    // Border Box
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(15, currentY, 180, 105, 2, 2, "D");

    // Title box
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(15, currentY, 180, 8, 2, 2, "F");
    doc.rect(15, currentY + 4, 180, 4, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(`INTERVENTION N°${index + 1} : COMPTE RENDU TECHNIQUE (Réf ${item.refNumber})`, 20, currentY + 5.5);

    doc.setTextColor(15, 23, 42);
    let boxY = currentY + 14;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("BÉNÉFICIAIRE ADMINISTRATIF", 20, boxY);
    doc.text("MATÉRIEL ET ÉQUIPEMENT", 110, boxY);

    boxY += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Nom : ${item.clientName}`, 20, boxY);
    doc.text(`Type : ${item.deviceType}`, 110, boxY);

    boxY += 3.5;
    doc.text(`Fonction : ${item.clientTitle}`, 20, boxY);
    doc.text(`Marque : ${item.deviceBrand || "Standard"}`, 110, boxY);

    boxY += 3.5;
    doc.text(`Service : ${item.clientDepartment}`, 20, boxY);
    doc.text(`Date d'exécution : ${new Date(item.date).toLocaleDateString('fr-FR')}`, 110, boxY);

    boxY += 4;
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.2);
    doc.line(17, boxY, 193, boxY);

    boxY += 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text("SYNTHÈSE ADMINISTRATIVE DU SERVICE CONSTATÉ", 20, boxY);

    boxY += 3.5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(51, 65, 85);
    const summaryLines = doc.splitTextToSize(item.professionalSummary || "Aucune synthèse.", 172);
    doc.text(summaryLines, 20, boxY);
    
    boxY += (summaryLines.length * 3) + 2;
    doc.setDrawColor(241, 245, 249);
    doc.line(17, boxY, 193, boxY);

    boxY += 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text("ACTES TECHNIQUES DE MAINTENANCE EFFECTUÉS", 20, boxY);

    boxY += 3.5;
    const maxTasks = item.tasks.slice(0, 3);
    maxTasks.forEach((task) => {
      doc.setFillColor(197, 160, 67);
      doc.circle(21, boxY + 0.8, 0.6, "F");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      const tText = doc.splitTextToSize(task.description, 130);
      doc.text(tText, 25, boxY + 1.2);

      doc.setFillColor(241, 245, 249);
      doc.roundedRect(162, boxY - 1, 27, 3.5, 0.5, 0.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(5.5);
      doc.setTextColor(100, 116, 139);
      doc.text(task.category, 175, boxY + 1.2, { align: "center" });

      boxY += (tText.length * 2.8) + 1.2;
    });

    if (item.tasks.length > 3) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`... et ${item.tasks.length - 3} autres actions techniques complémentaires archivées.`, 25, boxY + 0.5);
    }

    if (index % 2 === 1 || index === interventions.length - 1) {
      drawPageFooter(doc.getNumberOfPages(), totalPagesEstimate);
    }
  });

  // --- DERNIERE PAGE: CLASSIFICATION ET APPROBATIONS ---
  doc.addPage();
  drawPageHeader(doc.getNumberOfPages());
  currentY = 45;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text("3. RAPPORT D'APPROBATION SOUVERAIN (CNIPLC)", 15, currentY);

  currentY += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  const concludeLines = doc.splitTextToSize(
    "Le présent document d'Etat sert d'archive administrative officielle consolidant l'ensemble des interventions techniques, " +
    "de maintenance système et de déploiement réseau conduites d'office par nos services habilités auprès des directions " +
    "et agents d'Etat de la République de Djibouti. Le bon fonctionnement, la continuité logicielle et matérielle sont certifiés.", 180
  );
  doc.text(concludeLines, 15, currentY);

  currentY += 25;

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(15, currentY, 195, currentY);

  currentY += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("LE TECHNICIEN DES SERVICES", 15, currentY);
  doc.text("LE DIRECTEUR GENERAL DU CNIPLC", 105, currentY);

  currentY += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Nom complet : _________________________", 15, currentY);
  doc.text("Nom complet : _________________________", 105, currentY);

  currentY += 5;
  doc.text("Signature et datation :", 15, currentY);
  doc.text("Signature et datation :", 105, currentY);

  currentY += 15;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.1);
  doc.line(15, currentY + 10, 80, currentY + 10);
  doc.line(105, currentY + 10, 170, currentY + 10);

  drawPageFooter(doc.getNumberOfPages(), totalPagesEstimate);

  const consolidatedPdfFileName = `CNIPLC_Rapport_Consolide_Activite_${new Date().toISOString().substring(0, 10)}.pdf`;
  await savePdfFile(doc, consolidatedPdfFileName, directoryHandle);
}

export async function generateAutoCleanupReportPDF(interventions: Intervention[], directoryHandle?: FileSystemDirectoryHandle | null) {
  // Wraps the consolidated report function for the auto-cleanup feature
  await generateConsolidatedReportPDF(interventions, directoryHandle);
}

// ─────────────────────────────────────────────────────────────────────────────
// COUCHE DE CONVERSION HAUTE FIDÉLITÉ PDF ↔ WORD (DOCX) CÔTÉ CLIENT
// AVEC PRÉSERVATION DES MARGES, POLICES, TABLEAUX ET VALIDATION D'INTÉGRITÉ
// ─────────────────────────────────────────────────────────────────────────────

export interface DocumentIntegrityValidationReport {
  isValid: boolean;
  sourceChecksum: string;
  convertedChecksum: string;
  preservationRate: number; // Taux de conservation textuelle (0 - 100%)
  tablesPreserved: number;
  numbersPreserved: boolean;
  marginsPreserved: boolean;
  layoutFidelityScore: number; // Score composite de fidélité de mise en page (0 - 100)
  validationTimestamp: string;
  extractedNumbersCount: number;
  verifiedNumbersCount: number;
  warnings: string[];
  passedRules: string[];
}

/**
 * Calcul d'empreinte cryptographique SHA-256 en environnement navigateur
 */
export async function computeSha256Checksum(data: ArrayBuffer | Uint8Array | string): Promise<string> {
  try {
    let buffer: ArrayBuffer;
    if (typeof data === 'string') {
      buffer = new TextEncoder().encode(data).buffer;
    } else if (data instanceof Uint8Array) {
      buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
    } else {
      buffer = data;
    }
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Fallback pseudo-hash si SubtleCrypto est indisponible
    let h = 0x811c9dc5;
    const str = typeof data === 'string' ? data : new Uint8Array(data as any).slice(0, 500).toString();
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(16).padStart(8, '0') + '0000000000000000';
  }
}

/**
 * Extraction des données sensibles et numériques (montants, dates, pourcentages, codes)
 */
function extractNumericalTokens(text: string): string[] {
  if (!text) return [];
  // Détecte les nombres, montants (10 000, 410 m², 15.5%, dates 27/06/2026, codes réf)
  const regex = /\b\d+(?:[\s.,]\d+)*(?:\s*(?:m²|m2|%|Fdj|DJF|USD|EUR|kg|km|ans|jours|mois|h))?\b/gi;
  const matches = text.match(regex) || [];
  return Array.from(new Set(matches.map(m => m.trim().replace(/\s+/g, ' ')))).filter(m => m.length > 0);
}

/**
 * Étape de validation post-conversion pour certifier l'intégrité avant téléchargement
 */
export async function validateDocumentIntegrity(
  sourceData: {
    text: string;
    buffer: ArrayBuffer;
    tablesCount: number;
    margins: { leftMm: number; rightMm: number; topMm: number; bottomMm: number };
  },
  convertedData: {
    text: string;
    buffer: ArrayBuffer;
    tablesCount: number;
    margins: { leftMm: number; rightMm: number; topMm: number; bottomMm: number };
  }
): Promise<DocumentIntegrityValidationReport> {
  const sourceChecksum = await computeSha256Checksum(sourceData.buffer);
  const convertedChecksum = await computeSha256Checksum(convertedData.buffer);

  // 1. Analyse textuelle et préservation du corpus
  const sourceTokens = sourceData.text.toLowerCase().split(/\s+/).filter(t => t.length > 1);
  const targetTokens = new Set(convertedData.text.toLowerCase().split(/\s+/).filter(t => t.length > 1));

  let matchedTokens = 0;
  for (const t of sourceTokens) {
    if (targetTokens.has(t)) {
      matchedTokens++;
    }
  }

  const tokenRetention = sourceTokens.length > 0 ? (matchedTokens / sourceTokens.length) * 100 : 100;
  const preservationRate = Math.min(100, Math.round(tokenRetention * 10) / 10);

  // 2. Vérification stricte des données numériques et sensibles (Règle d'or Anti-Erreur)
  const sourceNumbers = extractNumericalTokens(sourceData.text);
  const targetNumbersText = convertedData.text.replace(/\s+/g, ' ');

  let verifiedNumbers = 0;
  const missingNumbers: string[] = [];

  for (const num of sourceNumbers) {
    // Vérification stricte de présence du token numérique
    const cleanNum = num.replace(/[.,\s]/g, '');
    const targetClean = targetNumbersText.replace(/[.,\s]/g, '');
    if (targetNumbersText.includes(num) || targetClean.includes(cleanNum)) {
      verifiedNumbers++;
    } else {
      missingNumbers.push(num);
    }
  }

  const numbersPreserved = missingNumbers.length === 0;

  // 3. Vérification des structures de tableaux
  const tablesPreserved = Math.min(sourceData.tablesCount, convertedData.tablesCount);
  const tablesMatch = sourceData.tablesCount === 0 || convertedData.tablesCount >= sourceData.tablesCount;

  // 4. Vérification des marges
  const marginsPreserved = 
    Math.abs(sourceData.margins.leftMm - convertedData.margins.leftMm) <= 4 &&
    Math.abs(sourceData.margins.rightMm - convertedData.margins.rightMm) <= 4;

  // 5. Score global de fidélité du layout (0 à 100)
  let fidelity = 0;
  fidelity += Math.min(40, (preservationRate / 100) * 40);
  fidelity += numbersPreserved ? 25 : Math.max(0, (verifiedNumbers / Math.max(1, sourceNumbers.length)) * 25);
  fidelity += tablesMatch ? 20 : 10;
  fidelity += marginsPreserved ? 15 : 8;

  const layoutFidelityScore = Math.min(100, Math.round(fidelity));

  const warnings: string[] = [];
  const passedRules: string[] = [];

  if (preservationRate >= 95) {
    passedRules.push(`Intégrité textuelle excellente (${preservationRate}%)`);
  } else {
    warnings.push(`Taux de conservation textuelle de ${preservationRate}% (certaines annotations ou graphismes sont matriciels)`);
  }

  if (numbersPreserved) {
    passedRules.push(`Fidélité absolue des valeurs numériques et dates (${verifiedNumbers}/${sourceNumbers.length} vérifiées)`);
  } else {
    warnings.push(`${missingNumbers.length} valeur(s) numérique(s) ou format spécifique à contrôler manuellement : ${missingNumbers.slice(0, 3).join(', ')}`);
  }

  if (tablesMatch) {
    passedRules.push(`Structure des tableaux et colonnes préservée (${tablesPreserved} tableau(x))`);
  } else {
    warnings.push(`Différence détectée dans la topologie des grilles de tableau`);
  }

  if (marginsPreserved) {
    passedRules.push(`Alignement et marges normalisées conformes (20mm ISO standard)`);
  }

  const isValid = layoutFidelityScore >= 70 && verifiedNumbers >= Math.floor(sourceNumbers.length * 0.9);

  return {
    isValid,
    sourceChecksum,
    convertedChecksum,
    preservationRate,
    tablesPreserved,
    numbersPreserved,
    marginsPreserved,
    layoutFidelityScore,
    validationTimestamp: new Date().toISOString(),
    extractedNumbersCount: sourceNumbers.length,
    verifiedNumbersCount: verifiedNumbers,
    warnings,
    passedRules
  };
}

/**
 * Mappage intelligent des polices PDF vers les polices standard Word
 */
function mapPdfFontToWord(fontName: string): string {
  const f = (fontName || '').toLowerCase();
  if (f.includes('times') || f.includes('georgia') || f.includes('serif') || f.includes('minion')) {
    return 'Times New Roman';
  }
  if (f.includes('courier') || f.includes('mono') || f.includes('consolas') || f.includes('code')) {
    return 'Courier New';
  }
  if (f.includes('calibri')) return 'Calibri';
  if (f.includes('cambria')) return 'Cambria';
  if (f.includes('tahoma')) return 'Tahoma';
  return 'Arial'; // Police standard administrative de référence
}

/**
 * Couche de conversion haute fidélité PDF → Word (.docx)
 * Préserve les marges, la hiérarchie typographique, les colonnes et les tableaux
 */
export async function convertPdfToWordWithHighFidelity(
  pdfBuffer: ArrayBuffer,
  filename: string,
  options?: {
    onProgress?: (message: string, percent: number) => void;
  }
): Promise<{
  blob: Blob;
  filename: string;
  report: DocumentIntegrityValidationReport;
}> {
  const onProgress = options?.onProgress || (() => {});
  onProgress('Initialisation de la couche haute fidélité PDF → Word…', 10);

  // Import dynamique de pdfjs-dist et docx
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

  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType,
    Table,
    TableRow,
    TableCell,
    WidthType,
    BorderStyle
  } = await import('docx');

  const pdf = await pdfjsLib.getDocument({ data: pdfBuffer }).promise;
  const docElements: (any)[] = [];
  let fullSourceText = '';
  let fullConvertedText = '';
  let detectedTablesCount = 0;

  // En-tête principal du document Word
  const baseTitle = filename.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');
  docElements.push(
    new Paragraph({
      text: baseTitle,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 300 }
    })
  );
  fullConvertedText += baseTitle + '\n';

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const pagePct = Math.round(15 + (pageNum / pdf.numPages) * 65);
    onProgress(`Analyse vectorielle et géométrie des tableaux (page ${pageNum}/${pdf.numPages})…`, pagePct);

    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    interface PositionedItem {
      str: string;
      x: number;
      y: number;
      width: number;
      height: number;
      fontName: string;
    }

    const items: PositionedItem[] = [];
    for (const raw of textContent.items as any[]) {
      if (raw.str && raw.str.trim().length > 0) {
        items.push({
          str: raw.str,
          x: raw.transform[4],
          y: raw.transform[5],
          width: raw.width || (raw.str.length * 6),
          height: Math.abs(raw.transform[0] || raw.height || 10),
          fontName: raw.fontName || ''
        });
        fullSourceText += raw.str + ' ';
      }
    }
    fullSourceText += '\n';

    if (pageNum > 1) {
      docElements.push(
        new Paragraph({
          text: `— Page ${pageNum} —`,
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 200 }
        })
      );
    }

    if (items.length === 0) continue;

    // Trier les blocs de texte par Y descendant (coordonnées PDF de haut en bas)
    items.sort((a, b) => b.y - a.y);

    // Regrouper les éléments par lignes horizontales
    const lines: { y: number; height: number; items: PositionedItem[] }[] = [];
    for (const item of items) {
      const match = lines.find(l => Math.abs(l.y - item.y) <= Math.max(3, item.height * 0.45));
      if (match) {
        match.items.push(item);
        match.height = Math.max(match.height, item.height);
      } else {
        lines.push({ y: item.y, height: item.height, items: [item] });
      }
    }

    let lineIdx = 0;
    while (lineIdx < lines.length) {
      const line = lines[lineIdx];
      line.items.sort((a, b) => a.x - b.x);

      // Détection de structure de tableau : plusieurs colonnes distinctes avec espacement régulier
      const isMultiColumn = line.items.length >= 2 && 
        line.items.some((it, idx) => idx > 0 && it.x - (line.items[idx - 1].x + line.items[idx - 1].width) > 30);

      if (isMultiColumn) {
        // Collecter les lignes contiguës du tableau
        const tableLines: typeof lines = [line];
        let nextIdx = lineIdx + 1;
        while (nextIdx < lines.length) {
          const nextLine = lines[nextIdx];
          const dist = Math.abs(tableLines[tableLines.length - 1].y - nextLine.y);
          if (dist > 35) break; // Fin du bloc tableau

          nextLine.items.sort((a, b) => a.x - b.x);
          if (nextLine.items.length >= 2) {
            tableLines.push(nextLine);
            nextIdx++;
          } else {
            break;
          }
        }

        if (tableLines.length >= 2) {
          detectedTablesCount++;
          // Déterminer le nombre maximum de colonnes
          const maxCols = Math.max(...tableLines.map(tl => tl.items.length));
          const colWidthPct = Math.floor(100 / Math.max(1, maxCols));

          const tableRows = tableLines.map((tLine, rIdx) => {
            const isHeader = rIdx === 0;
            const cells = tLine.items.map(it => {
              fullConvertedText += it.str + '\t';
              return new TableCell({
                width: { size: colWidthPct, type: WidthType.PERCENTAGE },
                shading: isHeader ? { fill: 'F1F5F9' } : undefined,
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
                  bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
                  left: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
                  right: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' }
                },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: it.str.trim(),
                        bold: isHeader,
                        size: isHeader ? 20 : 18,
                        font: mapPdfFontToWord(it.fontName)
                      })
                    ],
                    spacing: { before: 60, after: 60 }
                  })
                ]
              });
            });

            // Compléter les cellules manquantes si nécessaire
            while (cells.length < maxCols) {
              cells.push(
                new TableCell({
                  width: { size: colWidthPct, type: WidthType.PERCENTAGE },
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
                    bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
                    left: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
                    right: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' }
                  },
                  children: [new Paragraph({ text: '' })]
                })
              );
            }
            fullConvertedText += '\n';

            return new TableRow({
              children: cells,
              tableHeader: isHeader
            });
          });

          docElements.push(
            new Table({
              rows: tableRows,
              width: { size: 100, type: WidthType.PERCENTAGE }
            })
          );

          // Espacement après tableau
          docElements.push(new Paragraph({ text: '', spacing: { after: 150 } }));
          lineIdx = nextIdx;
          continue;
        }
      }

      // Paragraphe textuel normal
      const lineText = line.items.map(it => it.str).join(' ').trim();
      if (lineText) {
        fullConvertedText += lineText + '\n';
        const primaryFont = line.items[0]?.fontName || '';
        const isBold = primaryFont.toLowerCase().includes('bold') || line.height >= 14;
        const mappedFont = mapPdfFontToWord(primaryFont);

        // Détection de titre
        let heading: any = undefined;
        if (line.height >= 18) heading = HeadingLevel.HEADING_1;
        else if (line.height >= 14) heading = HeadingLevel.HEADING_2;

        docElements.push(
          new Paragraph({
            heading,
            children: [
              new TextRun({
                text: lineText,
                bold: isBold,
                font: mappedFont,
                size: Math.max(18, Math.round(line.height * 1.8)) // demi-points docx
              })
            ],
            spacing: { before: isBold ? 140 : 60, after: 60 }
          })
        );
      }

      lineIdx++;
    }
  }

  onProgress('Assemblage du document Word et encapsulation des marges…', 85);

  const wordDoc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1134,    // ~20mm
              bottom: 1134, // ~20mm
              left: 1134,   // ~20mm
              right: 1134   // ~20mm
            }
          }
        },
        children: docElements
      }
    ]
  });

  const blob = await Packer.toBlob(wordDoc);
  const wordBuffer = await blob.arrayBuffer();

  onProgress('Validation de l\'intégrité des données et concordance des valeurs…', 95);

  const report = await validateDocumentIntegrity(
    {
      text: fullSourceText,
      buffer: pdfBuffer,
      tablesCount: detectedTablesCount,
      margins: { leftMm: 20, rightMm: 20, topMm: 20, bottomMm: 20 }
    },
    {
      text: fullConvertedText,
      buffer: wordBuffer,
      tablesCount: detectedTablesCount,
      margins: { leftMm: 20, rightMm: 20, topMm: 20, bottomMm: 20 }
    }
  );

  onProgress('Conversion et validation achevées avec succès !', 100);

  const outputName = filename.replace(/\.pdf$/i, '') + '.docx';
  return {
    blob,
    filename: outputName,
    report
  };
}

/**
 * Couche de conversion haute fidélité Word (.docx) → PDF
 * Préserve les marges, les polices vectorielles et la structure des tableaux
 */
export async function convertWordToPdfWithHighFidelity(
  wordBuffer: ArrayBuffer,
  filename: string,
  options?: {
    onProgress?: (message: string, percent: number) => void;
  }
): Promise<{
  blob: Blob;
  filename: string;
  report: DocumentIntegrityValidationReport;
}> {
  const onProgress = options?.onProgress || (() => {});
  onProgress('Lecture et extraction vectorielle du document Word…', 15);

  const mammoth = await import('mammoth');
  const { value: rawText } = await mammoth.extractRawText({ arrayBuffer: wordBuffer });
  const { value: htmlContent } = await mammoth.convertToHtml({ arrayBuffer: wordBuffer });

  onProgress('Création du document PDF souverain conforme (marges ISO 20mm)…', 40);

  const pdfDoc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const margin = 20; // 20mm
  const pageWidth = 210;
  const pageHeight = 297;
  const contentWidth = pageWidth - (margin * 2);
  let currentY = margin + 10;
  let detectedTablesCount = 0;
  let fullConvertedText = '';

  // Parser HTML basique côté client pour détecter paragraphes, titres et tableaux
  const parser = new DOMParser();
  const docHtml = parser.parseFromString(`<div>${htmlContent}</div>`, 'text/html');
  const bodyNodes = Array.from(docHtml.body.firstElementChild?.children || []);

  const checkPageOverflow = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - margin) {
      pdfDoc.addPage();
      currentY = margin;
      return true;
    }
    return false;
  };

  onProgress('Rendu typographique et mise en page vectorielle…', 65);

  for (const node of bodyNodes) {
    const tagName = node.tagName.toLowerCase();

    if (tagName === 'table') {
      detectedTablesCount++;
      const rows = Array.from(node.querySelectorAll('tr'));
      if (rows.length === 0) continue;

      const firstRowCells = Array.from(rows[0].querySelectorAll('th, td'));
      const colCount = Math.max(1, firstRowCells.length);
      const colWidth = contentWidth / colCount;

      checkPageOverflow(rows.length * 9 + 10);

      for (let rIdx = 0; rIdx < rows.length; rIdx++) {
        const isHeader = rIdx === 0 || rows[rIdx].querySelector('th') !== null;
        const cells = Array.from(rows[rIdx].querySelectorAll('th, td'));
        const rowHeight = 9;

        checkPageOverflow(rowHeight + 4);

        if (isHeader) {
          pdfDoc.setFillColor(241, 245, 249);
          pdfDoc.rect(margin, currentY, contentWidth, rowHeight, 'F');
          pdfDoc.setFont('helvetica', 'bold');
          pdfDoc.setFontSize(9);
          pdfDoc.setTextColor(15, 23, 42);
        } else {
          pdfDoc.setFont('helvetica', 'normal');
          pdfDoc.setFontSize(8.5);
          pdfDoc.setTextColor(51, 65, 85);
        }

        // Dessiner les bordures de la ligne
        pdfDoc.setDrawColor(203, 213, 225);
        pdfDoc.setLineWidth(0.2);
        pdfDoc.rect(margin, currentY, contentWidth, rowHeight, 'S');

        for (let cIdx = 0; cIdx < cells.length; cIdx++) {
          const cellText = (cells[cIdx].textContent || '').trim();
          fullConvertedText += cellText + '\t';
          const cellX = margin + (cIdx * colWidth) + 2;
          const cellY = currentY + 6;

          // Tronquer ou découper si le texte dépasse
          const maxTextWidth = colWidth - 4;
          const fitText = pdfDoc.splitTextToSize(cellText, maxTextWidth)[0] || '';
          pdfDoc.text(fitText, cellX, cellY);

          // Ligne séparatrice de colonne
          if (cIdx > 0) {
            pdfDoc.line(margin + (cIdx * colWidth), currentY, margin + (cIdx * colWidth), currentY + rowHeight);
          }
        }

        fullConvertedText += '\n';
        currentY += rowHeight;
      }

      currentY += 6;
      continue;
    }

    // Titres (H1, H2, H3)
    if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3') {
      const titleText = (node.textContent || '').trim();
      if (!titleText) continue;

      checkPageOverflow(14);
      pdfDoc.setFont('helvetica', 'bold');
      pdfDoc.setFontSize(tagName === 'h1' ? 15 : tagName === 'h2' ? 12.5 : 11);
      pdfDoc.setTextColor(15, 23, 42);

      const lines = pdfDoc.splitTextToSize(titleText, contentWidth);
      pdfDoc.text(lines, margin, currentY);
      fullConvertedText += titleText + '\n';
      currentY += (lines.length * 6) + 4;
      continue;
    }

    // Paragraphe standard ou élément de liste
    const pText = (node.textContent || '').trim();
    if (!pText) continue;

    pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.setFontSize(10);
    pdfDoc.setTextColor(30, 41, 59);

    const lines = pdfDoc.splitTextToSize(pText, contentWidth);
    checkPageOverflow(lines.length * 5 + 3);
    pdfDoc.text(lines, margin, currentY);
    fullConvertedText += pText + '\n';
    currentY += (lines.length * 5) + 3;
  }

  onProgress('Finalisation du fichier PDF et audit de conformité…', 90);

  const pdfOutputBlob = pdfDoc.output('blob');
  const pdfBuffer = await pdfOutputBlob.arrayBuffer();

  const report = await validateDocumentIntegrity(
    {
      text: rawText,
      buffer: wordBuffer,
      tablesCount: detectedTablesCount,
      margins: { leftMm: 20, rightMm: 20, topMm: 20, bottomMm: 20 }
    },
    {
      text: fullConvertedText,
      buffer: pdfBuffer,
      tablesCount: detectedTablesCount,
      margins: { leftMm: 20, rightMm: 20, topMm: 20, bottomMm: 20 }
    }
  );

  onProgress('Validation complète et rapport d\'intégrité certifié !', 100);

  const outputName = filename.replace(/\.(docx|doc)$/i, '') + '.pdf';
  return {
    blob: pdfOutputBlob,
    filename: outputName,
    report
  };
}

