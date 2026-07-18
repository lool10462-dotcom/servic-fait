import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Edit3, Type, Image as ImageIcon, Check, Move, ArrowLeft, Loader, Download } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

type TabType = 'signature' | 'initials' | 'stamp';
type InputMode = 'text' | 'draw' | 'image';
type PageMode = 'current' | 'all' | 'custom';
type ColorType = '#000000' | '#ef4444' | '#3b82f6' | '#22c55e';

interface SignatureConfig {
  type: TabType;
  mode: InputMode;
  content: string | null;
  color: string;
  font?: string;
  pageMode: PageMode;
  customPages?: string;
}

interface SignerPDFProps {
  onBack: () => void;
}

export default function SignerPDF({ onBack }: SignerPDFProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [appliedSignature, setAppliedSignature] = useState<SignatureConfig | null>(null);
  
  // PDF states
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(null);
  const [pdfPages, setPdfPages] = useState<{ src: string; width: number; height: number }[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  
  // Dragging states
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; initX: number; initY: number } | null>(null);
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const initialFileInputRef = useRef<HTMLInputElement>(null);

  const handleApply = (config: SignatureConfig) => {
    setAppliedSignature(config);
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
      setPosition({ x: 50, y: 50 });
    } catch (err) {
      console.error(err);
      alert("Une erreur est survenue lors de la lecture du document PDF.");
    } finally {
      setLoading(false);
      setProgress("");
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: position.x,
      initY: position.y
    };
    e.stopPropagation();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragRef.current || !pageContainerRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    
    const containerRect = pageContainerRef.current.getBoundingClientRect();
    
    // Bounds check
    const newX = Math.max(0, Math.min(containerRect.width - 150, dragRef.current.initX + dx));
    const newY = Math.max(0, Math.min(containerRect.height - 60, dragRef.current.initY + dy));
    
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSaveSignedPDF = async () => {
    if (!pdfBuffer || !appliedSignature || pdfPages.length === 0 || !pageContainerRef.current) return;
    setLoading(true);
    setProgress("Fusion de la signature dans le PDF...");

    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const totalPagesCount = pdfDoc.getPageCount();

      // Determine which pages to apply signature on
      const pagesToSign: number[] = [];
      if (appliedSignature.pageMode === 'current') {
        pagesToSign.push(currentPage);
      } else if (appliedSignature.pageMode === 'all') {
        for (let i = 0; i < totalPagesCount; i++) pagesToSign.push(i);
      } else if (appliedSignature.pageMode === 'custom' && appliedSignature.customPages) {
        for (const part of appliedSignature.customPages.split(',')) {
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

      // Convert signature screen coordinates to PDF points coordinates
      const container = pageContainerRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      const xPct = position.x / containerWidth;
      const yPct = position.y / containerHeight;

      // Get signature image as buffer if it's draw or image
      let embeddedSigImage: any = null;
      let signatureType: 'image' | 'text' = 'text';
      let signatureDataUrl: string | null = null;

      if (appliedSignature.mode === 'draw' && appliedSignature.content) {
        signatureType = 'image';
        signatureDataUrl = appliedSignature.content;
      } else if (appliedSignature.mode === 'image' && appliedSignature.content) {
        signatureType = 'image';
        signatureDataUrl = appliedSignature.content;
      } else if (appliedSignature.type === 'stamp' && appliedSignature.content) {
        signatureType = 'image';
        signatureDataUrl = appliedSignature.content;
      }

      if (signatureType === 'image' && signatureDataUrl) {
        const sigResponse = await fetch(signatureDataUrl);
        const sigImageBuffer = await sigResponse.arrayBuffer();
        embeddedSigImage = await pdfDoc.embedPng(sigImageBuffer);
      }

      for (const pageIdx of pagesToSign) {
        const page = pdfDoc.getPage(pageIdx);
        const { width: pdfWidth, height: pdfHeight } = page.getSize();

        // Calculate mapped coordinates
        const pdfX = xPct * pdfWidth;
        // Flip Y-axis (PDF goes from bottom up, screen goes from top down)
        const elementHeightPct = 50 / containerHeight; // approximate height
        const pdfY = (1 - yPct - elementHeightPct) * pdfHeight;

        if (signatureType === 'image' && embeddedSigImage) {
          // Draw signature image
          page.drawImage(embeddedSigImage, {
            x: pdfX,
            y: pdfY,
            width: 100 * (pdfWidth / containerWidth),
            height: 40 * (pdfHeight / containerHeight)
          });
        } else {
          // Draw plain text signature
          page.drawText(appliedSignature.content || 'Signature', {
            x: pdfX,
            y: pdfY,
            size: 14,
            color: appliedSignature.color === '#ef4444' ? 
              require('pdf-lib').rgb(0.9, 0.1, 0.1) : 
              appliedSignature.color === '#3b82f6' ?
              require('pdf-lib').rgb(0.1, 0.5, 0.9) : 
              appliedSignature.color === '#22c55e' ?
              require('pdf-lib').rgb(0.1, 0.7, 0.2) : 
              require('pdf-lib').rgb(0, 0, 0)
          });
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
    } catch (err) {
      console.error(err);
      alert("Une erreur est survenue lors de l'intégration de la signature.");
    } finally {
      setLoading(false);
      setProgress("");
    }
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
              onClick={() => setIsModalOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-xl font-medium shadow-sm transition-colors flex items-center space-x-2 cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>Configurer la signature</span>
            </button>
            {appliedSignature && (
              <button
                onClick={handleSaveSignedPDF}
                className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl font-bold shadow-sm transition-colors flex items-center space-x-2 cursor-pointer"
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
              <p className="text-slate-500 text-sm max-w-sm">Le document restera local sur votre ordinateur pour un maximum de sécurité.</p>
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
              className="bg-white shadow-xl relative border border-gray-200"
              style={{ width: '600px', height: `${600 * (pdfPages[currentPage].height / pdfPages[currentPage].width)}px` }}
            >
              <img 
                src={pdfPages[currentPage].src} 
                alt={`PDF Page ${currentPage + 1}`} 
                className="w-full h-full object-contain pointer-events-none select-none"
              />
              
              {/* Draggable Signature Overlay */}
              {appliedSignature && (
                <div
                  style={{ left: `${position.x}px`, top: `${position.y}px` }}
                  className={`absolute cursor-move border-2 ${isDragging ? 'border-purple-500 bg-purple-50/50' : 'border-dashed border-purple-400 bg-white/70'} p-2 rounded flex flex-col items-center justify-center group z-50`}
                  onMouseDown={handleMouseDown}
                >
                  <div className="absolute -top-3 -right-3 bg-white p-1 rounded-full shadow border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Move className="w-3.5 h-3.5 text-gray-500" />
                  </div>
                  
                  {appliedSignature.mode === 'text' && (
                    <span 
                      style={{ color: appliedSignature.color, fontFamily: appliedSignature.font }} 
                      className="text-2xl whitespace-nowrap px-3 py-1.5 select-none"
                    >
                      {appliedSignature.content || 'Signature'}
                    </span>
                  )}
                  {appliedSignature.mode === 'draw' && appliedSignature.content && (
                    <img src={appliedSignature.content} alt="Signature tracée" className="max-h-16 pointer-events-none select-none" />
                  )}
                  {appliedSignature.mode === 'image' && appliedSignature.content && (
                    <img src={appliedSignature.content} alt="Signature importée" className="max-h-20 pointer-events-none select-none" />
                  )}
                  {appliedSignature.type === 'stamp' && appliedSignature.content && (
                    <img src={appliedSignature.content} alt="Tampon" className="max-h-24 opacity-90 pointer-events-none mix-blend-multiply select-none" />
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
          onClose={() => setIsModalOpen(false)} 
          onApply={handleApply} 
        />
      )}
    </div>
  );
}

// ── Reusable Modal for Signature Configuration ─────────────────
interface SignatureModalProps {
  onClose: () => void;
  onApply: (config: SignatureConfig) => void;
}

function SignatureModal({ onClose, onApply }: SignatureModalProps) {
  const [fullName, setFullName] = useState('Jean Dupont');
  const [initialsText, setInitialsText] = useState('JD');
  const [activeTab, setActiveTab] = useState<TabType>('signature');
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

    if (activeTab === 'signature') {
      if (inputMode === 'text') content = fullName;
      else if (inputMode === 'draw') content = drawnImage;
    } else if (activeTab === 'initials') {
      content = initialsText;
    } else if (activeTab === 'stamp') {
      content = stampImage;
    }

    onApply({
      type: activeTab,
      mode: activeTab === 'stamp' ? 'image' : inputMode,
      content,
      color,
      font,
      pageMode,
      customPages
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-purple-650" />
            Configurer l'Élément Graphique
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
                className={`flex-1 py-2 border rounded-xl text-xs font-semibold cursor-pointer ${
                  inputMode === 'text' ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-slate-200 text-slate-600'
                }`}
              >
                Saisir du texte
              </button>
              <button
                type="button"
                onClick={() => setInputMode('draw')}
                className={`flex-1 py-2 border rounded-xl text-xs font-semibold cursor-pointer ${
                  inputMode === 'draw' ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-slate-200 text-slate-600'
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
                  className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Saisissez votre nom..."
                />
                <div className="grid grid-cols-2 gap-3">
                  {fonts.map((f) => (
                    <button
                      key={f.name}
                      onClick={() => setFont(f.value)}
                      style={{ fontFamily: f.value }}
                      className={`p-3 border rounded-xl text-lg text-center cursor-pointer transition-all ${
                        font === f.value ? 'border-purple-500 bg-purple-50/50 font-bold' : 'border-slate-100 hover:bg-slate-50'
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
                    className="border border-slate-200 rounded-xl cursor-crosshair w-full h-[150px] bg-slate-50 touch-none"
                  />
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="absolute bottom-2 right-2 bg-red-50 hover:bg-red-100 text-red-650 text-[10px] font-bold px-2 py-1 rounded border border-red-200"
                  >
                    Effacer
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'initials' && (
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Initiales</label>
            <input
              type="text"
              value={initialsText}
              onChange={(e) => setInitialsText(e.target.value.substring(0, 3))}
              className="w-24 text-center text-sm px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="ex: JD"
            />
          </div>
        )}

        {activeTab === 'stamp' && (
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Charger une image (PNG / JPG)</label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => document.getElementById('stamp-file-input')?.click()}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
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
              {stampImage && <span className="text-xs text-green-600 font-semibold flex items-center">✓ Chargé</span>}
            </div>
            {stampImage && (
              <div className="w-24 h-24 border rounded-xl overflow-hidden p-1 flex items-center justify-center bg-slate-50">
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
                    color === c ? 'border-purple-600 scale-110 shadow' : 'border-transparent'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Appliquer sur les pages</label>
          <div className="flex gap-3">
            <label className="flex items-center gap-1.5 text-xs text-slate-650 cursor-pointer">
              <input type="radio" checked={pageMode === 'current'} onChange={() => setPageMode('current')} />
              <span>Page Actuelle</span>
            </label>
            <label className="flex items-center gap-1.5 text-xs text-slate-650 cursor-pointer">
              <input type="radio" checked={pageMode === 'all'} onChange={() => setPageMode('all')} />
              <span>Toutes les pages</span>
            </label>
            <label className="flex items-center gap-1.5 text-xs text-slate-650 cursor-pointer">
              <input type="radio" checked={pageMode === 'custom'} onChange={() => setPageMode('custom')} />
              <span>Plage personnalisée</span>
            </label>
          </div>
          {pageMode === 'custom' && (
            <input
              type="text"
              placeholder="ex: 1-3, 5"
              value={customPages}
              onChange={(e) => setCustomPages(e.target.value)}
              className="w-full text-sm px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 mt-1"
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
            className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors shadow-md cursor-pointer"
          >
            Appliquer
          </button>
        </div>
      </div>
    </div>
  );
}
