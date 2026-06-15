/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Intervention } from "../types";
import { Printer, Calendar, User, UserCheck, Shield, Award, Layers, Download, Sparkles } from "lucide-react";
import { generateAndDownloadPDF, generateAndDownloadPhotosPDF } from "../utils/pdfGenerator";
import PhotoCollage from "./PhotoCollage";

interface ProfessionalFicheProps {
  intervention: Intervention;
  onPrint: () => void;
}

export default function ProfessionalFiche({ intervention, onPrint }: ProfessionalFicheProps) {
  const [isPdfLoading, setIsPdfLoading] = useState(false);

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

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 max-w-4xl mx-auto my-4 transition-all hover:border-slate-300">
      <div className="flex flex-wrap justify-between items-center pb-4 mb-6 border-b border-slate-100 gap-4 no-print">
        <div>
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Layers className="w-5 h-5 text-teal-600" />
            Aperçu de la Fiche de Service Fait
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
            FICHE D'INTERVENTION TECHNIQUE
          </h1>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-mono">
            & ATTESTATION DE SERVICE FAIT
          </p>
        </div>

        {/* Parties grid */}
        <div className="grid grid-cols-2 gap-6 my-6 text-sm">
          {/* L'informaticien (Technicien) */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 print:bg-transparent print:border print:border-slate-300">
            <div className="text-xs font-bold text-teal-800 uppercase tracking-wide mb-2.5 flex items-center gap-1.5 border-b border-teal-100 pb-1">
              <User className="w-3.5 h-3.5" /> Intervenant (Technicien IT)
            </div>
            <div className="font-semibold text-slate-800 text-base">{intervention.techName}</div>
            <div className="text-xs text-slate-500">{intervention.techTitle}</div>
            <div className="text-xs text-slate-400 mt-1">Département d'Origine : CNIPLC Informatique</div>
          </div>

          {/* Le Bénéficiaire (Client) */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 print:bg-transparent print:border print:border-slate-300">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2.5 flex items-center gap-1.5 border-b border-slate-200 pb-1">
              <UserCheck className="w-3.5 h-3.5" /> Bénéficiaire (Demandeur)
            </div>
            <div className="font-semibold text-slate-800 text-base">{intervention.clientName}</div>
            <div className="text-xs text-slate-600">{intervention.clientTitle}</div>
            <div className="text-xs text-slate-400 mt-1">Département/Direction : {intervention.clientDepartment}</div>
          </div>
        </div>

        {/* Détails du Matériel concerné */}
        <div className="border border-slate-200 rounded-lg p-4 my-6 text-sm">
          <div className="text-xs font-bold uppercase tracking-wide text-slate-700 mb-3 border-b border-slate-100 pb-1.5">
            Détails de l'Équipement Informatique
          </div>
          <div className="grid grid-cols-3 gap-4 font-mono text-xs">
            <div>
              <span className="text-slate-400">Type de matériel :</span><br />
              <strong className="text-slate-800 uppercase">{intervention.deviceType}</strong>
            </div>
            <div>
              <span className="text-slate-400">Modèle / Marque :</span><br />
              <strong className="text-slate-800">{intervention.deviceBrand || "Standard / Indéterminé"}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-mono">N° Inventaire (Asset) :</span><br />
              <strong className="text-slate-800">{intervention.deviceInventory || "N/A"}</strong>
            </div>
          </div>
        </div>

        {/* Detailed Description / Synthese */}
        <div className="my-6">
          <div className="text-xs font-bold uppercase tracking-wide text-slate-700 mb-2 border-b border-slate-100 pb-1">
            Rapport Synthétique d'Intervention
          </div>
          <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed text-justify bg-slate-50/50 p-3.5 rounded border border-slate-100/60 print:bg-transparent print:border-0 print:p-0">
            {intervention.professionalSummary || "Aucune description rédigée."}
          </p>
        </div>

        {/* Notes rapides / observations contextuelles */}
        {intervention.quickNotes && (
          <div className="my-6 border border-teal-100 bg-teal-50/25 rounded-lg p-3.5 print:bg-transparent print:border-slate-300">
            <div className="text-xs font-bold uppercase tracking-wide text-teal-800 print:text-slate-800 mb-2 border-b border-teal-100 print:border-slate-200 pb-1 font-sans">
              Notes rapides & Observations contextuelles
            </div>
            <p className="text-xs text-slate-600 print:text-slate-700 whitespace-pre-wrap italic font-sans leading-normal">
              {intervention.quickNotes}
            </p>
          </div>
        )}

        {/* Itemized Tasks accomplished */}
        <div className="my-6">
          <div className="text-xs font-bold uppercase tracking-wide text-slate-700 mb-2.5 border-b border-slate-100 pb-1">
            Nomenclature des Actions Techniques Réalisées
          </div>
          <table className="w-full text-xs text-left border-collapse border border-slate-200">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
                <th className="p-2 border-r border-slate-200">N°</th>
                <th className="p-2 border-r border-slate-200">Action de Maintenance Corrective / Préventive</th>
                <th className="p-2 border-r border-slate-200">Catégorie</th>
                <th className="p-2 text-center">Statut</th>
              </tr>
            </thead>
            <tbody>
              {intervention.tasks.map((task, idx) => (
                <tr key={task.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-2 border-r border-slate-200 text-slate-500 font-mono text-center w-8">{idx + 1}</td>
                  <td className="p-2 border-r border-slate-200 text-slate-800 leading-normal">{task.description}</td>
                  <td className="p-2 border-r border-slate-200">
                    <span className="px-1.5 py-0.5 rounded text-[10px] text-teal-800 bg-teal-50 border border-teal-100">
                      {task.category}
                    </span>
                  </td>
                  <td className="p-2 text-center font-bold text-emerald-700 font-sans">
                    ✓ EFFECTUÉ
                  </td>
                </tr>
              ))}
              {intervention.tasks.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-slate-400 font-mono">
                    Aucune action technique enregistrée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic Photo board Collage */}
        {intervention.photos && intervention.photos.length > 0 && (
          <div className="my-6 page-break-inside-avoid">
            <PhotoCollage photos={intervention.photos} theme="light" />
          </div>
        )}

        {/* Commitment and legal declaration */}
        <div className="my-6 bg-slate-50/80 p-3 rounded-lg border border-slate-200/60 text-[11px] text-slate-500 text-justify print:bg-transparent print:border print:border-slate-300 print:text-[10px]/normal">
          <p className="leading-normal">
            <strong>Déclaration administrative :</strong> Ce document atteste de la réalisation effective des travaux de dépannage, d'assistance, d'installation d'équipements ou de maintenance réseau décrits ci-dessus par les services informatiques d'État (CNIPLC). Le bénéficiaire (or le Directeur de Service) atteste par sa signature que les systèmes informatiques mentionnés sont d'une part réparés, fonctionnels, conformes aux exigences professionnelles et que la prestation a été clôturée avec succès.
          </p>
        </div>

        {/* Double-Signature Block */}
        <div className="grid grid-cols-2 gap-10 mt-10 text-xs">
          {/* Signature Technicien */}
          <div className="h-40 border border-slate-300 rounded p-3 flex flex-col justify-between print:bg-transparent">
            <div>
              <div className="font-bold uppercase text-slate-800 tracking-wider">L'Informaticien Intervenant</div>
              <div className="text-slate-400 text-[10px] mt-0.5">CNIPLC Informatique</div>
            </div>
            <div className="border-t border-slate-200 pt-1.5 text-slate-500 text-[10px] flex justify-between">
              <span>Date : {new Date().toLocaleDateString('fr-FR')}</span>
              <span className="italic">Signature</span>
            </div>
          </div>

          {/* Signature Directeur ou Bénéficiaire */}
          <div className="h-40 border border-slate-300 rounded p-3 flex flex-col justify-between print:bg-transparent">
            <div>
              <div className="font-bold uppercase text-slate-800 tracking-wider">Le Bénéficiaire / Directeur</div>
              <div className="text-slate-500 font-medium text-[10px] mt-0.5">{intervention.clientName}</div>
            </div>
            <div className="border-t border-slate-200 pt-1.5 text-slate-500 text-[10px] flex justify-between">
              <span>Date : ___ / ___ / ______</span>
              <span className="italic font-bold text-slate-700">Service Fait (Signature)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
