import React, { useState, useRef } from "react";
import { ArrowLeft, Trash2, RotateCw, Upload, Plus, Check, GripVertical, Copy, Loader } from "lucide-react";
import { PDFDocument, degrees } from "pdf-lib";

interface OrganiserPDFProps {
  pdfPages: string[];
  onBack: () => void;
  onPagesUpdate: (newPages: string[]) => void;
}

interface PageItem {
  id: string;
  src: string;
  rotation: number;
  sourceFileId: string;
  sourcePageIndex: number;
  isImage?: boolean;
  imageType?: string;
}

interface SourceFile {
  id: string;
  name: string;
  buffer: ArrayBuffer;
}

export default function OrganiserPDF({ onBack }: OrganiserPDFProps) {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [sourceFiles, setSourceFiles] = useState<SourceFile[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialFileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (filesList: FileList) => {
    setLoading(true);
    setProgress("Lecture et rendu des pages du fichier...");
    try {
      const newPageItems: PageItem[] = [];
      const newSourceFiles: SourceFile[] = [];

      for (const file of Array.from(filesList)) {
        if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
          const arrayBuffer = await file.arrayBuffer();
          const pdfjsLib = await import("pdfjs-dist");
          pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
            "pdfjs-dist/build/pdf.worker.mjs",
            import.meta.url
          ).toString();

          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
          newSourceFiles.push({ id: fileId, name: file.name, buffer: arrayBuffer });

          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            setProgress(`Rendu de la page ${pageNum}/${pdf.numPages} de ${file.name}...`);
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement("canvas");
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext("2d")!;
            await page.render({ canvasContext: ctx, viewport } as any).promise;
            const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

            newPageItems.push({
              id: `page-${fileId}-${pageNum}-${Math.random().toString(36).substr(2, 5)}`,
              src: dataUrl,
              rotation: 0,
              sourceFileId: fileId,
              sourcePageIndex: pageNum - 1
            });
          }
        } else if (file.type.startsWith("image/")) {
          const arrayBuffer = await file.arrayBuffer();
          const fileId = `img-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
          newSourceFiles.push({ id: fileId, name: file.name, buffer: arrayBuffer });

          const dataUrl = await new Promise<string>((resolve) => {
            const r = new FileReader();
            r.onload = (e) => resolve(e.target?.result as string);
            r.readAsDataURL(file);
          });

          newPageItems.push({
            id: `page-${fileId}-0-${Math.random().toString(36).substr(2, 5)}`,
            src: dataUrl,
            rotation: 0,
            sourceFileId: fileId,
            sourcePageIndex: 0,
            isImage: true,
            imageType: file.type
          });
        }
      }

      setSourceFiles(prev => [...prev, ...newSourceFiles]);
      setPages(prev => [...prev, ...newPageItems]);
    } catch (err) {
      console.error(err);
      alert("Une erreur est survenue lors de la lecture des fichiers.");
    } finally {
      setLoading(false);
      setProgress("");
    }
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === pages.length) setSelected(new Set());
    else setSelected(new Set(pages.map(p => p.id)));
  };

  const deletePage = (id: string) => {
    setPages(prev => prev.filter(p => p.id !== id));
    setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const deleteSelected = () => {
    if (selected.size === 0) return;
    if (!confirm(`Supprimer ${selected.size} page(s) ?`)) return;
    setPages(prev => prev.filter(p => !selected.has(p.id)));
    setSelected(new Set());
  };

  const rotatePage = (id: string) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p));
  };

  const duplicatePage = (id: string) => {
    const idx = pages.findIndex(p => p.id === id);
    if (idx === -1) return;
    const orig = pages[idx];
    const dup: PageItem = {
      ...orig,
      id: `page-dup-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
    };
    const next = [...pages];
    next.splice(idx + 1, 0, dup);
    setPages(next);
  };

  // Drag and Drop
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
    const el = e.currentTarget as HTMLElement;
    el.style.opacity = "0.4";
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).style.opacity = "1";
    setDragId(null);
    setDropIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropIndex(index);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (!dragId) return;
    const fromIndex = pages.findIndex(p => p.id === dragId);
    if (fromIndex === -1 || fromIndex === targetIndex) { setDropIndex(null); return; }
    const next = [...pages];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(targetIndex > fromIndex ? targetIndex - 1 : targetIndex, 0, moved);
    setPages(next);
    setDragId(null);
    setDropIndex(null);
  };

  const handleApply = async () => {
    if (pages.length === 0) return;
    setLoading(true);
    setProgress("Compilation et génération du PDF...");

    try {
      const destDoc = await PDFDocument.create();
      const loadedDocs: Record<string, PDFDocument> = {};

      for (const file of sourceFiles) {
        if (!file.id.startsWith("img-")) {
          try {
            loadedDocs[file.id] = await PDFDocument.load(file.buffer, { ignoreEncryption: true });
          } catch (loadErr) {
            console.warn(`Skipping corrupted/encrypted source file ${file.name}:`, loadErr);
          }
        }
      }

      for (const pageItem of pages) {
        try {
          if (pageItem.isImage) {
            const file = sourceFiles.find(f => f.id === pageItem.sourceFileId);
            if (file) {
              const newPage = destDoc.addPage([595.28, 841.89]); // A4
              let embeddedImage;
              if (pageItem.imageType === "image/png") {
                embeddedImage = await destDoc.embedPng(file.buffer);
              } else {
                embeddedImage = await destDoc.embedJpg(file.buffer);
              }
              const { width, height } = embeddedImage.scale(1);
              const scale = Math.min(595.28 / width, 841.89 / height);
              const x = (595.28 - width * scale) / 2;
              const y = (841.89 - height * scale) / 2;
              
              newPage.drawImage(embeddedImage, {
                x,
                y,
                width: width * scale,
                height: height * scale
              });

              if (pageItem.rotation > 0) {
                newPage.setRotation(degrees(pageItem.rotation));
              }
            }
          } else {
            const srcDoc = loadedDocs[pageItem.sourceFileId];
            if (srcDoc) {
              const srcPageCount = srcDoc.getPageCount();
              const pageIndex = Math.min(pageItem.sourcePageIndex, srcPageCount - 1);
              if (pageIndex >= 0 && pageIndex < srcPageCount) {
                const [copiedPage] = await destDoc.copyPages(srcDoc, [pageIndex]);
                const currentRotation = copiedPage.getRotation().angle;
                copiedPage.setRotation(degrees((currentRotation + pageItem.rotation) % 360));
                destDoc.addPage(copiedPage);
              }
            }
          }
        } catch (pageErr) {
          console.warn(`Skipping page ${pageItem.id} due to error:`, pageErr);
        }
      }

      if (destDoc.getPageCount() === 0) {
        alert("Aucune page n'a pu être compilée. Vérifiez que les fichiers PDF ne sont pas corrompus ou protégés.");
        return;
      }

      const pdfBytes = await destDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `document_organise_${Date.now()}.pdf`;
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
      {/* Toolbar */}
      <div className="h-16 flex items-center gap-3 px-6 bg-white border-b border-slate-200 shrink-0 shadow-sm z-10">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer text-slate-500"><ArrowLeft className="w-5 h-5" /></button>
        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
          <Plus className="w-5 h-5" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Organiser les Pages</h2>
        <div className="flex-1" />

        {pages.length > 0 && (
          <>
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 text-slate-700 text-sm font-bold cursor-pointer transition-all shadow-sm">
              <Upload className="w-4 h-4" /><span>Insérer pages/fichiers</span>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={e => { if (e.target.files) processFiles(e.target.files); e.target.value = ""; }} />

            <button onClick={selectAll} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all border ${selected.size === pages.length ? "bg-purple-100 border-purple-200 text-purple-700" : "bg-white border-slate-300 hover:bg-slate-50 hover:border-slate-400 text-slate-700 shadow-sm"}`}>
              <Check className="w-4 h-4" /><span>{selected.size === pages.length ? "Tout désélectionner" : "Tout sélectionner"}</span>
            </button>

            {selected.size > 0 && (
              <button onClick={deleteSelected} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 text-sm font-bold cursor-pointer transition-all shadow-sm">
                <Trash2 className="w-4 h-4" /><span>Supprimer ({selected.size})</span>
              </button>
            )}
          </>
        )}
      </div>

      {/* Grid or Upload zone */}
      <div className="flex-1 overflow-auto p-8 relative">
        {loading && (
          <div className="absolute inset-0 z-50 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <Loader className="w-10 h-10 text-purple-600 animate-spin" />
            <p className="text-sm font-bold text-slate-700">{progress}</p>
          </div>
        )}

        {pages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 min-h-[500px]">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200 text-slate-400">
              <Upload className="w-10 h-10" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-800 mb-1">Commencez par charger un PDF</h3>
              <p className="text-slate-500 text-sm max-w-sm">Choisissez ou glissez-déposez un ou plusieurs fichiers PDF ou images.</p>
            </div>
            <button onClick={() => initialFileInputRef.current?.click()} className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-600/20 rounded-xl text-white font-bold cursor-pointer transition-all">
              <Plus className="w-5 h-5" /><span>Sélectionner des fichiers</span>
            </button>
            <input ref={initialFileInputRef} type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={e => { if (e.target.files) processFiles(e.target.files); e.target.value = ""; }} />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
            {pages.map((page, index) => (
              <React.Fragment key={page.id}>
                <div
                  draggable
                  onDragStart={e => handleDragStart(e, page.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={e => handleDragOver(e, index)}
                  onDrop={e => handleDrop(e, index)}
                  onClick={() => toggleSelect(page.id)}
                  className={`relative group rounded-2xl border-2 overflow-hidden transition-all duration-200 cursor-pointer bg-white ${
                    selected.has(page.id) 
                      ? "border-purple-500 shadow-xl ring-4 ring-purple-500/10 scale-[1.02]" 
                      : dragId === page.id 
                        ? "border-slate-300 opacity-50 scale-95" 
                        : "border-slate-200 hover:border-purple-300 hover:shadow-xl hover:-translate-y-1"
                  }`}
                >
                  {/* Left Drop Indicator (No grid shifting) */}
                  {dropIndex === index && dragId && dragId !== page.id && (
                    <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-purple-600 z-30 rounded-l-[14px] shadow-lg shadow-purple-500/50 animate-pulse" />
                  )}

                  {/* Selection check */}
                  {selected.has(page.id) && (
                    <div className="absolute top-3 left-3 z-20 w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center shadow-lg ring-4 ring-white">
                      <Check className="w-4 h-4 text-white font-bold" />
                    </div>
                  )}

                  {/* Drag handle */}
                  <div className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                    <GripVertical className="w-4 h-4 text-slate-400" />
                  </div>

                  {/* Page image */}
                  <div className="aspect-[1/1.4] overflow-hidden flex items-center justify-center p-4 bg-slate-50/50">
                    <img
                      src={page.src}
                      alt={`Page ${index + 1}`}
                      className="w-full h-full object-contain drop-shadow-md"
                      style={{ transform: `rotate(${page.rotation}deg)` }}
                      draggable={false}
                    />
                  </div>

                  {/* Page number badge */}
                  <div className="absolute bottom-0 inset-x-0 bg-white/90 backdrop-blur-md border-t border-slate-100 px-4 py-2.5 flex items-center justify-center">
                    <span className="text-xs font-bold text-slate-700">Page {index + 1}</span>
                  </div>

                  {/* Hover action buttons */}
                  <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2.5 z-10">
                    <button onClick={e => { e.stopPropagation(); rotatePage(page.id); }} className="w-10 h-10 rounded-full bg-white text-slate-700 hover:text-purple-600 hover:scale-110 flex items-center justify-center shadow-xl cursor-pointer transition-all" title="Pivoter 90°">
                      <RotateCw className="w-4.5 h-4.5" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); duplicatePage(page.id); }} className="w-10 h-10 rounded-full bg-white text-slate-700 hover:text-purple-600 hover:scale-110 flex items-center justify-center shadow-xl cursor-pointer transition-all" title="Dupliquer">
                      <Copy className="w-4.5 h-4.5" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); deletePage(page.id); }} className="w-10 h-10 rounded-full bg-white text-slate-700 hover:text-red-600 hover:scale-110 flex items-center justify-center shadow-xl cursor-pointer transition-all" title="Supprimer">
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      {pages.length > 0 && (
        <div className="h-20 flex items-center justify-between px-8 bg-white border-t border-slate-200 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] z-20">
          <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
            <span className="text-sm font-bold text-slate-700">{pages.length} page{pages.length > 1 ? "s" : ""} au total</span>
          </div>
          <button onClick={handleApply} className="flex items-center gap-2 px-8 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl text-white font-bold cursor-pointer transition-all shadow-lg">
            <Check className="w-5 h-5" />
            <span className="text-base">Générer et télécharger</span>
          </button>
        </div>
      )}
    </div>
  );
}
