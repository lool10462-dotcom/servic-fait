import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Edit3, Type, Image as ImageIcon, Check, Move, ArrowLeft, Loader, Download, Trash2 } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

type TabType = 'signature' | 'initials' | 'stamp';
type InputMode = 'text' | 'draw' | 'image';
type PageMode = 'current' | 'all' | 'custom';
type ColorType = '#000000' | '#ef4444' | '#3b82f6' | '#22c55e';

interface ElementConfig {
  type: TabType;
  mode: InputMode;
  content: string | null;
  color: string;
  font?: string;
  pageMode: PageMode;
  customPages?: string;
  x: number;
  y: number;
}

interface SignerPDFProps {
  onBack: () => void;
}

export default function SignerPDF({ onBack }: SignerPDFProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<TabType>('signature');
  
  // Three separate element configs
  const [sigConfig, setSigConfig] = useState<ElementConfig | null>(null);
  const [initialsConfig, setInitialsConfig] = useState<ElementConfig | null>(null);
  const [stampConfig, setStampConfig] = useState<ElementConfig | null>(null);

  // PDF states
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(null);
  const [pdfPages, setPdfPages] = useState<{ src: string; width: number; height: number }[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  
  // Dragging states
  const [isDragging, setIsDragging] = useState(false);
  const [draggingElement, setDraggingElement] = useState<TabType | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; initX: number; initY: number } | null>(null);
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const initialFileInputRef = useRef<HTMLInputElement>(null);

  const handleApplyElement = (config: ElementConfig) => {
    if (config.type === 'signature') {
      setSigConfig(config);
    } else if (config.type === 'initials') {
      setInitialsConfig(config);
    } else if (config.type === 'stamp') {
      setStampConfig(config);
    }
    setIsModalOpen(false);
  };

  const handleFileChange = async (filesList: FileList) => {
    const file = filesList[0];
    if (!file) return;
    setPdfFile(file);
    setLoading(true);
    setProgress("Chargement du PDF...");
    try {
      const arrayBuffer = await file.arrayBuffer();
      setPdfBuffer(arrayBuffer);

      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.mjs",
        import.meta.url
      ).toString();

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const pagesData: { src: string; width: number; height: number }[] = [];

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
      
      // Reset configurations
      setSigConfig(null);
      setInitialsConfig(null);
      setStampConfig(null);
    } catch (err) {
      console.error(err);
      alert("Une erreur est survenue lors de la lecture du document PDF.");
    } finally {
      setLoading(false);
      setProgress("");
    }
  };

  const handleMouseDown = (e: React.MouseEvent, type: TabType) => {
    setDraggingElement(type);
    let initPos = { x: 50, y: 50 };
    if (type === 'signature' && sigConfig) initPos = { x: sigConfig.x, y: sigConfig.y };
    else if (type === 'initials' && initialsConfig) initPos = { x: initialsConfig.x, y: initialsConfig.y };
    else if (type === 'stamp' && stampConfig) initPos = { x: stampConfig.x, y: stampConfig.y };

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: initPos.x,
      initY: initPos.y
    };
    setIsDragging(true);
    e.stopPropagation();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragRef.current || !pageContainerRef.current || !draggingElement) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    
    const containerRect = pageContainerRef.current.getBoundingClientRect();
    
    // Bounds check
    const newX = Math.max(0, Math.min(containerRect.width - 150, dragRef.current.initX + dx));
    const newY = Math.max(0, Math.min(containerRect.height - 80, dragRef.current.initY + dy));
    
    if (draggingElement === 'signature') {
      setSigConfig(prev => prev ? { ...prev, x: newX, y: newY } : null);
    } else if (draggingElement === 'initials') {
      setInitialsConfig(prev => prev ? { ...prev, x: newX, y: newY } : null);
    } else if (draggingElement === 'stamp') {
      setStampConfig(prev => prev ? { ...prev, x: newX, y: newY } : null);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggingElement(null);
  };

  const handleRemoveElement = (type: TabType) => {
    if (type === 'signature') setSigConfig(null);
    else if (type === 'initials') setInitialsConfig(null);
    else if (type === 'stamp') setStampConfig(null);
  };

  const handleSaveSignedPDF = async () => {
    if (!pdfBuffer || pdfPages.length === 0 || !pageContainerRef.current) return;
    if (!sigConfig && !initialsConfig && !stampConfig) {
      alert("Veuillez configurer et placer au moins un élément graphique.");
      return;
    }
    setLoading(true);
    setProgress("Génération du PDF signé...");

    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const totalPagesCount = pdfDoc.getPageCount();

      const container = pageContainerRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      const getPagesForElement = (config: ElementConfig): number[] => {
        const pagesToSign: number[] = [];
        if (config.pageMode === 'current') {
          pagesToSign.push(currentPage);
        } else if (config.pageMode === 'all') {
          for (let i = 0; i < totalPagesCount; i++) pagesToSign.push(i);
        } else if (config.pageMode === 'custom' && config.customPages) {
          for (const part of config.customPages.split(',')) {
            const trimmed = part.trim();
            if (trimmed.includes('-')) {
              const [from, to] = trimmed.split('-').map(n => Math.max(0, parseInt(n.trim()) - 1));
              for (let i = from; i <= Math.min(to, totalPagesCount - 1); i++) pagesToSign.push(i);
            } else {
              const idx = parseInt(trimmed) - 1;
              if (idx >= 0 && idx < totalPagesCount) pagesToSign.push(idx);
            }
          }
        }
        return pagesToSign;
      };

      const drawElementOnPage = async (pageIdx: number, config: ElementConfig, type: TabType) => {
        const page = pdfDoc.getPage(pageIdx);
        const { width: pdfWidth, height: pdfHeight } = page.getSize();

        const xPct = config.x / containerWidth;
        const yPct = config.y / containerHeight;

        // Calculate coordinates mapping top-left coordinates to bottom-left PDF coordinates
        const pdfX = xPct * pdfWidth;
        const elementHeightPct = 60 / containerHeight; // Approximate element height proportion
        const pdfY = (1 - yPct - elementHeightPct) * pdfHeight;

        if (config.mode === 'image' && config.content) {
          const response = await fetch(config.content);
          const imageBuffer = await response.arrayBuffer();
          const embeddedImage = config.content.includes('image/png') || config.content.startsWith('data:image/png')
            ? await pdfDoc.embedPng(imageBuffer)
            : await pdfDoc.embedJpg(imageBuffer);

          const widthScale = type === 'stamp' ? 120 : 100;
          const heightScale = type === 'stamp' ? 120 : 40;

          page.drawImage(embeddedImage, {
            x: pdfX,
            y: pdfY,
            width: widthScale * (pdfWidth / containerWidth),
            height: heightScale * (pdfHeight / containerHeight)
          });
        } else if (config.content) {
          page.drawText(config.content, {
            x: pdfX,
            y: pdfY,
            size: type === 'initials' ? 18 : 14,
            color: config.color === '#ef4444' ? 
              require('pdf-lib').rgb(0.9, 0.1, 0.1) : 
              config.color === '#3b82f6' ?
              require('pdf-lib').rgb(0.1, 0.5, 0.9) : 
              config.color === '#22c55e' ?
              require('pdf-lib').rgb(0.1, 0.7, 0.2) : 
              require('pdf-lib').rgb(0, 0, 0)
          });
        }
      };

      // Apply Signature
      if (sigConfig) {
        const pagesToSign = getPagesForElement(sigConfig);
        for (const idx of pagesToSign) {
          await drawElementOnPage(idx, sigConfig, 'signature');
        }
      }

      // Apply Initials
      if (initialsConfig) {
        const pagesToSign = getPagesForElement(initialsConfig);
        for (const idx of pagesToSign) {
          await drawElementOnPage(idx, initialsConfig, 'initials');
        }
      }

      // Apply Stamp
      if (stampConfig) {
        const pagesToSign = getPagesForElement(stampConfig);
        for (const idx of pagesToSign) {
          await drawElementOnPage(idx, stampConfig, 'stamp');
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = pdfFile ? pdfFile.name.replace(/\.pdf$/i, '_signe.pdf') : `document_signe_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onBack();
    } catch (err) {
      console.error(err);
      alert("Une erreur est survenue lors de l'intégration des signatures.");
    } finally {
      setLoading(false);
      setProgress("");
    }
  };

  const openConfigModal = (tab: TabType) => {
    setModalTab(tab);
    setIsModalOpen(true);
  };

  return (
    <div 
      className="w-full h-screen bg-gray-50 flex flex-col relative overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10 shrink-0">
        <div className="flex items-center space-x-3">
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500 cursor-pointer"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Signer un PDF</h1>
            <p className="text-xs text-gray-500">{pdfFile ? pdfFile.name : "Aucun fichier chargé"}</p>
          </div>
        </div>
        
        {pdfPages.length > 0 && (
          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => openConfigModal('signature')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl font-medium shadow-sm transition-colors flex items-center space-x-2 cursor-pointer text-xs uppercase tracking-wider font-bold"
            >
              <Edit3 className="w-4 h-4" />
              <span>Signature</span>
            </button>
            <button
              onClick={() => openConfigModal('initials')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium shadow-sm transition-colors flex items-center space-x-2 cursor-pointer text-xs uppercase tracking-wider font-bold"
            >
              <Edit3 className="w-4 h-4" />
              <span>Initiales</span>
            </button>
            <button
              onClick={() => openConfigModal('stamp')}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl font-medium shadow-sm transition-colors flex items-center space-x-2 cursor-pointer text-xs uppercase tracking-wider font-bold"
            >
              <Edit3 className="w-4 h-4" />
              <span>Tampon</span>
            </button>
            
            {(sigConfig || initialsConfig || stampConfig) && (
              <button
                onClick={handleSaveSignedPDF}
                className="bg-red-650 hover:bg-red-750 text-white px-5 py-2 rounded-xl font-bold shadow-md transition-all flex items-center space-x-2 cursor-pointer text-xs uppercase tracking-wider"
              >
                <Download className="w-4 h-4" />
                <span>Télécharger</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Workspace */}
      <div className="flex-1 overflow-auto p-8 flex justify-center items-start bg-gray-100 relative">
        {loading && (
          <div className="absolute inset-0 z-50 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <Loader className="w-10 h-10 text-purple-600 animate-spin" />
            <p className="text-sm font-bold text-slate-700">{progress}</p>
          </div>
        )}

        {pdfPages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 min-h-[450px]">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200 text-slate-400">
              <Upload className="w-10 h-10" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-800 mb-1">Chargez le PDF à signer</h3>
              <p className="text-slate-500 text-sm max-w-sm">Vous pourrez insérer simultanément une signature, des initiales et un tampon.</p>
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

            {/* Draggable container area */}
            <div 
              ref={pageContainerRef}
              className="bg-white shadow-xl relative border border-gray-200 select-none"
              style={{ width: '600px', height: `${600 * (pdfPages[currentPage].height / pdfPages[currentPage].width)}px` }}
            >
              <img 
                src={pdfPages[currentPage].src} 
                alt={`PDF Page ${currentPage + 1}`} 
                className="w-full h-full object-contain pointer-events-none select-none"
              />
              
              {/* Draggable Signature Overlay */}
              {sigConfig && (
                <div
                  style={{ left: `${sigConfig.x}px`, top: `${sigConfig.y}px` }}
                  className={`absolute cursor-move border-2 ${isDragging && draggingElement === 'signature' ? 'border-purple-500 bg-purple-50/50' : 'border-dashed border-purple-400 bg-white/80'} p-2 rounded flex flex-col items-center justify-center group z-50`}
                  onMouseDown={e => handleMouseDown(e, 'signature')}
                >
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleRemoveElement('signature'); }} 
                    className="absolute -top-2.5 -right-2.5 bg-red-100 border border-red-200 hover:bg-red-200 text-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <div className="absolute top-1 right-1 opacity-20 group-hover:opacity-85 pointer-events-none">
                    <Move className="w-3 h-3 text-slate-650" />
                  </div>
                  
                  {sigConfig.mode === 'text' && (
                    <span 
                      style={{ color: sigConfig.color, fontFamily: sigConfig.font }} 
                      className="text-2xl whitespace-nowrap px-3 py-1.5 select-none"
                    >
                      {sigConfig.content || 'Signature'}
                    </span>
                  )}
                  {sigConfig.mode === 'draw' && sigConfig.content && (
                    <img src={sigConfig.content} alt="Signature tracée" className="max-h-16 pointer-events-none select-none" />
                  )}
                </div>
              )}

              {/* Draggable Initials Overlay */}
              {initialsConfig && (
                <div
                  style={{ left: `${initialsConfig.x}px`, top: `${initialsConfig.y}px` }}
                  className={`absolute cursor-move border-2 ${isDragging && draggingElement === 'initials' ? 'border-blue-500 bg-blue-50/50' : 'border-dashed border-blue-400 bg-white/80'} p-2 rounded flex flex-col items-center justify-center group z-50`}
                  onMouseDown={e => handleMouseDown(e, 'initials')}
                >
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleRemoveElement('initials'); }} 
                    className="absolute -top-2.5 -right-2.5 bg-red-100 border border-red-200 hover:bg-red-200 text-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <div className="absolute top-1 right-1 opacity-20 group-hover:opacity-85 pointer-events-none">
                    <Move className="w-3 h-3 text-slate-650" />
                  </div>
                  
                  <span 
                    style={{ color: initialsConfig.color, fontFamily: initialsConfig.font }} 
                    className="text-xl font-bold whitespace-nowrap px-4 py-1 select-none"
                  >
                    {initialsConfig.content || 'Initials'}
                  </span>
                </div>
              )}

              {/* Draggable Stamp Overlay */}
              {stampConfig && (
                <div
                  style={{ left: `${stampConfig.x}px`, top: `${stampConfig.y}px` }}
                  className={`absolute cursor-move border-2 ${isDragging && draggingElement === 'stamp' ? 'border-amber-500 bg-amber-50/50' : 'border-dashed border-amber-400 bg-white/80'} p-2 rounded flex flex-col items-center justify-center group z-50`}
                  onMouseDown={e => handleMouseDown(e, 'stamp')}
                >
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleRemoveElement('stamp'); }} 
                    className="absolute -top-2.5 -right-2.5 bg-red-100 border border-red-200 hover:bg-red-200 text-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <div className="absolute top-1 right-1 opacity-20 group-hover:opacity-85 pointer-events-none">
                    <Move className="w-3 h-3 text-slate-650" />
                  </div>
                  
                  {stampConfig.content && (
                    <img src={stampConfig.content} alt="Tampon" className="max-h-24 opacity-90 pointer-events-none mix-blend-multiply select-none" />
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <SignatureModal 
          activeType={modalTab}
          onClose={() => setIsModalOpen(false)} 
          onApply={handleApplyElement} 
        />
      )}
    </div>
  );
}

// ── Reusable Modal for Signature Configuration ─────────────────
interface SignatureModalProps {
  activeType: TabType;
  onClose: () => void;
  onApply: (config: ElementConfig) => void;
}

function SignatureModal({ activeType, onClose, onApply }: SignatureModalProps) {
  const [fullName, setFullName] = useState('Jean Dupont');
  const [initialsText, setInitialsText] = useState('JD');
  const [activeTab, setActiveTab] = useState<TabType>(activeType);
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [color, setColor] = useState<ColorType>('#000000');
  const [font, setFont] = useState<string>('"Brush Script MT", "Segoe Print", cursive');
  const [pageMode, setPageMode] = useState<PageMode>('current');
  const [customPages, setCustomPages] = useState<string>('');

  const [stampImage, setStampImage] = useState<string | null>(null);
  const [drawnImage, setDrawnImage] = useState<string | null>(null);

  const colors: ColorType[] = ['#000000', '#ef4444', '#3b82f6', '#22c55e'];
  const fonts = [
    { name: 'Manuscrite', value: '"Brush Script MT", "Segoe Print", cursive' },
    { name: 'Classique', value: 'Georgia, serif' },
    { name: 'Moderne', value: 'Arial, sans-serif' },
    { name: 'Élégante', value: '"Courier New", monospace' }
  ];

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (inputMode === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [inputMode, color, activeTab]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setDrawnImage(canvas.toDataURL('image/png'));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setDrawnImage(null);
    }
  };

  const handleStampUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setStampImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    let content: string | null = null;
    let finalMode: InputMode = inputMode;

    if (activeTab === 'signature') {
      if (inputMode === 'text') content = fullName;
      else if (inputMode === 'draw') content = drawnImage;
    } else if (activeTab === 'initials') {
      content = initialsText;
      finalMode = 'text';
    } else if (activeTab === 'stamp') {
      content = stampImage;
      finalMode = 'image';
    }

    onApply({
      type: activeTab,
      mode: finalMode,
      content,
      color,
      font,
      pageMode,
      customPages,
      x: activeTab === 'signature' ? 50 : activeTab === 'initials' ? 250 : 450,
      y: 100
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-purple-650" />
            <span>Configurer l'Élément ({activeTab === 'signature' ? 'Signature' : activeTab === 'initials' ? 'Initiales' : 'Tampon'})</span>
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {(['signature', 'initials', 'stamp'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg uppercase tracking-wider transition-colors cursor-pointer ${
                activeTab === tab ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab === 'signature' ? 'Signature' : tab === 'initials' ? 'Initiales' : 'Tampon / Image'}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        {activeTab === 'signature' && (
          <div className="space-y-4">
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setInputMode('text')}
                className={`flex-1 py-2 border rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                  inputMode === 'text' ? 'border-purple-600 bg-purple-50 text-purple-700 font-bold' : 'border-slate-200 text-slate-650 hover:bg-slate-50'
                }`}
              >
                Saisir du texte
              </button>
              <button
                type="button"
                onClick={() => setInputMode('draw')}
                className={`flex-1 py-2 border rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                  inputMode === 'draw' ? 'border-purple-600 bg-purple-50 text-purple-700 font-bold' : 'border-slate-200 text-slate-650 hover:bg-slate-50'
                }`}
              >
                Dessiner la signature
              </button>
            </div>

            {inputMode === 'text' ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Saisissez votre nom..."
                />
                <div className="grid grid-cols-2 gap-3">
                  {fonts.map((f) => (
                    <button
                      key={f.name}
                      onClick={() => setFont(f.value)}
                      style={{ fontFamily: f.value }}
                      className={`p-3 border rounded-xl text-lg text-center cursor-pointer transition-all ${
                        font === f.value ? 'border-purple-500 bg-purple-50/50 font-bold shadow-sm' : 'border-slate-150 hover:bg-slate-50'
                      }`}
                    >
                      {fullName || 'Signature'}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <canvas
                    ref={canvasRef}
                    width={450}
                    height={150}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className="border border-slate-200 rounded-xl cursor-crosshair w-full h-[150px] bg-slate-50 touch-none shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="absolute bottom-2 right-2 bg-red-50 hover:bg-red-100 text-red-650 text-[10px] font-bold px-2 py-1 rounded border border-red-200 transition-colors"
                  >
                    Effacer
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Contents Initials */}
        {activeTab === 'initials' && (
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Vos Initiales</label>
            <input
              type="text"
              value={initialsText}
              onChange={(e) => setInitialsText(e.target.value.substring(0, 3))}
              className="w-24 text-center text-sm px-3 py-2 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold uppercase"
              placeholder="ex: JD"
            />
          </div>
        )}

        {/* Tab Contents Stamp */}
        {activeTab === 'stamp' && (
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Image du tampon (PNG transparent recommandé)</label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => document.getElementById('stamp-file-input')?.click()}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-250 text-slate-750 text-xs font-bold rounded-xl cursor-pointer transition-colors border border-slate-200 shadow-sm"
              >
                Sélectionner l'image
              </button>
              <input
                id="stamp-file-input"
                type="file"
                accept="image/*"
                onChange={handleStampUpload}
                className="hidden"
              />
              {stampImage && <span className="text-xs text-green-600 font-bold flex items-center gap-1">✓ Image importée</span>}
            </div>
            {stampImage && (
              <div className="w-28 h-28 border rounded-xl overflow-hidden p-2 flex items-center justify-center bg-slate-50 shadow-inner">
                <img src={stampImage} alt="Stamp Preview" className="max-w-full max-h-full object-contain" />
              </div>
            )}
          </div>
        )}

        {/* Configurations Communes (Couleur + Pages) */}
        {activeTab !== 'stamp' && (
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Couleur d'encre</label>
            <div className="flex gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-8 h-8 rounded-full border-2 cursor-pointer transition-all ${
                    color === c ? 'border-purple-655 scale-110 shadow-md ring-2 ring-purple-200' : 'border-transparent hover:scale-105 shadow-sm'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Appliquer sur les pages</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-1.5 text-xs text-slate-650 cursor-pointer">
              <input type="radio" checked={pageMode === 'current'} onChange={() => setPageMode('current')} className="accent-purple-650 w-4 h-4" />
              <span className="font-medium">Page Actuelle</span>
            </label>
            <label className="flex items-center gap-1.5 text-xs text-slate-650 cursor-pointer">
              <input type="radio" checked={pageMode === 'all'} onChange={() => setPageMode('all')} className="accent-purple-650 w-4 h-4" />
              <span className="font-medium">Toutes les pages</span>
            </label>
            <label className="flex items-center gap-1.5 text-xs text-slate-650 cursor-pointer">
              <input type="radio" checked={pageMode === 'custom'} onChange={() => setPageMode('custom')} className="accent-purple-650 w-4 h-4" />
              <span className="font-medium">Plage personnalisée</span>
            </label>
          </div>
          {pageMode === 'custom' && (
            <input
              type="text"
              placeholder="ex: 1-3, 5"
              value={customPages}
              onChange={(e) => setCustomPages(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 mt-1"
            />
          )}
        </div>

        {/* Modal Buttons */}
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-500 transition-colors cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            Appliquer l'élément
          </button>
        </div>
      </div>
    </div>
  );
}
