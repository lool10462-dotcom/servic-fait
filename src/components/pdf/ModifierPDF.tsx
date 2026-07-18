import React, { useState, useRef, useEffect } from 'react';
import {
  Save, Undo, Redo, ZoomIn, ZoomOut, Hand, PenTool, Highlighter,
  Type, Square, Circle, Eraser, ChevronLeft, ChevronRight, Settings,
  X, Bold, Italic, Download, Printer, ArrowLeft, Upload, Loader
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

type TabMode = 'annotate' | 'shapes' | 'text' | 'stamps';
type Tool = 'hand' | 'pen' | 'highlighter' | 'eraser' | 'text' | 'rect' | 'circle';

interface ModifierPDFProps {
  onBack: () => void;
}

interface PageData {
  src: string;
  width: number;
  height: number;
}

export default function ModifierPDF({ onBack }: ModifierPDFProps) {
  const [activeTab, setActiveTab] = useState<TabMode>('annotate');
  const [activeTool, setActiveTool] = useState<Tool>('hand');
  const [zoom, setZoom] = useState<number>(100);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // PDF states
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(null);
  const [pdfPages, setPdfPages] = useState<PageData[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");

  // Styling States
  const [strokeColor, setStrokeColor] = useState<string>('#ef4444');
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [opacity, setOpacity] = useState<number>(100);

  // Drawing Canvas references
  const canvasRefs = useRef<Record<number, HTMLCanvasElement | null>>({});
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const colors = [
    '#000000', '#ffffff', '#ef4444', '#f97316', '#f59e0b',
    '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef'
  ];

  const handleTabChange = (tab: TabMode) => {
    setActiveTab(tab);
    if (tab === 'annotate') setActiveTool('pen');
    if (tab === 'shapes') setActiveTool('rect');
    if (tab === 'text') setActiveTool('text');
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
    } catch (err) {
      console.error(err);
      alert("Une erreur est survenue lors du chargement du fichier.");
    } finally {
      setLoading(false);
      setProgress("");
    }
  };

  // Canvas Drawing Handlers
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

    if (activeTool === 'text') {
      const text = prompt("Entrez votre texte :");
      if (text) {
        ctx.font = `${strokeWidth * 6}px Arial`;
        ctx.fillStyle = strokeColor;
        ctx.fillText(text, coords.x, coords.y);
      }
      isDrawing.current = false;
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>, pageIdx: number) => {
    if (!isDrawing.current || activeTool === 'hand' || activeTool === 'text') return;
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
      ctx.lineWidth = strokeWidth * 6;
      ctx.stroke();
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      if (activeTool === 'highlighter') {
        ctx.strokeStyle = `${strokeColor}55`; // Alpha transparency
        ctx.lineWidth = strokeWidth * 3;
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

  const handleSaveModifiedPDF = async () => {
    if (!pdfBuffer || pdfPages.length === 0) return;
    setLoading(true);
    setProgress("Enregistrement du PDF modifié...");

    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const total = pdfDoc.getPageCount();

      for (let i = 0; i < total; i++) {
        const canvas = canvasRefs.current[i];
        if (canvas) {
          // Check if canvas is blank/empty to avoid unnecessary overlays
          const ctx = canvas.getContext('2d')!;
          const buffer = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          const isBlank = !buffer.some(channel => channel !== 0);

          if (!isBlank) {
            const pngDataUrl = canvas.toDataURL('image/png');
            const pngResponse = await fetch(pngDataUrl);
            const pngImageBuffer = await pngResponse.arrayBuffer();
            const embeddedPng = await pdfDoc.embedPng(pngImageBuffer);

            const page = pdfDoc.getPage(i);
            const { width, height } = page.getSize();
            page.drawImage(embeddedPng, {
              x: 0,
              y: 0,
              width,
              height
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
          <h1 className="text-xl font-semibold text-gray-800 tracking-tight">Éditeur PDF</h1>
          
          {pdfPages.length > 0 && (
            <nav className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => handleTabChange('annotate')}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer uppercase ${activeTab === 'annotate' ? 'bg-white shadow-sm text-purple-700' : 'text-gray-600 hover:text-gray-950'}`}
              >
                Annoter
              </button>
              <button
                onClick={() => handleTabChange('text')}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer uppercase ${activeTab === 'text' ? 'bg-white shadow-sm text-purple-700' : 'text-gray-600 hover:text-gray-950'}`}
              >
                Texte
              </button>
            </nav>
          )}
        </div>

        {pdfPages.length > 0 && (
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleSaveModifiedPDF}
              className="flex items-center px-5 py-2 bg-purple-650 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
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
              onClick={() => setActiveTool('hand')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${activeTool === 'hand' ? 'bg-purple-100 text-purple-800' : 'text-gray-600 hover:bg-gray-200'}`}
              title="Naviguer"
            >
              <Hand className="w-3.5 h-3.5" /> <span>Main</span>
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
                onClick={() => setActiveTool('text')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${activeTool === 'text' ? 'bg-purple-100 text-purple-800' : 'text-gray-600 hover:bg-gray-200'}`}
              >
                <Type className="w-3.5 h-3.5" /> <span>Ajouter du texte</span>
              </button>
            )}

            <div className="w-px h-5 bg-slate-200 mx-2" />
            
            <button 
              onClick={() => clearPageAnnotations(currentPage)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-650 hover:bg-red-50 cursor-pointer"
            >
              Effacer la page
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
                <p className="text-slate-500 text-sm max-w-sm">Vous pourrez dessiner, surligner, gommer ou écrire dessus localement.</p>
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
                  onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                  disabled={currentPage === 0}
                  className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 cursor-pointer font-bold text-xs"
                >
                  Précédent
                </button>
                <span className="text-xs font-bold text-slate-700">Page {currentPage + 1} sur {pdfPages.length}</span>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(pdfPages.length - 1, prev + 1))}
                  disabled={currentPage === pdfPages.length - 1}
                  className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 cursor-pointer font-bold text-xs"
                >
                  Suivant
                </button>
              </div>

              {/* Page Canvas Box */}
              <div 
                className="bg-white shadow-xl relative border border-slate-200 select-none"
                style={{ width: '600px', height: `${600 * (pdfPages[currentPage].height / pdfPages[currentPage].width)}px` }}
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
              </div>
            </div>
          )}
        </div>

        {/* Properties Sidebar */}
        {pdfPages.length > 0 && isSidebarOpen && (
          <aside className="w-72 bg-white border-l border-gray-200 flex flex-col z-20 transition-all duration-300">
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Propriétés</h2>
              <button onClick={() => setIsSidebarOpen(false)} className="text-gray-500 hover:text-slate-800 p-1 rounded-md hover:bg-slate-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Color list */}
              {activeTool !== 'eraser' && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Couleur d'encre / contour</label>
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
              )}

              {/* Line thickness */}
              {activeTool !== 'hand' && activeTool !== 'text' && (
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
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
