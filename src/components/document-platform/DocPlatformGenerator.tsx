import { useState } from 'react';
import { 
  FileCheck, 
  Download, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  RefreshCw,
  Printer
} from 'lucide-react';
import { InstitutionDocument } from '../../types/documentPlatform';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';

interface DocPlatformGeneratorProps {
  documents: InstitutionDocument[];
  onAddAuditLog: (action: any, title: string, details: string) => void;
}

export default function DocPlatformGenerator({
  documents,
  onAddAuditLog
}: DocPlatformGeneratorProps) {
  const [selectedDocId, setSelectedDocId] = useState<string>(documents[0]?.id || '');
  const [synthesisType, setSynthesisType] = useState<'executive' | 'juridique' | 'stats'>('executive');
  const [customNotes, setCustomNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSuccess, setGeneratedSuccess] = useState<string | null>(null);

  const currentDoc = documents.find(d => d.id === selectedDocId) || documents[0];

  const handleGenerateDocx = async () => {
    setIsGenerating(true);
    setGeneratedSuccess(null);

    try {
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // Administrative Official Header
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: "RÉPUBLIQUE DE DJIBOUTI", bold: true, size: 24, font: "Arial" }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: "Unité – Égalité – Paix", italics: true, size: 18, font: "Arial" }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: "--------------------------------------------------------", color: "999999" }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ 
                  text: "COMMISSION NATIONALE INDÉPENDANTE POUR LA PRÉVENTION ET LA LUTTE CONTRE LA CORRUPTION", 
                  bold: true, 
                  size: 20, 
                  font: "Arial",
                  color: "1A365D"
                }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: "PLATEFORME IA DOCUMENTAIRE ET RAG INSTITUTIONNEL", size: 16, color: "718096" }),
              ],
            }),
            new Paragraph({ text: "" }),

            // Reference metadata
            new Paragraph({
              children: [
                new TextRun({ text: "RÉFÉRENCE D'ARCHIVE : ", bold: true }),
                new TextRun({ text: `CNIPLC/DOC-IA/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}` }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "DATE DE GÉNÉRATION : ", bold: true }),
                new TextRun({ text: new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "DOCUMENT DE RÉFÉRENCE : ", bold: true }),
                new TextRun({ text: currentDoc.title }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "DÉPARTEMENT ÉMETTEUR : ", bold: true }),
                new TextRun({ text: currentDoc.department }),
              ],
            }),
            new Paragraph({ text: "" }),

            // Document Title
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ 
                  text: `SYNTHÈSE OFFICIELLE D'INTELLIGENCE DOCUMENTAIRE`, 
                  bold: true, 
                  size: 26,
                  color: "0F172A"
                }),
              ],
            }),
            new Paragraph({ text: "" }),

            // Section 1 : Objet & Résumé
            new Paragraph({
              heading: HeadingLevel.HEADING_2,
              children: [
                new TextRun({ text: "1. OBJET ET CONTEXTE ANALYTIQUE", bold: true, size: 22, color: "1E293B" }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ 
                  text: `La présente synthèse a été compilée automatiquement à partir de l'indexation vectorielle Qdrant et validée par les protocoles de conformité RLS de la CNIPLC. Le document analysé (${currentDoc.originalFilename}) couvre ${currentDoc.pageCount} pages et est classifié "${currentDoc.securityClassification}".` 
                }),
              ],
            }),
            new Paragraph({ text: "" }),

            // Section 2 : Analyse synthétique
            new Paragraph({
              heading: HeadingLevel.HEADING_2,
              children: [
                new TextRun({ text: "2. EXTRAITS ET RECOMMANDATIONS MAJEURES", bold: true, size: 22, color: "1E293B" }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: currentDoc.summarySnippet }),
              ],
            }),
            new Paragraph({ text: "" }),

            // Section 3 : Notes additionnelles
            ...(customNotes.trim() ? [
              new Paragraph({
                heading: HeadingLevel.HEADING_2,
                children: [
                  new TextRun({ text: "3. OBSERVATIONS DE L'AGENT HABILITÉ", bold: true, size: 22, color: "1E293B" }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: customNotes }),
                ],
              }),
              new Paragraph({ text: "" }),
            ] : []),

            // Validation Stamp Block
            new Paragraph({ text: "" }),
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({ text: "Fait à Djibouti, le " + new Date().toLocaleDateString('fr-FR'), italics: true }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({ text: "Pour la Commission Nationale Indépendante (CNIPLC)", bold: true }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({ text: "Le Responsable de la Documentation Numérique & IA", italics: true }),
              ],
            }),
          ]
        }]
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `CNIPLC_Synthese_${currentDoc.id}_${Date.now()}.docx`);
      setGeneratedSuccess(`Document Word (.docx) généré et téléchargé avec succès !`);
      onAddAuditLog('GENERATE_DOCX', currentDoc.title, 'Génération synthèse officielle DOCX conforme');
    } catch (err: any) {
      alert("Erreur lors de la génération Word: " + (err?.message || "Erreur inconnue"));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGeneratePdf = () => {
    setIsGenerating(true);
    setGeneratedSuccess(null);

    try {
      const doc = new jsPDF();

      // Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("RÉPUBLIQUE DE DJIBOUTI", 105, 18, { align: "center" });

      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.text("Unité – Égalité – Paix", 105, 24, { align: "center" });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(26, 54, 93);
      doc.text("COMMISSION NATIONALE INDÉPENDANTE POUR LA PRÉVENTION", 105, 33, { align: "center" });
      doc.text("ET LA LUTTE CONTRE LA CORRUPTION (CNIPLC)", 105, 38, { align: "center" });

      doc.setDrawColor(200, 200, 200);
      doc.line(20, 42, 190, 42);

      // Metadata
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.text(`RÉF : CNIPLC/IA-PDF/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`, 20, 50);
      doc.text(`DATE : ${new Date().toLocaleDateString('fr-FR')}`, 20, 56);
      doc.text(`DÉPARTEMENT : ${currentDoc.department}`, 20, 62);
      doc.text(`CLASSIFICATION : ${currentDoc.securityClassification}`, 20, 68);

      // Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text("SYNTHÈSE EXÉCUTIVE D'INTELLIGENCE DOCUMENTAIRE", 105, 82, { align: "center" });

      // Body
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("1. Document Analysé", 20, 94);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(currentDoc.title, 20, 101);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("2. Résumé Analytique & Données Indexées", 20, 114);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      const splitText = doc.splitTextToSize(currentDoc.summarySnippet, 170);
      doc.text(splitText, 20, 122);

      if (customNotes.trim()) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("3. Observations Complémentaires", 20, 145);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        const splitNotes = doc.splitTextToSize(customNotes, 170);
        doc.text(splitNotes, 20, 153);
      }

      // Seal & Signature block
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.text(`Fait à Djibouti, le ${new Date().toLocaleDateString('fr-FR')}`, 140, 240);
      doc.setFont("helvetica", "bold");
      doc.text("Pour la CNIPLC - Service IA & RAG", 140, 248);

      doc.save(`CNIPLC_Synthese_${currentDoc.id}_${Date.now()}.pdf`);
      setGeneratedSuccess(`Rapport PDF officiel généré et téléchargé avec succès !`);
      onAddAuditLog('GENERATE_PDF', currentDoc.title, 'Génération rapport PDF officiel avec sceau');
    } catch (err: any) {
      alert("Erreur lors de la génération PDF: " + (err?.message || "Erreur"));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <FileCheck className="w-6 h-6 text-teal-400" />
          Générateur &amp; Exportateur de Synthèses Documentaires
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Génération automatisée de documents officiels Word (.docx) et PDF conformes à la charte CNIPLC
        </p>
      </div>

      {generatedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{generatedSuccess}</span>
        </div>
      )}

      {/* Generator Form */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-5">
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            1. Choisissez le document source
          </label>
          <select
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
            className="w-full bg-slate-950 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            {documents.map((doc) => (
              <option key={doc.id} value={doc.id}>
                [{doc.department}] {doc.title} ({doc.pageCount} pages)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            2. Type de synthèse institutionnelle
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setSynthesisType('executive')}
              className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                synthesisType === 'executive'
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-slate-950/60 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <div className="font-bold mb-0.5">Synthèse Exécutive</div>
              <div className="text-[11px] opacity-80">Points clés, chiffres et recommandations pour la Direction</div>
            </button>

            <button
              type="button"
              onClick={() => setSynthesisType('juridique')}
              className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                synthesisType === 'juridique'
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-slate-950/60 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <div className="font-bold mb-0.5">Note Juridique &amp; Textes</div>
              <div className="text-[11px] opacity-80">Articles applicables, conformité et sanctions prévues</div>
            </button>

            <button
              type="button"
              onClick={() => setSynthesisType('stats')}
              className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                synthesisType === 'stats'
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-slate-950/60 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <div className="font-bold mb-0.5">Bilan Statistique</div>
              <div className="text-[11px] opacity-80">Tableaux de progression, indicateurs clés et ratios</div>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            3. Annotations ou directives particulières (optionnel)
          </label>
          <textarea
            rows={3}
            value={customNotes}
            onChange={(e) => setCustomNotes(e.target.value)}
            placeholder="Ex : Mentionner expressément l'urgence pour le comité d'évaluation du jeudi..."
            className="w-full bg-slate-950/80 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none font-sans"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center gap-3">
          <button
            onClick={handleGenerateDocx}
            disabled={isGenerating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition-all cursor-pointer hover:scale-[1.02]"
          >
            {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>Télécharger en Word (.docx)</span>
          </button>

          <button
            onClick={handleGeneratePdf}
            disabled={isGenerating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs shadow-lg shadow-red-500/20 transition-all cursor-pointer hover:scale-[1.02]"
          >
            {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
            <span>Générer le PDF Officiel</span>
          </button>
        </div>
      </div>
    </div>
  );
}
