import React, { useState, useRef } from "react";
import { ArrowLeft, Hash, ChevronLeft, ChevronRight, Bold, Italic, RotateCcw, Check, Upload, Loader } from "lucide-react";
import { PDFDocument } from "pdf-lib";

interface NumerosPDFProps {
  pdfPages: string[];
  onBack: () => void;
}

type Position = "tl" | "tc" | "tr" | "ml" | "mc" | "mr" | "bl" | "bc" | "br";

const FORMATS = [
  { key: "pageX", label: "Page X", example: "Page 1" },
  { key: "xOfY", label: "X / Y", example: "1 / 5" },
  { key: "pageXsurY", label: "Page X sur Y", example: "Page 1 sur 5" },
  { key: "x", label: "X", example: "1" },
  { key: "dashX", label: "- X -", example: "- 1 -" },
];

const PRESET_COLORS = [
  { label: "Noir", value: "#000000" },
  { label: "Gris", value: "#6b7280" },
  { label: "Rouge", value: "#dc2626" },
  { label: "Bleu", value: "#2563eb" },
  { label: "Blanc", value: "#ffffff" },
];

const FONTS = ["Arial", "Times New Roman", "Courier New", "Helvetica"];

const POSITION_MAP: Record<Position, React.CSSProperties> = {
  tl: { top: 0, left: 0 },
  tc: { top: 0, left: "50%", transform: "translateX(-50%)" },
  tr: { top: 0, right: 0 },
  ml: { top: "50%", left: 0, transform: "translateY(-50%)" },
  mc: { top: "50%", left: "50%", transform: "translate(-50%,-50%)" },
  mr: { top: "50%", right: 0, transform: "translateY(-50%)" },
  bl: { bottom: 0, left: 0 },
  bc: { bottom: 0, left: "50%", transform: "translateX(-50%)" },
  br: { bottom: 0, right: 0 },
};

export default function NumerosPDF({ onBack }: NumerosPDFProps) {
  const [format, setFormat] = useState("pageX");
  const [position, setPosition] = useState<Position>("bc");
  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontSize, setFontSize] = useState(12);
  const [color, setColor] = useState("#000000");
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [allPages, setAllPages] = useState(true);
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(1);
  const [startNumber, setStartNumber] = useState(1);
  const [skipFirst, setSkipFirst] = useState(false);
  const [margin, setMargin] = useState(30);
  const [currentPage, setCurrentPage] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // PDF states
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(null);
  const [pages, setPages] = useState<{ src: string; width: number; height: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const initialFileInputRef = useRef<HTMLInputElement>(null);

  const total = pages.length;

  const getPageNumber = (pageIndex: number): string | null => {
    const pageNum = pageIndex + 1;
    if (skipFirst && pageNum === 1) return null;
    if (!allPages && (pageNum < startPage || pageNum > endPage)) return null;

    const displayNum = skipFirst ? startNumber + pageIndex - 1 : startNumber + pageIndex;
    const displayTotal = skipFirst ? total - 1 : total;

    switch (format) {
      case "pageX": return `Page ${displayNum}`;
      case "xOfY": return `${displayNum} / ${displayTotal}`;
      case "pageXsurY": return `Page ${displayNum} sur ${displayTotal}`;
      case "x": return `${displayNum}`;
      case "dashX": return `- ${displayNum} -`;
      default: return `${displayNum}`;
    }
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

      setPages(pagesData);
      setEndPage(pdf.numPages);
      setCurrentPage(0);
    } catch (err) {
      console.error(err);
      alert("Une erreur est survenue lors de la lecture du fichier PDF.");
    } finally {
      setLoading(false);
      setProgress("");
    }
  };

  const positionGrid: Position[][] = [
    ["tl", "tc", "tr"],
    ["ml", "mc", "mr"],
    ["bl", "bc", "br"],
  ];

  const numberText = getPageNumber(currentPage);

  const handleReset = () => {
    setFormat("pageX");
    setPosition("bc");
    setFontFamily("Arial");
    setFontSize(12);
    setColor("#000000");
    setBold(false);
    setItalic(false);
    setAllPages(true);
    setStartPage(1);
    setEndPage(pages.length);
    setStartNumber(1);
    setSkipFirst(false);
    setMargin(30);
  };

  const handleApply = async () => {
    if (!pdfBuffer || pages.length === 0) return;
    setIsSaving(true);
    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const totalPages = pdfDoc.getPageCount();

      for (let i = 0; i < totalPages; i++) {
        const pageNumText = getPageNumber(i);
        if (pageNumText) {
          const page = pdfDoc.getPage(i);
          const { width, height } = page.getSize();

          // Approximate text dimensions
          const textLength = pageNumText.length;
          const estTextWidth = textLength * (fontSize * 0.45);
          const estTextHeight = fontSize * 0.8;

          // Convert margin to PDF points (1 px = 0.75 pt approx)
          const ptMargin = margin * 0.75;

          // Map positions
          let x = 0;
          let y = 0;

          // X Coordinate
          if (position.endsWith("l")) {
            x = ptMargin;
          } else if (position.endsWith("c")) {
            x = (width / 2) - (estTextWidth / 2);
          } else if (position.endsWith("r")) {
            x = width - ptMargin - estTextWidth;
          }

          // Y Coordinate
          if (position.startsWith("b")) {
            y = ptMargin;
          } else if (position.startsWith("m")) {
            y = (height / 2) - (estTextHeight / 2);
          } else if (position.startsWith("t")) {
            y = height - ptMargin - estTextHeight;
          }

          page.drawText(pageNumText, {
            x,
            y,
            size: fontSize * 0.75,
            color: color === '#dc2626' ? 
              require('pdf-lib').rgb(0.9, 0.1, 0.1) : 
              color === '#2563eb' ?
              require('pdf-lib').rgb(0.1, 0.4, 0.9) : 
              color === '#6b7280' ?
              require('pdf-lib').rgb(0.4, 0.4, 0.4) :
              color === '#ffffff' ?
              require('pdf-lib').rgb(1, 1, 1) :
              require('pdf-lib').rgb(0, 0, 0)
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = pdfFile ? pdfFile.name.replace(/\.pdf$/i, '_numerote.pdf') : `document_numerote_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onBack();
    } catch (err) {
      console.error("Apply numbering error:", err);
      alert("Une erreur est survenue lors de l'application de la numérotation.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 text-slate-800 font-sans min-h-screen">
      {/* Header */}
      <div className="h-16 flex items-center gap-3 px-6 bg-white border-b border-slate-200 shrink-0 shadow-sm z-10">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer text-slate-500"><ArrowLeft className="w-5 h-5" /></button>
        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
          <Hash className="w-5 h-5" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Numérotation avancée</h2>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 z-50 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <Loader className="w-10 h-10 text-purple-600 animate-spin" />
            <p className="text-sm font-bold text-slate-700">{progress}</p>
          </div>
        )}

        {pages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full w-full gap-6 min-h-[450px]">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200 text-slate-400">
              <Upload className="w-10 h-10" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-800 mb-1">Chargez le PDF à numéroter</h3>
              <p className="text-slate-500 text-sm max-w-sm">Le document restera local sur votre ordinateur pour un maximum de sécurité.</p>
            </div>
            <button onClick={() => initialFileInputRef.current?.click()} className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl text-white font-bold cursor-pointer transition-all shadow-md">
              <span>Sélectionner le PDF</span>
            </button>
            <input ref={initialFileInputRef} type="file" accept="application/pdf" className="hidden" onChange={e => { if (e.target.files) handleFileChange(e.target.files); e.target.value = ""; }} />
          </div>
        ) : (
          <>
            {/* Options sidebar */}
            <div className="w-80 border-r border-slate-200 bg-white overflow-auto p-6 space-y-8 shrink-0 shadow-sm z-10">
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Format de numérotation</h3>
                <div className="space-y-2">
                  {FORMATS.map(f => (
                    <label key={f.key} className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all border ${format === f.key ? "bg-orange-50 border-orange-500 shadow-sm" : "border-slate-200 hover:bg-slate-50 hover:border-slate-300"}`}>
                      <input type="radio" name="format" checked={format === f.key} onChange={() => setFormat(f.key)} className="accent-orange-600 w-4 h-4" />
                      <div className="flex-1 flex flex-col">
                        <span className="text-sm font-bold text-slate-800">{f.label}</span>
                        <span className="text-xs text-slate-500 mt-0.5">{f.example}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Position sur la page</h3>
                <div className="grid grid-cols-3 gap-2 w-40 mx-auto p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  {positionGrid.map((row) =>
                    row.map(pos => (
                      <button
                        key={pos}
                        disabled={pos === "mc"}
                        onClick={() => setPosition(pos)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-bold transition-all cursor-pointer ${
                          pos === "mc" ? "bg-slate-200/50 text-slate-400 cursor-not-allowed" :
                          position === pos ? "bg-orange-600 text-white shadow-md scale-110" : "bg-white border border-slate-200 text-slate-400 hover:border-orange-300 hover:text-orange-500"
                        }`}
                      >
                        {pos === "mc" ? "—" : "●"}
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Style typographique</h3>
                <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1.5">Police d'écriture</label>
                    <select value={fontFamily} onChange={e => setFontFamily(e.target.value)} className="w-full text-sm bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none">
                      {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 flex justify-between mb-1.5">
                      <span>Taille du texte</span>
                      <span className="font-bold">{fontSize}px</span>
                    </label>
                    <input type="range" min={8} max={36} value={fontSize} onChange={e => setFontSize(+e.target.value)} className="w-full accent-orange-600" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-2">Couleur du texte</label>
                    <div className="flex gap-2">
                      {PRESET_COLORS.map(c => (
                        <button key={c.value} onClick={() => setColor(c.value)} className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer shadow-sm ${color === c.value ? "border-orange-500 scale-110 ring-2 ring-orange-200" : "border-slate-300 hover:scale-105"}`} style={{ background: c.value }} title={c.label} />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setBold(!bold)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all border ${bold ? "bg-orange-100 border-orange-200 text-orange-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                      <Bold className="w-4 h-4" /><span>Gras</span>
                    </button>
                    <button onClick={() => setItalic(!italic)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all border ${italic ? "bg-orange-100 border-orange-200 text-orange-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                      <Italic className="w-4 h-4" /><span>Italique</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Pages et numéros</h3>
                <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={allPages} onChange={e => setAllPages(e.target.checked)} className="accent-orange-600 w-4 h-4 rounded" />
                    <span className="text-sm font-bold text-slate-700">Toutes les pages</span>
                  </label>
                  
                  {!allPages && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="text-xs text-slate-500 block mb-1">De la page</label>
                        <input type="number" min={1} max={total} value={startPage} onChange={e => setStartPage(+e.target.value)} className="w-full text-sm bg-white border border-slate-300 rounded-xl px-3 py-2 text-center text-slate-800 focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 block mb-1">À la page</label>
                        <input type="number" min={1} max={total} value={endPage} onChange={e => setEndPage(+e.target.value)} className="w-full text-sm bg-white border border-slate-300 rounded-xl px-3 py-2 text-center text-slate-800 focus:outline-none" />
                      </div>
                    </div>
                  )}
                  
                  <div className="pt-2">
                    <label className="text-xs font-medium text-slate-600 block mb-1.5">Numéro de départ</label>
                    <input type="number" min={1} value={startNumber} onChange={e => setStartNumber(+e.target.value)} className="w-full text-sm bg-white border border-slate-300 rounded-xl px-3 py-2 text-center text-slate-800 focus:outline-none" />
                  </div>
                  
                  <label className="flex items-start gap-3 cursor-pointer pt-2">
                    <input type="checkbox" checked={skipFirst} onChange={e => setSkipFirst(e.target.checked)} className="accent-orange-600 w-4 h-4 rounded mt-0.5" />
                    <div>
                      <span className="text-sm font-medium text-slate-700 block">Ignorer la couverture</span>
                      <span className="text-xs text-slate-500 block mt-0.5">Commencer à la page 2</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex justify-between">
                  <span>Marge</span>
                  <span className="text-orange-600">{margin}px</span>
                </h3>
                <input type="range" min={10} max={100} value={margin} onChange={e => setMargin(+e.target.value)} className="w-full accent-orange-600" />
              </div>
            </div>

            {/* Document Preview Viewport */}
            <div className="flex-1 flex flex-col p-8 overflow-auto relative">
              <div className="absolute inset-0 pattern-dots bg-[length:20px_20px] opacity-30 pointer-events-none"></div>
              <div className="flex items-center justify-center min-h-full">
                <div className="relative bg-white shadow-2xl rounded-sm border border-slate-200 transition-all">
                  <img src={pages[currentPage].src} alt={`Page ${currentPage + 1}`} className="max-h-[70vh] w-auto block opacity-95" draggable={false} />
                  
                  {numberText && (
                    <div
                      className="absolute pointer-events-none select-none"
                      style={{
                        ...POSITION_MAP[position],
                        padding: `${margin * 0.75}px`,
                        zIndex: 10,
                      }}
                    >
                      <span
                        className="shadow-sm border border-slate-200/50 backdrop-blur-sm"
                        style={{
                          fontFamily,
                          fontSize: `${fontSize * 0.75}px`,
                          fontWeight: bold ? "bold" : "normal",
                          fontStyle: italic ? "italic" : "normal",
                          color,
                          background: color === "#ffffff" ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.9)",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {numberText}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom bar */}
      {pages.length > 0 && (
        <div className="h-20 flex items-center justify-between px-8 bg-white border-t border-slate-200 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] z-20">
          <div className="flex items-center gap-6 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
            <button onClick={() => setCurrentPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0} className="p-2 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-30 cursor-pointer transition-all text-slate-600"><ChevronLeft className="w-5 h-5" /></button>
            <span className="text-sm font-bold text-slate-700">Page {currentPage + 1} sur {total}</span>
            <button onClick={() => setCurrentPage(Math.min(total - 1, currentPage + 1))} disabled={currentPage >= total - 1} className="p-2 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-30 cursor-pointer transition-all text-slate-600"><ChevronRight className="w-5 h-5" /></button>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={handleReset} className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-800 cursor-pointer transition-all">
              <RotateCcw className="w-4 h-4" /><span>Réinitialiser</span>
            </button>
            <button onClick={handleApply} disabled={isSaving} className="flex items-center gap-2 px-8 py-3 bg-orange-600 hover:bg-orange-700 rounded-xl text-white font-bold cursor-pointer transition-all shadow-lg">
              {isSaving ? <Loader className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
              <span className="text-base">{isSaving ? "Enregistrement..." : "Appliquer la numérotation"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
