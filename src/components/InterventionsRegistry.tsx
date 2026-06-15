/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Intervention } from "../types";
import { DEPARTMENTS, DEVICE_TYPES } from "../data/constants";
import { 
  Search, 
  Filter, 
  Printer, 
  Trash2, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  ChevronRight,
  RefreshCw,
  SlidersHorizontal,
  FileMinus,
  CalendarDays,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileText,
  CheckSquare,
  Square
} from "lucide-react";
import { generateConsolidatedReportPDF } from "../utils/pdfGenerator";

interface InterventionsRegistryProps {
  interventions: Intervention[];
  onSelect: (intervention: Intervention) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  theme?: "light" | "dark";
}

export default function InterventionsRegistry({ 
  interventions, 
  onSelect, 
  onDelete, 
  onToggleStatus,
  theme = "light"
}: InterventionsRegistryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("Tous");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDevice, setSelectedDevice] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Intervention | null>(null);

  // Table Sorting State (Defaults to date descending - newest first)
  const [sortField, setSortField] = useState<"date" | "clientName">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const isDark = theme === "dark";

  // Filter actions
  const filteredInterventions = interventions.filter((intervention) => {
    // Search keyword
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      intervention.clientName.toLowerCase().includes(term) ||
      intervention.clientTitle.toLowerCase().includes(term) ||
      intervention.refNumber.toLowerCase().includes(term) ||
      intervention.rawNotes.toLowerCase().includes(term) ||
      intervention.professionalSummary.toLowerCase().includes(term) ||
      (intervention.deviceBrand || "").toLowerCase().includes(term);

    // Department match
    const matchesDept = selectedDept === "Tous" || intervention.clientDepartment === selectedDept;

    // Status match
    const matchesStatus = selectedStatus === "all" || intervention.status === selectedStatus;

    // Device type match
    const matchesDevice = selectedDevice === "all" || intervention.deviceType === selectedDevice;

    // Date range matches
    const matchesStartDate = !startDate || intervention.date >= startDate;
    const matchesEndDate = !endDate || intervention.date <= endDate;

    return matchesSearch && matchesDept && matchesStatus && matchesDevice && matchesStartDate && matchesEndDate;
  });

  // Sort actions applied on top of filters
  const sortedInterventions = [...filteredInterventions].sort((a, b) => {
    let cmp = 0;
    if (sortField === "date") {
      cmp = a.date.localeCompare(b.date);
    } else if (sortField === "clientName") {
      cmp = a.clientName.localeCompare(b.clientName, "fr", { sensitivity: "base" });
    }
    return sortOrder === "asc" ? cmp : -cmp;
  });

  const handleSort = (field: "date" | "clientName") => {
    if (sortField === field) {
      setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder(field === "date" ? "desc" : "asc");
    }
  };

  const renderSortIcon = (field: "date" | "clientName") => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 opacity-40 hover:opacity-100 transition-opacity ml-1.5 shrink-0" />;
    }
    return sortOrder === "asc" 
      ? <ArrowUp className="w-3.5 h-3.5 text-teal-500 ml-1.5 shrink-0" />
      : <ArrowDown className="w-3.5 h-3.5 text-teal-500 ml-1.5 shrink-0" />;
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedDept("Tous");
    setSelectedStatus("all");
    setSelectedDevice("all");
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="space-y-4">
      {/* Professional Local Sovereign Backup Description */}
      <div className={`border rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden transition-colors ${
        isDark ? "bg-slate-900 border-slate-800" : "bg-slate-900 text-white border-slate-800"
      }`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest font-mono">
              ★ Stockage Privé Souverain (0% Cloud)
            </div>
            <h4 className="text-sm md:text-base font-extrabold text-slate-100 uppercase tracking-tight">
              Registre d'État Auto-Géré & Archives sur Disque Dur
            </h4>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Pour assurer une sécurité maximale sans dépendre d'abonnements tiers, vos rapports techniques de service fait sont stockés <strong>exclusivement sur votre machine locale</strong>. À chaque validation, l'archive originale au format universel <span className="text-teal-400 font-mono">.json</span> vous est proposée en téléchargement pour constituer votre propre dossier d'archives d'État.
            </p>
          </div>
          <div className={`flex flex-col items-center border rounded-xl px-4 py-3 text-center shrink-0 min-w-36 ${
            isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-800/80 border-slate-700/50"
          }`}>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Total Archives</span>
            <span className="text-2xl font-black text-white font-mono mt-0.5">{interventions.length}</span>
            <span className="text-[9px] text-teal-400 mt-1 uppercase font-semibold">Illimitées et gratuites</span>
          </div>
        </div>
      </div>

      {/* Dynamic Consolidated Report Actions Banner */}
      {selectedIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-md ${
            isDark 
              ? "bg-slate-900/60 border-teal-800 text-slate-100 shadow-teal-950/20" 
              : "bg-teal-50/50 border-teal-200 text-teal-950 shadow-teal-500/5"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="bg-teal-600 text-white p-2.5 rounded-xl shrink-0">
              <FileText className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h5 className="font-extrabold text-sm tracking-tight">
                Consolidation de registre : {selectedIds.length} fiche(s) sélectionnée(s)
              </h5>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Générez un rapport périodique d'activité consolidé officiel au format PDF pour l'analyse administrative.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-generate-consolidated-pdf"
              type="button"
              onClick={async () => {
                const selectedInterventions = interventions.filter(i => selectedIds.includes(i.id));
                await generateConsolidatedReportPDF(selectedInterventions);
              }}
              className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm shadow-teal-900/20"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Générer le Rapport Global (.pdf)</span>
            </button>
            
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className={`px-3 py-2 border rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                isDark 
                  ? "border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-850 hover:text-white" 
                  : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              Effacer la sélection
            </button>
          </div>
        </motion.div>
      )}

      {/* Registry Top Toolbar Search / Filter */}
      <div className={`border rounded-xl p-4 shadow-sm space-y-3 transition-colors ${
        isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200/80"
      }`}>
        <div className="flex flex-col md:flex-row gap-3">
          {/* Main search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              id="input-search-registry"
              type="text"
              placeholder="Rechercher par bénéficiaire, équipement ou numéro de référence (ex: CNIPLC-2026-0001)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full text-sm pl-9 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/80 transition-all font-sans ${
                isDark 
                  ? "bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600" 
                  : "bg-slate-50 border-slate-200 text-slate-800"
              }`}
            />
          </div>

          <div className="flex gap-2">
            <button
              id="btn-toggle-filters"
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-4 py-2 border rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                showAdvancedFilters 
                  ? "bg-slate-900 text-white border-slate-900" 
                  : isDark
                    ? "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-750"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {showAdvancedFilters ? "Masquer Filtres" : "Filtres Avancés"}
            </button>

            {(selectedDept !== "Tous" || selectedStatus !== "all" || selectedDevice !== "all" || startDate || endDate || searchTerm) && (
              <button
                id="btn-reset-filters"
                type="button"
                onClick={handleResetFilters}
                className={`px-3 py-2 border rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                  isDark
                    ? "border-slate-800 hover:bg-slate-800 text-slate-350"
                    : "border-slate-200 hover:bg-slate-50 text-slate-600"
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Réinitialiser
              </button>
            )}
          </div>
        </div>

        {/* Detailed collapsible advanced filters */}
        {showAdvancedFilters && (
          <div className={`border-t pt-3 mt-1 grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in ${
            isDark ? "border-slate-850" : "border-slate-100"
          }`}>
            {/* Department selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Direction / Service Client
              </label>
              <select
                id="filter-dept"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className={`w-full text-xs px-2.5 py-1.5 rounded-md focus:outline-none ${
                  isDark ? "bg-slate-950 border border-slate-800 text-slate-200" : "bg-slate-50 border border-slate-200 text-slate-800"
                }`}
              >
                <option value="Tous">Tous les départements</option>
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Status Selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Statut de Validation
              </label>
              <select
                id="filter-status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className={`w-full text-xs px-2.5 py-1.5 rounded-md focus:outline-none ${
                  isDark ? "bg-slate-950 border border-slate-800 text-slate-200" : "bg-slate-50 border border-slate-200 text-slate-800"
                }`}
              >
                <option value="all">Tous les statuts</option>
                <option value="termine">Terminé (Fiche prête)</option>
                <option value="en_cours">En Cours d'exécution</option>
              </select>
            </div>

            {/* Device type Selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Équipement Concerne
              </label>
              <select
                id="filter-device"
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className={`w-full text-xs px-2.5 py-1.5 rounded-md focus:outline-none ${
                  isDark ? "bg-slate-950 border border-slate-800 text-slate-200" : "bg-slate-50 border border-slate-200 text-slate-800"
                }`}
              >
                <option value="all">Tous les types de matériels</option>
                {DEVICE_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            {/* Date range inputs */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Période d'intervention
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id="filter-start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`w-full text-[10px] px-1.5 py-1 rounded focus:outline-none ${
                    isDark ? "bg-slate-950 border border-slate-800 text-slate-200" : "bg-slate-50 border border-slate-200 text-slate-850"
                  }`}
                />
                <span className="text-slate-400 text-xs">à</span>
                <input
                  id="filter-end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`w-full text-[10px] px-1.5 py-1 rounded focus:outline-none ${
                    isDark ? "bg-slate-950 border border-slate-800 text-slate-200" : "bg-slate-50 border border-slate-200 text-slate-850"
                  }`}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Registry Table & Render results */}
      <div className={`border rounded-xl overflow-hidden shadow-sm transition-colors ${
        isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200/80"
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={`border-b text-[9px] font-semibold uppercase tracking-widest ${
                isDark ? "bg-slate-950 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-100 text-slate-400"
              }`}>
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={sortedInterventions.length > 0 && sortedInterventions.every(i => selectedIds.includes(i.id))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        const allPageIds = sortedInterventions.map(i => i.id);
                        setSelectedIds(prev => Array.from(new Set([...prev, ...allPageIds])));
                      } else {
                        const allPageIds = sortedInterventions.map(i => i.id);
                        setSelectedIds(prev => prev.filter(id => !allPageIds.includes(id)));
                      }
                    }}
                    className="rounded text-teal-600 focus:ring-teal-500 w-3.5 h-3.5 cursor-pointer accent-teal-600"
                  />
                </th>
                <th className="p-3 w-32">Référence</th>
                <th 
                  onClick={() => handleSort("date")}
                  className="p-3 w-32 cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                  title="Trier par date d'intervention"
                >
                  <div className="flex items-center gap-1">
                    <span>Date</span>
                    {renderSortIcon("date")}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort("clientName")}
                  className="p-3 w-52 cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                  title="Trier par nom de bénéficiaire (alphabet)"
                >
                  <div className="flex items-center gap-1">
                    <span>Demandeur (Bénéficiaire)</span>
                    {renderSortIcon("clientName")}
                  </div>
                </th>
                <th className="p-3 w-40 font-semibold">Direction/Service</th>
                <th className="p-3 w-36 font-semibold">Équipement</th>
                <th className="p-3 font-semibold">Rapport synthétique</th>
                <th className="p-3 w-24 text-center">Tâches</th>
                <th className="p-3 w-28 text-center">Réf (Statut)</th>
                <th className="p-3 w-32 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedInterventions.map((intervention) => {
                const isTerminated = intervention.status === "termine";
                return (
                  <tr 
                    key={intervention.id} 
                    className={`border-b transition-all font-sans ${
                      isDark ? "border-slate-850 hover:bg-slate-850/30" : "border-slate-100 hover:bg-slate-50/50"
                    }`}
                  >
                    {/* Checkbox selector */}
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(intervention.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(prev => [...prev, intervention.id]);
                          } else {
                            setSelectedIds(prev => prev.filter(id => id !== intervention.id));
                          }
                        }}
                        className="rounded text-teal-600 focus:ring-teal-500 w-3.5 h-3.5 cursor-pointer accent-teal-600"
                      />
                    </td>

                    {/* Ref Number */}
                    <td className={`p-3 font-mono font-extrabold ${isDark ? "text-slate-200" : "text-[#111827]"}`}>
                      {intervention.refNumber}
                    </td>

                    {/* Date */}
                    <td className="p-3 text-slate-500 whitespace-nowrap flex items-center gap-1 mt-1 font-mono">
                      <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(intervention.date).toLocaleDateString('fr-FR')}
                    </td>

                    {/* Client details */}
                    <td className="p-3">
                      <div className={`font-semibold text-sm truncate max-w-[180px] ${isDark ? "text-slate-200" : "text-slate-800"}`}>{intervention.clientName}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[180px]">{intervention.clientTitle}</div>
                    </td>

                    {/* Client department */}
                    <td className="p-3 text-slate-500">
                      <span className={`px-2 py-0.5 rounded text-[10px] max-w-[130px] truncate block ${
                        isDark ? "bg-slate-950 border border-slate-800 text-slate-400" : "bg-slate-100 border border-slate-200 text-slate-600"
                      }`}>
                        {intervention.clientDepartment}
                      </span>
                    </td>

                    {/* Equipment Details */}
                    <td className="p-3">
                      <div className={`font-medium truncate max-w-[125px] ${isDark ? "text-slate-300" : "text-slate-700"}`}>{intervention.deviceType}</div>
                      <div className="text-[10px] text-slate-400 font-mono truncate max-w-[125px]">
                        {intervention.deviceBrand || "Standard"}
                      </div>
                    </td>

                    {/* Report professional preview */}
                    <td className="p-3 index-table-desc">
                      <p className={`line-clamp-2 leading-relaxed text-justify text-[11px] max-w-[300px] ${
                        isDark ? "text-slate-400" : "text-slate-600"
                      }`} title={intervention.professionalSummary}>
                        {intervention.professionalSummary}
                      </p>
                    </td>

                    {/* Tasks numerical counts */}
                    <td className="p-3 text-center">
                      <span className={`font-bold border text-[10px] px-2 py-0.5 rounded-full font-mono ${
                        isDark ? "text-slate-300 bg-slate-950 border-slate-805" : "text-slate-700 bg-slate-100 border-slate-200"
                      }`}>
                        {intervention.tasks.length}
                      </span>
                    </td>

                    {/* Status Badge clickable triggers */}
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => onToggleStatus(intervention.id)}
                        id={`btn-toggle-status-${intervention.id}`}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide cursor-pointer transition-all ${
                          isTerminated
                            ? "bg-emerald-500/10 text-emerald-405 border border-emerald-500/20 hover:bg-emerald-505/20"
                            : "bg-amber-500/10 text-amber-405 border border-amber-500/20 hover:bg-amber-505/20"
                        }`}
                        title="Cliquez pour permuter le statut"
                      >
                        {isTerminated ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                            Terminé
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-amber-400 animate-spin" />
                            En cours
                          </>
                        )}
                      </button>
                    </td>

                    {/* Action buttons */}
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelect(intervention)}
                          id={`btn-view-${intervention.id}`}
                          className={`border p-1.5 rounded-lg text-xs font-semibold flex items-center justify-center cursor-pointer transition-colors ${
                            isDark 
                              ? "bg-teal-950/40 hover:bg-teal-900 border-teal-900 text-teal-300"
                              : "bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800"
                          }`}
                          title="Générer / Imprimer la Fiche à Signer"
                        >
                          <Printer className="w-3.5 h-3.5 mr-0.5" />
                          Imprimer
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(intervention)}
                          id={`btn-delete-${intervention.id}`}
                          className={`border p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isDark
                              ? "bg-slate-905 border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-900"
                              : "bg-white border-slate-200 hover:bg-red-50 hover:text-red-650 hover:border-red-250 text-slate-500"
                          }`}
                          title="Supprimer la fiche d'intervention (Modal de Validation Securisée)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {sortedInterventions.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-10 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FileMinus className="w-8 h-8 text-slate-300" />
                      <p className="text-sm font-semibold text-slate-400 font-mono">
                        Aucun résultat correspondant aux critères de recherche.
                      </p>
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="text-xs text-teal-400 hover:underline cursor-pointer"
                      >
                        Réinitialiser tous les filtres
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Custom Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className={`max-w-md w-full rounded-2xl p-6 shadow-2xl border text-left flex flex-col justify-between ${
                isDark 
                  ? "bg-slate-900 border-slate-800 text-slate-100" 
                  : "bg-white border-slate-200 text-slate-900"
              }`}
            >
              <div>
                <div className="flex items-start gap-3.5">
                  <div className="bg-red-500/10 text-red-500 p-3 rounded-xl border border-red-500/20 shrink-0">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div className="space-y-2">
                    <h4 className={`text-base font-extrabold uppercase tracking-tight ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                      Archivage définitif / Suppression
                    </h4>
                    <p className={`text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      Êtes-vous certain de vouloir purger définitivement cette fiche d'intervention ? Cette opération est irréversible.
                    </p>
                    
                    {/* Item Description Badge */}
                    <div className={`p-3 rounded-lg border text-xs font-mono space-y-1.5 ${
                      isDark ? "bg-slate-950/80 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-100 text-slate-700"
                    }`}>
                      <div>
                        <span className="text-slate-500">Réf :</span> <strong className={isDark ? "text-teal-400" : "text-black"}>{deleteTarget.refNumber}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Bénéficiaire :</span> <strong className={isDark ? "text-slate-200" : "text-slate-800"}>{deleteTarget.clientName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Équipement :</span> <strong className={isDark ? "text-slate-200" : "text-slate-850"}>{deleteTarget.deviceType}</strong>
                      </div>
                    </div>

                    <p className="text-[10px] text-red-500 font-bold leading-normal flex items-start gap-1">
                      <span>⚠</span> Attention : la fiche sera retirée à jamais de votre disque dur souverain et des registres d'État de prestation de service.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className={`flex items-center justify-end gap-2.5 mt-6 pt-4 border-t ${
                isDark ? "border-slate-800" : "border-slate-100"
              }`}>
                <button
                  id="btn-confirm-delete-cancel"
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className={`px-4 py-2 border rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    isDark 
                      ? "border-slate-800 hover:bg-slate-800 text-slate-300" 
                      : "border-slate-200 hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  Annuler
                </button>
                <button
                  id="btn-confirm-delete-execute"
                  type="button"
                  onClick={() => {
                    onDelete(deleteTarget.id);
                    setDeleteTarget(null);
                  }}
                  className="px-4 py-2 bg-red-650 hover:bg-red-600 hover:scale-[1.02] active:scale-[0.98] text-white rounded-lg text-xs font-bold cursor-pointer transition-all shadow-md shadow-red-950/30"
                >
                  Supprimer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
