/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Intervention } from "../types";
import { Printer, Calendar, User, UserCheck, Shield, Award, Layers, Download, Sparkles, Star, PenTool, X, FileText } from "lucide-react";
import { generateAndDownloadPDF, generateAndDownloadPhotosPDF } from "../utils/pdfGenerator";
import { generateAndDownloadWord } from "../utils/wordGenerator";
import PhotoCollage from "./PhotoCollage";

interface ProfessionalFicheProps {
  intervention: Intervention;
  onPrint: () => void;
  onUpdateSignature?: (sig: string, dept: string) => void;
}

export default function ProfessionalFiche({ intervention, onPrint, onUpdateSignature }: ProfessionalFicheProps) {
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [isWordLoading, setIsWordLoading] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [validatingDept, setValidatingDept] = useState(intervention.techValidatingDept || "");
  const [isDrawing, setIsDrawing] = useState(false);
  const modalCanvasRef = React.useRef<HTMLCanvasElement | null>(null);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = modalCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = modalCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    e.preventDefault();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = modalCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const saveSignature = () => {
    const canvas = modalCanvasRef.current;
    if (canvas) {
      const sigData = canvas.toDataURL("image/png");
      if (onUpdateSignature) {
        onUpdateSignature(sigData, validatingDept);
      }
      setIsSigning(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsPdfLoading(true);
    try {
      // 1. Generate and download high-quality text-only administrative fiche
      await generateAndDownloadPDF(intervention);
      
      // 2. If photos exist, automatically generate and download the separate, standalone, pixel-perfect photo album PDF
      if (intervention.photos && intervention.photos.length > 0) {
        await generateAndDownloadPhotosPDF(intervention);
      }
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Une erreur est survenue lors de la compilation du PDF officiel.");
    } finally {
      setIsPdfLoading(false);
    }
  };

  const handleDownloadWord = async () => {
    setIsWordLoading(true);
    try {
      await generateAndDownloadWord(intervention);
    } catch (err) {
      console.error("Word generation failed:", err);
      alert("Une erreur est survenue lors de la génération du fichier Word.");
    } finally {
      setIsWordLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 max-w-4xl mx-auto my-4 transition-all hover:border-slate-300">
      <div className="flex flex-wrap justify-between items-center pb-4 mb-6 border-b border-slate-100 gap-4 no-print">
        <div>
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Layers className="w-5 h-5 text-teal-600" />
            {intervention.ficheType === "attribution" ? "Aperçu de la Fiche d'Attribution" : "Aperçu de la Fiche de Service Fait"}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Ce document respecte les standards administratifs officiels. Prêt à être imprimé et signé.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            id="btn-download-pdf"
            disabled={isPdfLoading}
            onClick={handleDownloadPDF}
            className={`text-sm font-semibold px-4 py-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-all ${
              isPdfLoading
                ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                : "bg-teal-50 hover:bg-teal-100 border-teal-200/50 text-teal-800"
            }`}
          >
            {isPdfLoading ? (
              <>
                <Sparkles className="w-4 h-4 text-teal-600 animate-spin" />
                Génération PDF...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-teal-600" />
                Télécharger le PDF
              </>
            )}
          </button>
          <button
            id="btn-download-word"
            disabled={isWordLoading}
            onClick={handleDownloadWord}
            className={`text-sm font-semibold px-4 py-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-all ${
              isWordLoading
                ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                : "bg-indigo-50 hover:bg-indigo-100 border-indigo-200/50 text-indigo-800"
            }`}
          >
            {isWordLoading ? (
              <>
                <Sparkles className="w-4 h-4 text-indigo-600 animate-spin" />
                Génération Word...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 text-indigo-600" />
                Télécharger en Word
              </>
            )}
          </button>
          <button
            id="btn-print-fiche"
            onClick={onPrint}
            className="bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Printer className="w-4 h-4" />
            Imprimer la Fiche Officielle
          </button>
        </div>
      </div>

      {/* Actual Printable Page: Has styled styling for screen, but customized to look like paper */}
      <div 
        id={`fiche-print-container-${intervention.id}`}
        className="print:p-10 p-8 bg-white border border-slate-200 print:border-0 rounded-lg max-w-[210mm] mx-auto print:mx-0 font-sans text-slate-900 leading-relaxed"
      >
        {/* State Coat of Arms / Official Header Placeholder */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5 mb-6 gap-4">
          <div className="flex items-center gap-4">
            <img 
              src="/logo.jpeg" 
              alt="Logo CNIPLC" 
              className="w-16 h-16 object-contain shrink-0" 
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">RÉPUBLIQUE DE DJIBOUTI</div>
              <div className="text-xs font-black tracking-wide text-slate-800 uppercase leading-snug">
                COMMISSION NATIONALE INDÉPENDANTE POUR LA PRÉVENTION ET LA LUTTE CONTRE LA CORRUPTION
              </div>
              <div className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded inline-block uppercase tracking-wider border border-teal-100">
                CNIPLC - SERVICES TECHNIQUES DE L'INFORMATIQUE
              </div>
            </div>
          </div>
          <div className="text-right space-y-1 shrink-0">
            <div className="text-sm font-mono font-bold text-slate-900">REF : {intervention.refNumber}</div>
            <div className="text-xs text-slate-500 flex items-center justify-end gap-1">
              <Calendar className="w-3.5 h-3.5" /> Date : {new Date(intervention.date).toLocaleDateString('fr-FR')}
            </div>
            <div className="text-xs text-slate-400">Durée : {intervention.durationMinutes} min</div>
          </div>
        </div>

        {/* Main Title */}
        <div className="text-center my-6 space-y-2">
          <h1 className="text-2xl font-extrabold uppercase tracking-tight text-slate-900 print:text-xl">
            {intervention.ficheType === "attribution" ? "FICHE D'ATTRIBUTION ET DE RESTITUTION DE MATÉRIEL" : "FICHE D'INTERVENTION TECHNIQUE"}
          </h1>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-mono">
            {intervention.ficheType === "attribution" ? "& ATTESTATION DE MATÉRIEL ATTRIBUÉ" : "& ATTESTATION DE SERVICE FAIT"}
          </p>
        </div>

        {/* Preferred Service Badge */}
        {intervention.preferredService && (
          <div className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200/50 text-teal-800 text-xs font-bold uppercase tracking-wider font-mono shadow-sm">
              <Star className="w-4 h-4 text-teal-600 fill-teal-500" />
              Service demandé : {intervention.preferredService}
            </span>
          </div>
        )}

        {/* Parties grid */}
        <div className="grid grid-cols-2 gap-6 my-6 text-sm">
          {/* L'informaticien (Technicien) */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 print:bg-transparent print:border print:border-slate-300">
            <div className="text-sm font-bold text-teal-800 uppercase tracking-wide mb-2.5 flex items-center gap-1.5 border-b border-teal-100 pb-1">
              <User className="w-3.5 h-3.5" /> Intervenant (Technicien IT)
            </div>
            <div className="font-bold text-slate-800 text-[17px]">{intervention.techName}</div>
            <div className="text-sm text-slate-600 font-medium">{intervention.techTitle}</div>
            <div className="text-xs text-slate-500 mt-1">Département Validant : {intervention.techValidatingDept || "CNIPLC Informatique"}</div>
          </div>

          {/* Le Bénéficiaire (Client) */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 print:bg-transparent print:border print:border-slate-300">
            <div className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-2.5 flex items-center gap-1.5 border-b border-slate-200 pb-1">
              <UserCheck className="w-3.5 h-3.5" /> Bénéficiaire (Demandeur)
            </div>
            <div className="font-bold text-slate-800 text-[17px]">{intervention.clientName}</div>
            <div className="text-sm text-slate-650">{intervention.clientTitle}</div>
            <div className="text-xs text-slate-500 mt-1">Département/Direction : {intervention.clientDepartment}</div>
          </div>
        </div>

        {/* Détails du Matériel concerné */}
        <div className="border border-slate-200 rounded-lg p-4 my-6 text-[15px]">
          <div className="text-sm font-bold uppercase tracking-wide text-slate-700 mb-3 border-b border-slate-100 pb-1.5">
            {intervention.ficheType === "attribution" ? "Référence de l'Équipement Attribué" : "Détails de l'Équipement Informatique"}
          </div>
          {intervention.ficheType === "attribution" ? (
            <div className="font-mono text-sm">
              <span className="text-slate-500">Référence :</span><br />
              <strong className="text-slate-800 text-[15px]">{intervention.equipRef || "Non spécifiée"}</strong>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 font-mono text-sm">
              <div>
                <span className="text-slate-550">Type de matériel :</span><br />
                <strong className="text-slate-850 uppercase">{intervention.deviceType}</strong>
              </div>
              <div>
                <span className="text-slate-550">Modèle / Marque :</span><br />
                <strong className="text-slate-850">{intervention.deviceBrand || "Standard / Indéterminé"}</strong>
              </div>
              <div>
                <span className="text-slate-550">N° Inventaire (Asset) :</span><br />
                <strong className="text-slate-850">{intervention.deviceInventory || "N/A"}</strong>
              </div>
            </div>
          )}
        </div>

        {/* Detailed Description / Synthese */}
        <div className="my-6">
          <div className="text-sm font-bold uppercase tracking-wide text-slate-700 mb-2 border-b border-slate-100 pb-1">
            {intervention.ficheType === "attribution" ? "Description de l'Attribution" : "Rapport Synthétique d'Intervention"}
          </div>
          <p className="text-[15px] text-slate-800 whitespace-pre-wrap leading-relaxed text-justify bg-slate-50/50 p-4 rounded border border-slate-100/60 print:bg-transparent print:border-0 print:p-0">
            {intervention.professionalSummary || "Aucune description rédigée."}
          </p>
        </div>

        {/* Notes rapides / observations contextuelles */}
        {intervention.quickNotes && (
          <div className="my-6 border border-teal-100 bg-teal-50/25 rounded-lg p-3.5 print:bg-transparent print:border-slate-300">
            <div className="text-sm font-bold uppercase tracking-wide text-teal-800 print:text-slate-800 mb-2 border-b border-teal-100 print:border-slate-200 pb-1 font-sans">
              Notes rapides & Observations contextuelles
            </div>
            <p className="text-sm text-slate-650 print:text-slate-700 whitespace-pre-wrap italic font-sans leading-relaxed">
              {intervention.quickNotes}
            </p>
          </div>
        )}

        {/* Itemized Tasks accomplished */}
        <div className="my-6">
          <div className="text-sm font-bold uppercase tracking-wide text-slate-700 mb-2.5 border-b border-slate-100 pb-1">
            {intervention.ficheType === "attribution" ? "Désignation du Matériel Attribué" : "Nomenclature des Actions Techniques Réalisées"}
          </div>
          <table className="w-full text-sm text-left border-collapse border border-slate-200">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-xs">
                <th className="p-2.5 border-r border-slate-200">N°</th>
                <th className="p-2.5 border-r border-slate-200">{intervention.ficheType === "attribution" ? "Désignation" : "Action de Maintenance Corrective / Préventive"}</th>
                <th className="p-2.5 border-r border-slate-200">{intervention.ficheType === "attribution" ? "Caractéristiques Techniques" : "Catégorie"}</th>
                <th className="p-2.5 text-center">{intervention.ficheType === "attribution" ? "État" : "Statut"}</th>
              </tr>
            </thead>
            <tbody>
              {intervention.tasks.map((task, idx) => (
                <tr key={task.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-2.5 border-r border-slate-200 text-slate-500 font-mono text-center w-8">{idx + 1}</td>
                  <td className="p-2.5 border-r border-slate-200 text-slate-850 leading-normal font-medium">{task.description}</td>
                  <td className="p-2.5 border-r border-slate-200">
                    <span className="px-2 py-0.5 rounded text-xs text-teal-800 bg-teal-50 border border-teal-100 font-medium">
                      {task.category}
                    </span>
                  </td>
                  <td className="p-2.5 text-center font-bold text-emerald-700 font-sans">
                    {intervention.ficheType === "attribution" ? task.status || "Neuf" : "✓ EFFECTUÉ"}
                  </td>
                </tr>
              ))}
              {intervention.tasks.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-slate-400 font-mono">
                    {intervention.ficheType === "attribution" ? "Aucun matériel enregistré." : "Aucune action technique enregistrée."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Restitution Details (Attribution only) */}
        {intervention.ficheType === "attribution" && intervention.restitutionDetails && (
          <div className="my-6 border border-amber-200 bg-amber-50/30 rounded-lg p-4 print:bg-transparent print:border-slate-300">
            <div className="text-sm font-bold uppercase tracking-wide text-amber-800 print:text-slate-800 mb-2 border-b border-amber-200 print:border-slate-200 pb-1">
              Matériel Restitué (Ancien Équipement)
            </div>
            <p className="text-sm text-slate-750 whitespace-pre-wrap leading-relaxed">
              {intervention.restitutionDetails}
            </p>
          </div>
        )}

        {/* Tech Note (Attribution only) */}
        {intervention.ficheType === "attribution" && intervention.techNote && (
          <div className="my-6 border border-teal-100 bg-teal-50/25 rounded-lg p-3.5 print:bg-transparent print:border-slate-300">
            <div className="text-sm font-bold uppercase tracking-wide text-teal-800 print:text-slate-800 mb-2 border-b border-teal-100 print:border-slate-200 pb-1">
              Note Technique
            </div>
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {intervention.techNote}
            </p>
          </div>
        )}

        {/* Dynamic Photo board Collage */}
        {intervention.photos && intervention.photos.length > 0 && (
          <div className="my-6 page-break-inside-avoid">
            <PhotoCollage photos={intervention.photos} theme="light" />
          </div>
        )}

        {/* Commitment and legal declaration */}
        <div className="my-6 bg-slate-50/80 p-3.5 rounded-lg border border-slate-200/60 text-xs text-slate-650 text-justify print:bg-transparent print:border print:border-slate-300 print:text-[11px]/relaxed">
          <p className="leading-relaxed">
            <strong>Déclaration administrative :</strong> {intervention.ficheType === "attribution"
              ? "Ce document atteste de l'attribution effective du matériel informatique décrit ci-dessus par les services techniques du CNIPLC au bénéficiaire désigné. Le signataire du DAF, le bénéficiaire et le technicien informatique attestent par leurs signatures respectives que le matériel a été remis en bon état, configuré et opérationnel."
              : "Ce document atteste de la réalisation effective des travaux de dépannage, d'assistance, d'installation d'équipements ou de maintenance réseau décrits ci-dessus par les services informatiques d'État (CNIPLC). Le bénéficiaire (ou le Directeur de Service) atteste par sa signature que les systèmes informatiques mentionnés sont réparés, fonctionnels, conformes aux exigences professionnelles et que la prestation a été clôturée avec succès."}
          </p>
        </div>

        {/* Place and Date */}
        <div className="my-5 text-left font-serif text-base font-semibold text-slate-900 print:text-[14px]">
          Fait à Djibouti le {(() => {
            const rawDate = intervention.signatureDate || intervention.date || new Date().toISOString();
            try {
              const d = new Date(rawDate);
              if (isNaN(d.getTime())) return rawDate;
              return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
            } catch {
              return rawDate;
            }
          })()}
        </div>

        {/* Triple-Signature Block */}
        <div className="grid grid-cols-3 gap-4 mt-8 text-sm">
          {/* Signature du DAF */}
          <div className="h-36 border border-slate-300 rounded p-3 flex flex-col justify-between print:bg-transparent">
            <div>
              <div className="font-bold uppercase text-slate-800 tracking-wider text-[11px] leading-tight print:text-[10px]">Le Directeur Administratif et Financier</div>
              <div className="text-slate-500 font-semibold text-xs mt-1 print:text-[10px]">{intervention.dafName || "Le DAF"}</div>
            </div>
            <div className="flex-1 flex items-center justify-center my-2">
              {intervention.dafSignature ? (
                <img src={intervention.dafSignature} alt="Signature DAF" className="max-h-16 object-contain drop-shadow-sm" />
              ) : (
                <div className="text-xs text-slate-300 italic">Signature</div>
              )}
            </div>
          </div>

          {/* Signature de l'Agent / Bénéficiaire */}
          <div className="h-36 border border-slate-300 rounded p-3 flex flex-col justify-between print:bg-transparent">
            <div>
              <div className="font-bold uppercase text-slate-800 tracking-wider text-[11px] leading-tight print:text-[10px]">Le Bénéficiaire</div>
              <div className="text-slate-500 font-semibold text-xs mt-1 print:text-[10px]">{intervention.clientName}</div>
              {intervention.preferredService && (
                <div className="text-teal-700 font-bold text-[9px] mt-0.5 uppercase tracking-wide print:text-[8px]">
                  {intervention.preferredService}
                </div>
              )}
            </div>
            <div className="flex-1 flex items-center justify-center my-2">
              {intervention.agentSignature ? (
                <img src={intervention.agentSignature} alt="Signature Agent" className="max-h-16 object-contain drop-shadow-sm" />
              ) : (
                <div className="text-xs text-slate-300 italic">Signature</div>
              )}
            </div>
          </div>

          {/* Signature du Technicien IT */}
          <div className="h-36 border border-slate-300 rounded p-3 flex flex-col justify-between print:bg-transparent relative">
            <div>
              <div className="font-bold uppercase text-slate-800 tracking-wider text-[11px] leading-tight print:text-[10px]">Le Technicien Informatique</div>
              <div className="text-slate-500 font-semibold text-xs mt-1 print:text-[10px]">{intervention.techName}</div>
              <div className="text-slate-400 text-[9px] print:text-[8px]">{intervention.techValidatingDept || "CNIPLC Informatique"}</div>
            </div>
            <div className="flex-1 flex items-center justify-center my-2">
              {intervention.techSignature ? (
                <img src={intervention.techSignature} alt="Signature Technicien" className="max-h-16 object-contain drop-shadow-sm" />
              ) : (
                <button
                  type="button"
                  onClick={() => setIsSigning(true)}
                  className="no-print bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  Signer
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Signature Draw Modal */}
      {isSigning && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PenTool className="w-5 h-5 text-teal-650" />
                Signer la Fiche d'Intervention
              </h3>
              <button 
                onClick={() => setIsSigning(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Département Validant
              </label>
              <input
                type="text"
                placeholder="ex: Direction des Systèmes d'Information (DSI)"
                value={validatingDept}
                onChange={(e) => setValidatingDept(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Dessinez votre signature
              </label>
              <div className="relative">
                <canvas
                  ref={modalCanvasRef}
                  width={400}
                  height={150}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="border border-slate-200 rounded-lg cursor-crosshair w-full h-[150px] bg-slate-50 touch-none"
                />
                <button
                  type="button"
                  onClick={clearSignature}
                  className="absolute bottom-2 right-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-[10px] font-bold px-2 py-1 rounded transition-colors"
                >
                  Effacer
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsSigning(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-500 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={saveSignature}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
              >
                Confirmer la Signature
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
