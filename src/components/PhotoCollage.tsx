/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { DevicePhoto } from "../types";
import { Camera, Image as ImageIcon } from "lucide-react";

interface PhotoCollageProps {
  photos: DevicePhoto[];
  theme?: "light" | "dark";
  interactive?: boolean;
}

export default function PhotoCollage({ photos, theme = "light", interactive = false }: PhotoCollageProps) {
  if (!photos || photos.length === 0) return null;

  const isDark = theme === "dark";
  const count = photos.length;

  // Professional grid configuration helper based on the exact quantity of photos
  // This budget is perfectly optimized for a clean single-page printable report height
  const getGridClasses = () => {
    switch (count) {
      case 1:
        return "grid grid-cols-1 gap-4";
      case 2:
        return "grid grid-cols-1 sm:grid-cols-2 gap-4";
      case 3:
        // Asymmetric side-by-side or triple vertical strip
        return "grid grid-cols-1 sm:grid-cols-3 gap-3";
      case 4:
        // Perfect 2x2 grid
        return "grid grid-cols-2 gap-3";
      case 5:
        // Bento layout with 6 columns base: First row 2 items (span 3), Second row 3 items (span 2)
        return "grid grid-cols-6 gap-3";
      case 6:
        // Highly symmetric 3x2 grid
        return "grid grid-cols-2 sm:grid-cols-3 gap-3";
      default:
        // Default grids for overflow
        return "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3";
    }
  };

  // Get specific block classes (especially for asymmetric spanning in 5-photo layouts)
  const getItemClasses = (index: number) => {
    if (count === 5) {
      if (index < 2) {
        return "col-span-3 h-[180px] sm:h-[220px]";
      }
      return "col-span-2 h-[140px] sm:h-[160px]";
    }

    switch (count) {
      case 1:
        return "h-[300px] sm:h-[380px]";
      case 2:
        return "h-[220px] sm:h-[280px]";
      case 3:
        return "h-[180px] sm:h-[220px]";
      case 4:
        return "h-[150px] sm:h-[200px]";
      case 6:
        return "h-[140px] sm:h-[180px]";
      default:
        return "h-[140px]";
    }
  };

  return (
    <div className="w-full space-y-4 no-break-inside mt-6">
      {/* Decorative Title bar for the Photo board */}
      <div className="flex items-center justify-between border-b pb-2">
        <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
          isDark ? "text-teal-400 border-slate-800" : "text-slate-700 border-slate-200"
        }`}>
          <Camera className="w-4 h-4 text-teal-500 shrink-0" />
          <span>Galerie de Preuves d'Intervention ({count} {count > 1 ? "Photos" : "Photo"})</span>
        </h4>
        <span className="text-[10px] font-mono text-slate-400 italic">
          Collage automatique à mise en page intelligente (Rapport d'État)
        </span>
      </div>

      {/* Grid container with dynamic styles */}
      <div className={`${getGridClasses()} select-none`}>
        {photos.map((photo, idx) => (
          <div
            key={photo.id}
            id={`collage-photo-item-${photo.id}`}
            className={`${getItemClasses(idx)} relative group rounded-lg overflow-hidden border shadow-sm flex flex-col justify-between transition-all duration-300 ${
              isDark 
                ? "bg-slate-900 border-slate-800/80 hover:border-teal-500/40" 
                : "bg-slate-50 border-slate-200 hover:border-teal-400"
            }`}
          >
            {/* The actual photo */}
            <div className="w-full h-full relative overflow-hidden flex-1">
              <img
                src={photo.url}
                alt={`Preuve technique ${idx + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              
              {/* Photo number badge */}
              <div className="absolute top-2.5 left-2.5 bg-slate-900/80 text-white backdrop-blur-md text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 font-bold z-10 border border-slate-750">
                <ImageIcon className="w-3 h-3 text-teal-400" />
                <span>PHOTO {idx + 1}</span>
              </div>
            </div>

            {/* Subtitle / Caption for Task Accomplished */}
            <div className={`p-2 w-full shrink-0 border-t ${
              isDark 
                ? "bg-slate-950/90 border-slate-800/60" 
                : "bg-white border-slate-100"
            } print:bg-white print:border-slate-200`}>
              <div className={`text-[11px] leading-snug font-medium italic truncate-2-lines line-clamp-2 ${
                isDark ? "text-slate-350" : "text-slate-600"
              } print:text-slate-800`}>
                <span className="font-bold not-italic font-mono text-[9px] text-teal-600 uppercase border border-teal-200/50 bg-teal-50/55 px-1 py-0.2 rounded mr-1 select-none print:bg-transparent inline-block">
                  Acte :
                </span>
                {photo.taskDescription || "Aucun commentaire technique consigné."}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
