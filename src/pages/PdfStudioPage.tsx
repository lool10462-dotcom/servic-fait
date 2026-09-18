import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Upload, FileText, Image, FileOutput, Shield, Scissors, 
  Copy, Type, Zap, CheckSquare, Layers, Lock, Unlock, Hash, PenTool,
  RotateCw, Columns, PenBox, Download, Play, FileJson, Stamp,
  Clock, Trash2, CheckCircle, Sparkles
} from 'lucide-react';
import ModifierPDF from '../components/pdf/ModifierPDF';
import SignerPDF from '../components/pdf/SignerPDF';
import OrganiserPDF from '../components/pdf/OrganiserPDF';
import NumerosPDF from '../components/pdf/NumerosPDF';
import ConvertPDF from '../components/pdf/ConvertPDF';
import { getPdfStudioHistory, clearPdfStudioHistory, PdfStudioHistoryItem } from '../utils/pdfStudioPersistence';

// Dummy components for advanced/other tools not yet fully implemented
const DummyTool = ({ title, onBack }: { title: string, onBack: () => void }) => (
  <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center">
    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
      <h2 className="text-2xl font-bold text-slate-800 mb-4">{title}</h2>
      <p className="text-slate-500 mb-8">Cet outil est en cours de développement.</p>
      <button 
        onClick={onBack}
        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
      >
        Retour au PDF Studio
      </button>
    </div>
  </div>
);

type PdfTool = 
  | 'dashboard' 
  | 'modifier' | 'signer' | 'organiser' | 'numeros' 
  | 'convert-pdf-to-word' | 'convert-pdf-to-excel' | 'convert-pdf-to-ppt' | 'convert-pdf-to-jpg' | 'convert-pdf-to-pdfa'
  | 'convert-word-to-pdf' | 'convert-excel-to-pdf' | 'convert-ppt-to-pdf' | 'convert-jpg-to-pdf' | 'convert-html-to-pdf'
  | 'fusionner' | 'diviser' | 'compresser' | 'reparer'
  | 'filigrane' | 'pivoter'
  | 'deverrouiller' | 'proteger'
  | 'ocr' | 'comparer' | 'scanner' | 'calques' | 'correcteur';

export default function PdfStudioPage() {
  const [activeTool, setActiveTool] = useState<PdfTool>('dashboard');
  const [history, setHistory] = useState<PdfStudioHistoryItem[]>([]);

  useEffect(() => {
    setHistory(getPdfStudioHistory());
  }, [activeTool]);

  const handleClearHistory = () => {
    if (confirm('Voulez-vous effacer l\'historique local des conversions PDF ?')) {
      clearPdfStudioHistory();
      setHistory([]);
    }
  };

  if (activeTool === 'modifier') return <ModifierPDF onBack={() => setActiveTool('dashboard')} />;
  if (activeTool === 'signer') return <SignerPDF onBack={() => setActiveTool('dashboard')} />;
  if (activeTool === 'organiser') return <OrganiserPDF pdfPages={[]} onPagesUpdate={() => {}} onBack={() => setActiveTool('dashboard')} />;
  if (activeTool === 'numeros') return <NumerosPDF pdfPages={[]} onBack={() => setActiveTool('dashboard')} />;
  if (activeTool.startsWith('convert-') || [
    'fusionner', 'diviser', 'compresser', 'pivoter', 'filigrane', 
    'proteger', 'deverrouiller', 'reparer', 'ocr', 'comparer', 
    'scanner', 'calques', 'correcteur'
  ].includes(activeTool)) {
    return <ConvertPDF type={activeTool} onBack={() => setActiveTool('dashboard')} />;
  }
  
  if (activeTool !== 'dashboard') return <DummyTool title={activeTool} onBack={() => setActiveTool('dashboard')} />;

  const tools = [
    {
      category: "Organisation",
      description: "Fusionner, diviser, compresser et organiser vos PDF",
      color: "blue",
      items: [
        { id: 'fusionner', icon: Columns, title: "Fusionner PDF", desc: "Combinez plusieurs fichiers PDF en un seul document", color: "text-blue-500" },
        { id: 'diviser', icon: Scissors, title: "Diviser PDF", desc: "Séparez un PDF en plusieurs fichiers distincts", color: "text-blue-500" },
        { id: 'compresser', icon: Download, title: "Compresser PDF", desc: "Réduisez la taille de vos fichiers PDF", color: "text-blue-500" },
        { id: 'organiser', icon: Copy, title: "Organiser PDF", desc: "Réorganisez, ajoutez ou supprimez des pages", color: "text-blue-500" },
        { id: 'reparer', icon: PenTool, title: "Réparer PDF", desc: "Récupérez les données d'un PDF corrompu", color: "text-blue-500" },
      ]
    },
    {
      category: "Convertir depuis PDF",
      description: "Transformez vos PDF en Word, Excel, JPG et plus",
      color: "emerald",
      items: [
        { id: 'convert-pdf-to-word', icon: FileText, title: "PDF en Word", desc: "Transformez vos PDF en documents Word éditables", color: "text-emerald-500" },
        { id: 'convert-pdf-to-excel', icon: FileJson, title: "PDF en Excel", desc: "Extrayez les tableaux de vos PDF vers Excel", color: "text-emerald-500" },
        { id: 'convert-pdf-to-ppt', icon: Play, title: "PDF en PowerPoint", desc: "Convertissez vos PDF en présentations", color: "text-emerald-500" },
        { id: 'convert-pdf-to-jpg', icon: Image, title: "PDF en JPG", desc: "Convertissez chaque page en image JPG", color: "text-emerald-500" },
        { id: 'convert-pdf-to-pdfa', icon: FileOutput, title: "PDF en PDF/A", desc: "Convertissez au format d'archivage PDF/A", color: "text-emerald-500" },
      ]
    },
    {
      category: "Convertir vers PDF",
      description: "Créez des PDF depuis Word, Excel, JPG, HTML",
      color: "orange",
      items: [
        { id: 'convert-word-to-pdf', icon: FileText, title: "Word en PDF", desc: "Transformez vos documents Word en PDF", color: "text-orange-500" },
        { id: 'convert-excel-to-pdf', icon: FileJson, title: "Excel en PDF", desc: "Convertissez vos feuilles de calcul en PDF", color: "text-orange-500" },
        { id: 'convert-ppt-to-pdf', icon: Play, title: "PowerPoint en PDF", desc: "Figez vos présentations au format PDF", color: "text-orange-500" },
        { id: 'convert-jpg-to-pdf', icon: Image, title: "JPG en PDF", desc: "Créez un PDF à partir de vos images", color: "text-orange-500" },
        { id: 'convert-html-to-pdf', icon: FileOutput, title: "HTML en PDF", desc: "Convertissez une page web en PDF", color: "text-orange-500" },
      ]
    },
    {
      category: "Édition",
      description: "Modifiez, annotez et personnalisez vos documents",
      color: "orange-600",
      items: [
        { id: 'modifier', icon: PenBox, title: "Modifier PDF", desc: "Ajoutez du texte, des images et des formes", color: "text-orange-600" },
        { id: 'numeros', icon: Hash, title: "Numéros de page", desc: "Insérez une numérotation personnalisée", color: "text-orange-600" },
        { id: 'filigrane', icon: Stamp, title: "Filigrane", desc: "Apposez un texte ou logo en transparence", color: "text-orange-600" },
        { id: 'pivoter', icon: RotateCw, title: "Pivoter PDF", desc: "Tournez les pages de votre document", color: "text-orange-600" },
      ]
    },
    {
      category: "Sécurité",
      description: "Protégez, déverrouillez et signez vos PDF",
      color: "red",
      items: [
        { id: 'deverrouiller', icon: Unlock, title: "Déverrouiller PDF", desc: "Retirez le mot de passe d'un fichier PDF", color: "text-red-500" },
        { id: 'proteger', icon: Lock, title: "Protéger PDF", desc: "Ajoutez un mot de passe et chiffrez le document", color: "text-red-500" },
        { id: 'signer', icon: PenTool, title: "Signer PDF", desc: "Créez et apposez votre signature électronique", color: "text-red-500" },
      ]
    },
    {
      category: "Avancé",
      description: "OCR, comparaison et numérisation intelligente",
      color: "purple",
      items: [
        { id: 'ocr', icon: Type, title: "OCR", desc: "Reconnaissance de caractères sur PDF numérisés", color: "text-purple-500" },
        { id: 'comparer', icon: Layers, title: "Comparer PDF", desc: "Comparez deux documents côte à côte", color: "text-purple-500" },
        { id: 'scanner', icon: Zap, title: "Scanner vers PDF", desc: "Numérisez un document avec votre caméra", color: "text-purple-500" },
        { id: 'calques', icon: Layers, title: "Calques Magiques", desc: "Détourez un objet par IA et rendez-le déplaçable avec inpainting du fond", color: "text-purple-500" },
        { id: 'correcteur', icon: CheckSquare, title: "Correcteur IA Pro", desc: "Corrigez l'orthographe, la grammaire, la ponctuation et le style", color: "text-purple-500" },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#9b66ff] to-[#7f42ff] pt-6 pb-20 px-4 text-center">
        <a href="/" className="inline-flex items-center text-white/80 hover:text-white mb-6 text-sm transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à la Plateforme Documentaire
        </a>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
          PDF Studio
        </h1>
        <p className="text-white/90 text-lg md:text-xl max-w-2xl mx-auto font-medium">
          Tous les outils PDF dont vous avez besoin, directement dans votre navigateur.<br/>
          <span className="font-bold">100% gratuit • 100% sécurisé • Aucun fichier envoyé en ligne</span>
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-6">
          <span className="px-4 py-1.5 rounded-full bg-white/10 text-white text-sm border border-white/20 backdrop-blur-sm">Traitement local</span>
          <span className="px-4 py-1.5 rounded-full bg-white/10 text-white text-sm border border-white/20 backdrop-blur-sm">Ultra rapide</span>
          <span className="px-4 py-1.5 rounded-full bg-white/10 text-white text-sm border border-white/20 backdrop-blur-sm">25 outils</span>
          <a
            href="https://www.ilovepdf.com/fr"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-1.5 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 text-sm font-bold border border-amber-300 shadow-md transition-all flex items-center gap-1.5"
            title="Ouvrir le service en ligne iLovePDF dans un nouvel onglet"
          >
            <span>Option iLovePDF.com</span>
            <span className="text-[11px] opacity-75">↗</span>
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 -mt-10 pb-16">
        {/* Choix utilisateur : Local vs iLovePDF */}
        <div className="bg-white rounded-2xl p-5 mb-6 shadow-md border border-purple-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 shrink-0 font-bold text-base">
              PDF
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                Liberté de Traitement : Convertisseur Intégré ou iLovePDF
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">Choix au clic</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Utilisez nos outils souverains pour un traitement 100% sur votre ordinateur, ou cliquez pour basculer directement vers <strong>iLovePDF.com</strong> si vous préférez leurs serveurs en ligne.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://www.ilovepdf.com/fr"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold shadow-sm transition-all"
            >
              <span>Accéder à iLovePDF.com</span>
              <span>↗</span>
            </a>
          </div>
        </div>

        <div className="space-y-8">
          {tools.map((section, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
              <div className="mb-6 flex items-start">
                <div className={`w-1 h-10 rounded-full bg-${section.color}-500 mr-4`} style={{ backgroundColor: section.category === 'Édition' ? '#ea580c' : undefined }}></div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{section.category}</h2>
                  <p className="text-slate-500 text-sm">{section.description}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {section.items.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id as PdfTool)}
                    className="text-left bg-slate-50 hover:bg-slate-100 p-5 rounded-xl border border-slate-200 transition-all hover:shadow-md hover:-translate-y-1 group"
                  >
                    <div className={`w-12 h-12 bg-white rounded-lg shadow-sm border border-slate-100 flex items-center justify-center mb-4 ${tool.color}`}>
                      <tool.icon className="w-6 h-6 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-transform" />
                    </div>
                    <h3 className="font-bold text-slate-800 mb-2">{tool.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {tool.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Persistent History & Document Integrity Section */}
          {history.length > 0 && (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      Historique des Documents Traités
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Souverain & Local
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      Vos fichiers traités et leurs garanties d'intégrité (tableaux, logos, textures et calques)
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleClearHistory}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Effacer l'historique
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {history.map((item) => (
                  <div key={item.id} className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-sm">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-800 truncate">{item.outputName}</span>
                        <span className="text-[11px] px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-medium border border-purple-200">
                          {item.toolTitle}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1 text-emerald-600 font-medium">
                          <Sparkles className="w-3 h-3" />
                          {item.elementPreservationSummary || 'Tableaux, logos et textures préservés'}
                        </span>
                        <span>•</span>
                        <span>Origine : {item.originalName}</span>
                        <span>•</span>
                        <span>{item.timestamp}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs shrink-0 font-mono">
                      <span className="text-slate-400">{item.originalSize > 0 ? `${Math.round(item.originalSize / 1024)} Ko → ` : ''}</span>
                      <span className="font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                        {Math.round(item.outputSize / 1024)} Ko
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
