import React, { useState, useRef, useEffect } from 'react';
import {
  Save, Undo, Redo, ZoomIn, ZoomOut, Hand, PenTool, Highlighter,
  Type, Square, Circle, Eraser, ChevronLeft, ChevronRight, Settings,
  X, Bold, Italic, Download, Printer, ArrowLeft, Upload, Loader, Trash2, Plus, Move
} from 'lucide-react';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';

type TabMode = 'annotate' | 'text' | 'stamps';
type Tool = 'hand' | 'pen' | 'highlighter' | 'eraser';

interface ModifierPDFProps {
  onBack: () => void;
}

interface PageData {
  src: string;
  width: number;
  height: number;
}

interface PDFOverlayElement {
  id: string;
  type: 'text' | 'stamp';
  pageIndex: number;
  x: number; // absolute coordinates in display pixels
  y: number;
  text?: string;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  isBold?: boolean;
  isItalic?: boolean;
  stampText?: string;
  stampColor?: string;
}

const STAMP_PRESETS = [
  { text: 'APPROUVÉE', color: '#16a34a' },
  { text: 'TEL QUEL', color: '#2563eb' },
  { text: 'COMPLET', color: '#16a34a' },
  { text: 'CONFIDENTIEL', color: '#2563eb' },
  { text: 'DÉPARTEMENTAL', color: '#2563eb' },
  { text: 'BROUILLON', color: '#4b5563' },
  { text: 'EXPÉRIMENTAL', color: '#d97706' },
  { text: 'EXPIRÉ', color: '#dc2626' },
  { text: 'FINAL', color: '#16a34a' },
  { text: 'POUR COMMENTAIRE', color: '#2563eb' },
  { text: 'POUR DIFFUSION', color: '#2563eb' },
  { text: 'INFO SEULEMENT', color: '#4b5563' }
];

export default function ModifierPDF({ onBack }: ModifierPDFProps) {
  const [activeTab, setActiveTab] = useState<TabMode>('annotate');
  const [activeTool, setActiveTool] = useState<Tool>('hand');
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // PDF states
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(null);
  const [pdfPages, setPdfPages] = useState<PageData[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");

  // Vector overlays
  const [overlays, setOverlays] = useState<PDFOverlayElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Styling States for drawings
  const [strokeColor, setStrokeColor] = useState<string>('#ef4444');
  const [strokeWidth, setStrokeWidth] = useState<number>(3);

  // Drawing Canvas references
  const canvasRefs = useRef<Record<number, HTMLCanvasElement | null>>({});
  const initialFileInputRef = useRef<HTMLInputElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // Draggable states for overlays
  const [dragOverlayId, setDragOverlayId] = useState<string | null>(null);
  const dragStartOffset = useRef({ x: 0, y: 0 });

  const colors = [
    '#000000', '#ffffff', '#ef4444', '#f97316', '#f59e0b',
    '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef'
  ];

  const handleTabChange = (tab: TabMode) => {
    setActiveTab(tab);
    if (tab === 'annotate') {
      setActiveTool('pen');
    } else {
      setActiveTool('hand');
    }
    setIsSidebarOpen(true);
  };

  const handleFileChange = async (filesList: FileList) => {
    const file = filesList[0];
    if (!file) return;
    setPdfFile(file);
    setLoading(true);
    setProgress("Chargement et traitement du PDF...");
    try {
      const arrayBuffer = await file.arrayBuffer();
      setPdfBuffer(arrayBuffer);

      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.mjs",
        import.meta.url
      ).toString();

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const pagesData: PageData[] = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        setProgress(`Rendu de la page ${pageNum}/${pdf.numPages}...`);
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport } as any).promise;
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

        pagesData.push({
          src: dataUrl,
          width: viewport.width,
          height: viewport.height
        });
      }

      setPdfPages(pagesData);
      setCurrentPage(0);
      setOverlays([]);
      setSelectedId(null);
    } catch (err) {
      console.error(err);
      alert("Une erreur est survenue lors du chargement du fichier.");
    } finally {
      setLoading(false);
      setProgress("");
    }
  };

  // Drawing functions
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>, pageIdx: number) => {
    if (activeTool === 'hand') return;
    const canvas = canvasRefs.current[pageIdx];
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    isDrawing.current = true;
    const coords = getCanvasCoords(e, canvas);
    lastPos.current = coords;
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>, pageIdx: number) => {
    if (!isDrawing.current || activeTool === 'hand') return;
    const canvas = canvasRefs.current[pageIdx];
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCanvasCoords(e, canvas);

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(coords.x, coords.y);

    if (activeTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = strokeWidth * 5;
      ctx.stroke();
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      if (activeTool === 'highlighter') {
        ctx.strokeStyle = `${strokeColor}55`; // semi-transparent
        ctx.lineWidth = strokeWidth * 4;
      }
      ctx.stroke();
    }

    lastPos.current = coords;
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  const clearPageAnnotations = (pageIdx: number) => {
    const canvas = canvasRefs.current[pageIdx];
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Vector overlays functions
  const addTextOverlay = () => {
    const newText: PDFOverlayElement = {
      id: `text-${Date.now()}`,
      type: 'text',
      pageIndex: currentPage,
      x: 100,
      y: 100,
      text: 'Nouveau texte',
      fontSize: 16,
      color: '#000000',
      fontFamily: 'Helvetica',
      isBold: false,
      isItalic: false
    };
    setOverlays(prev => [...prev, newText]);
    setSelectedId(newText.id);
  };

  const addStampOverlay = (preset: { text: string; color: string }) => {
    const newStamp: PDFOverlayElement = {
      id: `stamp-${Date.now()}`,
      type: 'stamp',
      pageIndex: currentPage,
      x: 150,
      y: 150,
      stampText: preset.text,
      stampColor: preset.color
    };
    setOverlays(prev => [...prev, newStamp]);
    setSelectedId(newStamp.id);
  };

  // Draggable functions
  const handleOverlayMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedId(id);
    setDragOverlayId(id);
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    dragStartOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleWorkspaceMouseMove = (e: React.MouseEvent) => {
    if (!dragOverlayId) return;
    const workspace = e.currentTarget as HTMLElement;
    const rect = workspace.getBoundingClientRect();
    const x = e.clientX - rect.left - dragStartOffset.current.x;
    const y = e.clientY - rect.top - dragStartOffset.current.y;

    setOverlays(prev => prev.map(o => o.id === dragOverlayId ? { ...o, x: Math.max(0, x), y: Math.max(0, y) } : o));
  };

  const handleWorkspaceMouseUp = () => {
    setDragOverlayId(null);
  };

  const deleteOverlay = (id: string) => {
    setOverlays(prev => prev.filter(o => o.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const updateSelectedOverlay = (fields: Partial<PDFOverlayElement>) => {
    if (!selectedId) return;
    setOverlays(prev => prev.map(o => o.id === selectedId ? { ...o, ...fields } : o));
  };

  const selectedOverlay = overlays.find(o => o.id === selectedId);

  const hexToRgb = (hex: string) => {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
    return rgb(r, g, b);
  };

  const handleSaveModifiedPDF = async () => {
    if (!pdfBuffer || pdfPages.length === 0) return;
    setLoading(true);
    setProgress("Enregistrement du PDF modifié...");

    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const total = pdfDoc.getPageCount();

      for (let i = 0; i < total; i++) {
        const page = pdfDoc.getPage(i);
        const { width: pdfWidth, height: pdfHeight } = page.getSize();
        
        // 1. Render drawing canvas for this page
        const canvas = canvasRefs.current[i];
        if (canvas) {
          const ctx = canvas.getContext('2d')!;
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          const isBlank = !imgData.some(channel => channel !== 0);

          if (!isBlank) {
            const pngDataUrl = canvas.toDataURL('image/png');
            const pngResponse = await fetch(pngDataUrl);
            const pngImageBuffer = await pngResponse.arrayBuffer();
            const embeddedPng = await pdfDoc.embedPng(pngImageBuffer);

            page.drawImage(embeddedPng, {
              x: 0,
              y: 0,
              width: pdfWidth,
              height: pdfHeight
            });
          }
        }

        // 2. Draw vector overlays for this page
        const pageOverlays = overlays.filter(o => o.pageIndex === i);
        for (const element of pageOverlays) {
          const displayWidth = 600;
          const displayHeight = 600 * (pdfPages[i].height / pdfPages[i].width);

          const xPct = element.x / displayWidth;
          const yPct = element.y / displayHeight;

          const pdfX = xPct * pdfWidth;

          if (element.type === 'text' && element.text) {
            const sizeVal = element.fontSize || 16;
            const pdfFontSize = sizeVal * (pdfHeight / displayHeight);

            // Select standard fonts
            let font = await pdfDoc.embedStandardFont(StandardFonts.Helvetica);
            if (element.fontFamily === 'Times-Roman') font = await pdfDoc.embedStandardFont(StandardFonts.TimesRoman);
            if (element.fontFamily === 'Courier') font = await pdfDoc.embedStandardFont(StandardFonts.Courier);
            
            if (element.isBold) {
              if (element.fontFamily === 'Courier') font = await pdfDoc.embedStandardFont(StandardFonts.CourierBold);
              else if (element.fontFamily === 'Times-Roman') font = await pdfDoc.embedStandardFont(StandardFonts.TimesRomanBold);
              else font = await pdfDoc.embedStandardFont(StandardFonts.HelveticaBold);
            }
            if (element.isItalic) {
              if (element.fontFamily === 'Courier') font = await pdfDoc.embedStandardFont(StandardFonts.CourierOblique);
              else if (element.fontFamily === 'Times-Roman') font = await pdfDoc.embedStandardFont(StandardFonts.TimesRomanItalic);
              else font = await pdfDoc.embedStandardFont(StandardFonts.HelveticaOblique);
            }

            const pdfY = (1 - yPct - (pdfFontSize / pdfHeight)) * pdfHeight;

            page.drawText(element.text, {
              x: pdfX,
              y: pdfY,
              size: pdfFontSize,
              font,
              color: hexToRgb(element.color || '#000000')
            });
          } else if (element.type === 'stamp' && element.stampText) {
            const stampColor = element.stampColor || '#ef4444';
            const stampW = 120 * (pdfWidth / displayWidth);
            const stampH = 40 * (pdfHeight / displayHeight);
            const pdfY = (1 - yPct - (40 / displayHeight)) * pdfHeight;

            // Draw vector stamp border box
            page.drawRectangle({
              x: pdfX,
              y: pdfY,
              width: stampW,
              height: stampH,
              borderColor: hexToRgb(stampColor),
              borderWidth: 2.5,
              color: rgb(1, 1, 1) // white filling
            });

            // Draw stamp text inside
            const stampFont = await pdfDoc.embedStandardFont(StandardFonts.HelveticaBold);
            const sizeLimit = 11.5 * (pdfHeight / displayHeight);
            const textWidth = stampFont.widthOfTextAtSize(element.stampText, sizeLimit);
            const textHeight = stampFont.heightAtSize(sizeLimit);

            page.drawText(element.stampText, {
              x: pdfX + (stampW - textWidth) / 2,
              y: pdfY + (stampH - textHeight) / 2 + 1,
              size: sizeLimit,
              font: stampFont,
              color: hexToRgb(stampColor)
            });
          }
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = pdfFile ? pdfFile.name.replace(/\.pdf$/i, '_modifie.pdf') : `document_modifie_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onBack();
    } catch (err) {
      console.error(err);
      alert("Une erreur est survenue lors de la compilation du PDF.");
    } finally {
      setLoading(false);
      setProgress("");
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 text-slate-800 font-sans min-h-screen">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shadow-sm z-20 shrink-0">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500 cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">Modifier PDF</h1>
          
          {pdfPages.length > 0 && (
            <nav className="flex bg-gray-150 p-1 rounded-xl">
              <button
                onClick={() => handleTabChange('annotate')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer uppercase ${activeTab === 'annotate' ? 'bg-white shadow-sm text-purple-700' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Annoter
              </button>
              <button
                onClick={() => handleTabChange('text')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer uppercase ${activeTab === 'text' ? 'bg-white shadow-sm text-purple-700' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Texte
              </button>
              <button
                onClick={() => handleTabChange('stamps')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer uppercase ${activeTab === 'stamps' ? 'bg-white shadow-sm text-purple-700' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Tampons
              </button>
            </nav>
          )}
        </div>

        {pdfPages.length > 0 && (
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleSaveModifiedPDF}
              className="flex items-center px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <Save className="w-4 h-4 mr-2" />
              Enregistrer
            </button>
          </div>
        )}
      </header>

      {/* Secondary tool row */}
      {pdfPages.length > 0 && (
        <div className="flex items-center px-6 py-2.5 bg-gray-50 border-b border-gray-200 z-10 shrink-0">
          <div className="flex items-center space-x-1.5">
            <button 
              onClick={() => { setActiveTool('hand'); setSelectedId(null); }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${activeTool === 'hand' ? 'bg-purple-100 text-purple-800' : 'text-gray-600 hover:bg-gray-200'}`}
              title="Naviguer"
            >
              <Hand className="w-3.5 h-3.5" /> <span>Sélection / Déplacement</span>
            </button>
            
            {activeTab === 'annotate' && (
              <>
                <button 
                  onClick={() => setActiveTool('pen')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${activeTool === 'pen' ? 'bg-purple-100 text-purple-800' : 'text-gray-600 hover:bg-gray-200'}`}
                >
                  <PenTool className="w-3.5 h-3.5" /> <span>Dessin</span>
                </button>
                <button 
                  onClick={() => setActiveTool('highlighter')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${activeTool === 'highlighter' ? 'bg-purple-100 text-purple-800' : 'text-gray-600 hover:bg-gray-200'}`}
                >
                  <Highlighter className="w-3.5 h-3.5" /> <span>Surligneur</span>
                </button>
                <button 
                  onClick={() => setActiveTool('eraser')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${activeTool === 'eraser' ? 'bg-purple-100 text-purple-800' : 'text-gray-600 hover:bg-gray-200'}`}
                >
                  <Eraser className="w-3.5 h-3.5" /> <span>Gomme</span>
                </button>
              </>
            )}

            {activeTab === 'text' && (
              <button 
                onClick={addTextOverlay}
                className="flex items-center gap-1 px-4 py-1.5 bg-purple-650 hover:bg-purple-750 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> <span>Ajouter bloc texte</span>
              </button>
            )}

            <div className="w-px h-5 bg-slate-200 mx-2" />
            
            <button 
              onClick={() => clearPageAnnotations(currentPage)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-650 hover:bg-red-50 cursor-pointer"
            >
              Effacer dessin page
            </button>
          </div>
          
          <div className="flex-1" />

          {/* Properties sidebar trigger */}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${isSidebarOpen ? 'bg-slate-200 text-slate-800' : 'text-slate-500 hover:bg-slate-200'}`}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 z-50 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <Loader className="w-10 h-10 text-purple-600 animate-spin" />
            <p className="text-sm font-bold text-slate-700">{progress}</p>
          </div>
        )}

        {/* Viewport Workspace */}
        <div className="flex-1 overflow-auto p-8 flex justify-center items-start bg-slate-100">
          {pdfPages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-6 min-h-[450px] w-full">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200 text-slate-400">
                <Upload className="w-10 h-10" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-slate-800 mb-1">Chargez le PDF à modifier</h3>
                <p className="text-slate-500 text-sm max-w-sm">Ajoutez du texte, appliquez des tampons officiels et dessinez en toute liberté.</p>
              </div>
              <button onClick={() => initialFileInputRef.current?.click()} className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl text-white font-bold cursor-pointer transition-all shadow-md">
                <span>Sélectionner le PDF</span>
              </button>
              <input ref={initialFileInputRef} type="file" accept="application/pdf" className="hidden" onChange={e => { if (e.target.files) handleFileChange(e.target.files); e.target.value = ""; }} />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6">
              {/* Page navigation */}
              <div className="flex items-center gap-4 bg-white px-5 py-2 rounded-full shadow-sm border">
                <button 
                  onClick={() => { setCurrentPage(prev => Math.max(0, prev - 1)); setSelectedId(null); }}
                  disabled={currentPage === 0}
                  className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 cursor-pointer font-bold text-xs"
                >
                  Précédent
                </button>
                <span className="text-xs font-bold text-slate-700">Page {currentPage + 1} sur {pdfPages.length}</span>
                <button 
                  onClick={() => { setCurrentPage(prev => Math.min(pdfPages.length - 1, prev + 1)); setSelectedId(null); }}
                  disabled={currentPage === pdfPages.length - 1}
                  className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 cursor-pointer font-bold text-xs"
                >
                  Suivant
                </button>
              </div>

              {/* Page Canvas Box */}
              <div 
                className="bg-white shadow-xl relative border border-slate-200 select-none overflow-hidden"
                style={{ width: '600px', height: `${600 * (pdfPages[currentPage].height / pdfPages[currentPage].width)}px` }}
                onMouseMove={handleWorkspaceMouseMove}
                onMouseUp={handleWorkspaceMouseUp}
                onMouseLeave={handleWorkspaceMouseUp}
              >
                <img 
                  src={pdfPages[currentPage].src} 
                  alt={`Page ${currentPage + 1}`} 
                  className="w-full h-full object-contain pointer-events-none select-none"
                />
                
                {/* Drawing Layer */}
                <canvas
                  ref={el => { canvasRefs.current[currentPage] = el; }}
                  width={pdfPages[currentPage].width}
                  height={pdfPages[currentPage].height}
                  onMouseDown={e => startDrawing(e, currentPage)}
                  onMouseMove={e => draw(e, currentPage)}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className={`absolute inset-0 w-full h-full z-10 ${activeTool === 'hand' ? 'pointer-events-none' : 'cursor-crosshair'}`}
                />

                {/* Vector Overlays Layer */}
                {overlays.filter(o => o.pageIndex === currentPage).map(o => {
                  const isSelected = selectedId === o.id;

                  if (o.type === 'text') {
                    return (
                      <div
                        key={o.id}
                        style={{ left: `${o.x}px`, top: `${o.y}px`, color: o.color, fontSize: `${o.fontSize}px`, fontFamily: o.fontFamily, fontWeight: o.isBold ? 'bold' : 'normal', fontStyle: o.isItalic ? 'italic' : 'normal' }}
                        onMouseDown={e => handleOverlayMouseDown(e, o.id)}
                        className={`absolute cursor-move px-2 py-1 select-none whitespace-nowrap z-25 flex items-center group ${
                          isSelected ? 'border border-dashed border-purple-500 bg-purple-50/40 rounded' : 'hover:border hover:border-dashed hover:border-slate-350'
                        }`}
                      >
                        {o.text || 'Texte vide'}
                        <button 
                          onMouseDown={e => e.stopPropagation()} 
                          onClick={() => deleteOverlay(o.id)}
                          className="ml-2 p-0.5 rounded bg-red-100 hover:bg-red-200 text-red-650 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  } else {
                    return (
                      <div
                        key={o.id}
                        style={{ left: `${o.x}px`, top: `${o.y}px`, borderColor: o.stampColor, color: o.stampColor }}
                        onMouseDown={e => handleOverlayMouseDown(e, o.id)}
                        className={`absolute cursor-move select-none w-28 h-10 border-2.5 z-25 flex items-center justify-center font-extrabold uppercase tracking-wide text-[10px] rounded bg-white shadow-sm group ${
                          isSelected ? 'ring-2 ring-purple-500' : 'hover:opacity-90'
                        }`}
                      >
                        {o.stampText}
                        <button 
                          onMouseDown={e => e.stopPropagation()} 
                          onClick={() => deleteOverlay(o.id)}
                          className="absolute -top-2.5 -right-2.5 p-1 rounded-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    );
                  }
                })}
              </div>
            </div>
          )}
        </div>

        {/* Properties Sidebar */}
        {pdfPages.length > 0 && isSidebarOpen && (
          <aside className="w-72 bg-white border-l border-gray-200 flex flex-col z-20 transition-all duration-300">
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Mise en forme / Outils</h2>
              <button onClick={() => setIsSidebarOpen(false)} className="text-gray-500 hover:text-slate-800 p-1 rounded-md hover:bg-slate-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {activeTab === 'annotate' && (
                <>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Couleur d'encre</label>
                    <div className="grid grid-cols-5 gap-2">
                      {colors.map((c) => (
                        <button
                          key={c}
                          onClick={() => setStrokeColor(c)}
                          style={{ backgroundColor: c }}
                          className={`w-8 h-8 rounded-full border cursor-pointer transition-all ${
                            strokeColor === c ? 'ring-2 ring-purple-650 scale-105 border-white' : 'border-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 flex justify-between">
                      <span>Épaisseur du trait</span>
                      <span className="font-mono">{strokeWidth}px</span>
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={20}
                      value={strokeWidth}
                      onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                      className="w-full cursor-pointer accent-purple-650"
                    />
                  </div>
                </>
              )}

              {activeTab === 'text' && (
                <div className="space-y-5">
                  {!selectedOverlay ? (
                    <div className="text-center py-8 text-slate-400 text-xs font-medium">
                      Sélectionnez un bloc de texte sur la page pour le configurer.
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Contenu du texte</label>
                        <textarea
                          rows={3}
                          value={selectedOverlay.text || ''}
                          onChange={(e) => updateSelectedOverlay({ text: e.target.value })}
                          className="w-full text-xs px-3 py-2 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none font-medium text-slate-850"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Police</label>
                        <select
                          value={selectedOverlay.fontFamily || 'Helvetica'}
                          onChange={(e) => updateSelectedOverlay({ fontFamily: e.target.value })}
                          className="w-full text-xs px-3 py-2 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold bg-white text-slate-700"
                        >
                          <option value="Helvetica">Helvetica (Sans-Serif)</option>
                          <option value="Times-Roman">Times New Roman (Serif)</option>
                          <option value="Courier">Courier (Monospace)</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 flex justify-between">
                          <span>Taille</span>
                          <span className="font-mono">{selectedOverlay.fontSize || 16}px</span>
                        </label>
                        <input
                          type="range"
                          min={8}
                          max={72}
                          value={selectedOverlay.fontSize || 16}
                          onChange={(e) => updateSelectedOverlay({ fontSize: parseInt(e.target.value) })}
                          className="w-full cursor-pointer accent-purple-650"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Styles</label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateSelectedOverlay({ isBold: !selectedOverlay.isBold })}
                            className={`flex-1 py-1.5 border rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              selectedOverlay.isBold ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-slate-200 text-slate-500'
                            }`}
                          >
                            Gras
                          </button>
                          <button
                            onClick={() => updateSelectedOverlay({ isItalic: !selectedOverlay.isItalic })}
                            className={`flex-1 py-1.5 border rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              selectedOverlay.isItalic ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-slate-200 text-slate-500'
                            }`}
                          >
                            Italique
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Couleur du texte</label>
                        <div className="grid grid-cols-5 gap-2">
                          {colors.map((c) => (
                            <button
                              key={c}
                              onClick={() => updateSelectedOverlay({ color: c })}
                              style={{ backgroundColor: c }}
                              className={`w-8 h-8 rounded-full border cursor-pointer transition-all ${
                                selectedOverlay.color === c ? 'ring-2 ring-purple-650 scale-105 border-white' : 'border-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => deleteOverlay(selectedOverlay.id)}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-red-50 hover:bg-red-100 text-red-650 border border-red-200 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Supprimer le texte</span>
                      </button>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'stamps' && (
                <div className="space-y-4">
                  <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Choisir un tampon à insérer</span>
                  <div className="grid grid-cols-1 gap-2.5">
                    {STAMP_PRESETS.map((p) => (
                      <button
                        key={p.text}
                        onClick={() => addStampOverlay(p)}
                        style={{ borderColor: p.color, color: p.color }}
                        className="w-full py-2.5 border-2 text-center font-extrabold uppercase tracking-wider text-[11px] rounded bg-white hover:bg-slate-50/50 cursor-pointer shadow-sm active:scale-[0.98] transition-all"
                      >
                        {p.text}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
