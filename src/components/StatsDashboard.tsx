/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Intervention } from "../types";
import { 
  BarChart, 
  Settings, 
  Cpu, 
  Building, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  ShieldAlert, 
  PieChart as PieIcon,
  CalendarCheck
} from "lucide-react";
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";

interface StatsDashboardProps {
  interventions: Intervention[];
  theme?: "light" | "dark";
}

export default function StatsDashboard({ interventions, theme = "light" }: StatsDashboardProps) {
  // Calendar states and dynamic computations
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonthIndex, setCurrentMonthIndex] = useState(() => new Date().getMonth()); // 0-indexed (5 for June)

  const MONTHS_FR = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  const DAYS_WEEK_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  const handlePrevMonth = () => {
    if (currentMonthIndex === 0) {
      setCurrentMonthIndex(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonthIndex(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex === 11) {
      setCurrentMonthIndex(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonthIndex(prev => prev + 1);
    }
  };

  const handleResetToToday = () => {
    setCurrentYear(new Date().getFullYear());
    setCurrentMonthIndex(new Date().getMonth());
  };

  const firstDayOfMonth = new Date(currentYear, currentMonthIndex, 1);
  let startOfWeekdayIndex = firstDayOfMonth.getDay() - 1;
  if (startOfWeekdayIndex === -1) startOfWeekdayIndex = 6; // Sunday is 6

  const totalDaysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();

  const getInterventionsForDay = (day: number) => {
    const formattedMonth = String(currentMonthIndex + 1).padStart(2, "0");
    const formattedDay = String(day).padStart(2, "0");
    const dateStr = `${currentYear}-${formattedMonth}-${formattedDay}`;
    return interventions.filter(i => i.date === dateStr);
  };

  const calendarCells: { day: number | null; interventions: Intervention[] }[] = [];
  
  // Fill preceding blanks
  for (let i = 0; i < startOfWeekdayIndex; i++) {
    calendarCells.push({ day: null, interventions: [] });
  }

  // Fill actual month days
  for (let d = 1; d <= totalDaysInMonth; d++) {
    calendarCells.push({
      day: d,
      interventions: getInterventionsForDay(d),
    });
  }

  const totalMonthInterventions = calendarCells.reduce((acc, cell) => acc + cell.interventions.length, 0);
  const busyDaysCount = calendarCells.filter(cell => cell.day !== null && cell.interventions.length > 0).length;
  let maxDayWorkload = 0;
  let maxWorkloadDayNum = 0;
  calendarCells.forEach(cell => {
    if (cell.day !== null && cell.interventions.length > maxDayWorkload) {
      maxDayWorkload = cell.interventions.length;
      maxWorkloadDayNum = cell.day;
    }
  });

  // Calculations
  const total = interventions.length;
  const completed = interventions.filter(i => i.status === "termine").length;
  const inProgress = total - completed;
  
  const totalDuration = interventions.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
  const avgDuration = total > 0 ? Math.round(totalDuration / total) : 0;

  const isDark = theme === "dark";

  // Department counts
  const deptMap: { [key: string]: number } = {};
  // Category counts
  const catMap: { [key: string]: number } = {
    "Matériel": 0,
    "Logiciel": 0,
    "Réseau": 0,
    "Sécurité": 0,
    "Optimisation": 0,
    "Autre": 0,
  };

  interventions.forEach(i => {
    // Departments
    const d = i.clientDepartment || "Non Spécifié";
    deptMap[d] = (deptMap[d] || 0) + 1;

    // Categories in tasks
    i.tasks.forEach(t => {
      const cat = t.category || "Autre";
      if (catMap[cat] !== undefined) {
        catMap[cat] += 1;
      } else {
        catMap[cat] = 1;
      }
    });
  });

  const sortedDepts = Object.entries(deptMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const chartData = sortedDepts.map(([dept]) => {
    const deptInterventions = interventions.filter(i => i.clientDepartment === dept);
    const countMat = deptInterventions.reduce((sum, i) => sum + i.tasks.filter(t => t.category === "Matériel").length, 0);
    const countLog = deptInterventions.reduce((sum, i) => sum + i.tasks.filter(t => t.category === "Logiciel").length, 0);
    const countRes = deptInterventions.reduce((sum, i) => sum + i.tasks.filter(t => t.category === "Réseau").length, 0);
    const countSec = deptInterventions.reduce((sum, i) => sum + i.tasks.filter(t => t.category === "Sécurité").length, 0);
    const countOpt = deptInterventions.reduce((sum, i) => sum + i.tasks.filter(t => t.category === "Optimisation").length, 0);
    const countAut = deptInterventions.reduce((sum, i) => sum + i.tasks.filter(t => t.category === "Autre").length, 0);

    return {
      name: dept,
      "Matériel": countMat,
      "Logiciel": countLog,
      "Réseau": countRes,
      "Sécurité": countSec,
      "Optimisation": countOpt,
      "Autre": countAut,
    };
  });

  const maxDeptValue = sortedDepts.length > 0 ? Math.max(...sortedDepts.map(d => d[1])) : 1;
  const maxCatValue = Math.max(...Object.values(catMap), 1);

  // Client list of specific services rendered
  const clientSummary: { [client: string]: { count: number; dept: string; devices: string[] } } = {};
  interventions.forEach(i => {
    if (!clientSummary[i.clientName]) {
      clientSummary[i.clientName] = { count: 0, dept: i.clientDepartment, devices: [] };
    }
    clientSummary[i.clientName].count += 1;
    if (i.deviceType && !clientSummary[i.clientName].devices.includes(i.deviceType)) {
      clientSummary[i.clientName].devices.push(i.deviceType);
    }
  });

  const clientsSorted = Object.entries(clientSummary)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className={`border rounded-xl p-5 text-white shadow-sm flex items-center justify-between transition-colors ${
          isDark ? "bg-slate-900 border-slate-800" : "bg-slate-900 border-slate-850"
        }`}>
          <div className="space-y-1">
            <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">Total Interventions</p>
            <h3 className="text-3xl font-extrabold tracking-tight text-white">{total}</h3>
            <p className="text-[10px] text-teal-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Archivées au registre
            </p>
          </div>
          <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
            <Cpu className="w-6 h-6 text-teal-400" />
          </div>
        </div>

        <div className={`border rounded-xl p-5 shadow-sm flex items-center justify-between transition-colors ${
          isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200/80 text-slate-900"
        }`}>
          <div className="space-y-1">
            <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Prestations Clôturées</p>
            <h3 className={`text-3xl font-extrabold tracking-tight ${isDark ? "text-emerald-400" : "text-emerald-700"}`}>{completed}</h3>
            <p className="text-[10px] text-slate-400">Signées / Prêtes pour signature</p>
          </div>
          <div className={`${isDark ? "bg-emerald-950/40 border-emerald-900/40" : "bg-emerald-50 border-emerald-100"} p-3 rounded-xl border`}>
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
        </div>

        <div className={`border rounded-xl p-5 shadow-sm flex items-center justify-between transition-colors ${
          isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200/80 text-slate-900"
        }`}>
          <div className="space-y-1">
            <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Tâches en Cours d'intervention</p>
            <h3 className={`text-3xl font-extrabold tracking-tight ${isDark ? "text-amber-405" : "text-amber-600"}`}>{inProgress}</h3>
            <p className="text-[10px] text-slate-400">Diagnostic ou pièces attendues</p>
          </div>
          <div className={`${isDark ? "bg-amber-950/40 border-amber-900/40" : "bg-amber-50 border-amber-100"} p-3 rounded-xl border`}>
            <ShieldAlert className="w-6 h-6 text-amber-500" />
          </div>
        </div>

        <div className={`border rounded-xl p-5 shadow-sm flex items-center justify-between transition-colors ${
          isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200/80 text-slate-900"
        }`}>
          <div className="space-y-1">
            <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Temps d'Intervention Moyen</p>
            <h3 className="text-3xl font-extrabold tracking-tight">{avgDuration} min</h3>
            <p className="text-[10px] text-slate-400">Durée par fiche de service fait</p>
          </div>
          <div className={`${isDark ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-100"} p-3 rounded-xl border`}>
            <Clock className="w-6 h-6 text-slate-550" />
          </div>
        </div>
      </div>

      {/* Calendrier Mensuel de Distribution de la Charge de Travail */}
      <div id="dashboard-calendar" className={`border rounded-2xl p-5 shadow-sm transition-colors duration-200 ${
        isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200/80 text-slate-900"
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h4 className="font-extrabold text-sm flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-teal-500" />
              Répartition Journalière des Interventions
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Historique de charge de maintenance et de support technique par jour calendaire.
            </p>
          </div>
          
          <div className="flex items-center gap-1.5 self-start sm:self-center">
            <button
              type="button"
              onClick={handlePrevMonth}
              className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                isDark 
                  ? "bg-slate-950 border-slate-800 hover:bg-slate-850 text-slate-300" 
                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
              }`}
            >
              Précédent
            </button>
            <span className={`px-4 py-1 rounded-lg font-extrabold text-xs font-sans tracking-wide text-center min-w-32 select-none ${
              isDark ? "bg-slate-950 text-teal-400" : "bg-teal-50 text-teal-800"
            }`}>
              {MONTHS_FR[currentMonthIndex]} {currentYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                isDark 
                  ? "bg-slate-950 border-slate-800 hover:bg-slate-850 text-slate-300" 
                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
              }`}
            >
              Suivant
            </button>
            <button
              type="button"
              onClick={handleResetToToday}
              className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                isDark 
                  ? "bg-indigo-950/40 border-indigo-900/40 text-indigo-400 hover:bg-slate-850" 
                  : "bg-indigo-50 border-indigo-100 text-indigo-700 hover:bg-indigo-100"
              }`}
            >
              Aujourd'hui
            </button>
          </div>
        </div>

        {/* Calendar Grid Container */}
        <div className="space-y-4">
          <div className="grid grid-cols-7 gap-1 md:gap-2 text-center text-xs font-bold font-mono tracking-wider opacity-60">
            {DAYS_WEEK_FR.map(d => (
              <div key={d} className="py-1 uppercase text-[10px]">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {calendarCells.map((cell, idx) => {
              const isToday = cell.day !== null && 
                new Date().getDate() === cell.day && 
                new Date().getMonth() === currentMonthIndex && 
                new Date().getFullYear() === currentYear;
                
              const hasActivity = cell.interventions.length > 0;
              const cellWorkload = cell.interventions.length;
              
              // Load category styling
              let loadBg = isDark ? "bg-slate-950/40" : "bg-slate-50/25";
              let loadBorder = isDark ? "border-slate-805" : "border-slate-100/60";
              let loadText = isDark ? "text-slate-400" : "text-slate-500";
              
              if (cell.day !== null) {
                if (isToday) {
                  loadBg = isDark ? "bg-teal-950/15" : "bg-teal-50/30";
                  loadBorder = "border-teal-500 ring-1 ring-teal-500/10";
                  loadText = isDark ? "text-teal-400 font-bold" : "text-teal-800 font-bold";
                } else if (cellWorkload === 1) {
                  loadBg = isDark ? "bg-emerald-950/10" : "bg-emerald-50/20";
                  loadBorder = isDark ? "border-emerald-900/40" : "border-emerald-100/40";
                } else if (cellWorkload >= 2 && cellWorkload <= 3) {
                  loadBg = isDark ? "bg-amber-955/10" : "bg-amber-50/20";
                  loadBorder = isDark ? "border-amber-900/40" : "border-amber-150";
                } else if (cellWorkload >= 4) {
                  loadBg = isDark ? "bg-rose-950/10" : "bg-rose-50/30";
                  loadBorder = isDark ? "border-rose-900/45" : "border-rose-150";
                }
              }

              return (
                <div 
                  key={idx} 
                  className={`border rounded-xl p-1.5 min-h-[75px] md:min-h-[85px] flex flex-col justify-between transition-all ${
                    cell.day === null 
                      ? "opacity-15 border-transparent bg-transparent cursor-default" 
                      : `hover:scale-[1.01] ${loadBg} ${loadBorder} ${loadText}`
                  }`}
                >
                  {cell.day !== null ? (
                    <>
                      {/* Day number with badge */}
                      <div className="flex justify-between items-center">
                        <span className={`text-[10px] md:text-xs font-mono font-bold ${isToday ? "text-teal-500 underline" : ""}`}>
                          {cell.day}
                        </span>
                        {hasActivity && (
                          <span className={`text-[8px] md:text-[9px] font-extrabold font-mono px-1 rounded-md ${
                            cellWorkload >= 4
                              ? "bg-rose-500 text-white"
                              : cellWorkload >= 2
                              ? "bg-amber-500 text-white"
                              : "bg-emerald-600 text-white"
                          }`}>
                            {cellWorkload}
                          </span>
                        )}
                      </div>

                      {/* Mini list of tasks/clients */}
                      <div className="mt-1 space-y-0.5 overflow-hidden flex-1 flex flex-col justify-end">
                        {cell.interventions.slice(0, 2).map((item, idy) => (
                          <div 
                            key={idy} 
                            className={`text-[8px] md:text-[9px] truncate px-1 py-0.5 rounded-sm leading-none font-sans border flex items-center gap-0.5 ${
                              isDark 
                                ? "bg-slate-900 border-slate-755 text-slate-300" 
                                : "bg-white border-slate-105 text-slate-600 shadow-sm"
                            }`}
                            title={`(${item.refNumber}) ${item.clientName} - ${item.deviceType}`}
                          >
                            <span className="truncate">{item.clientName}</span>
                          </div>
                        ))}
                        {cellWorkload > 2 && (
                          <div className="text-[7.5px] text-center font-bold text-slate-400 font-mono">
                            + {cellWorkload - 2} inter.
                          </div>
                        )}
                      </div>
                    </>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        {/* Small calendar analytics footer banner */}
        <div className={`mt-4 p-3 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs ${
          isDark ? "bg-slate-950/40 border-slate-805" : "bg-slate-50/50 border-slate-100"
        }`}>
          <div className="flex flex-wrap gap-4 font-sans text-slate-400">
            <div>
              Prestations ce mois : <strong className={isDark ? "text-slate-200" : "text-slate-800"}>{totalMonthInterventions}</strong>
            </div>
            <div className="hidden sm:block opacity-40">|</div>
            <div>
              Jours avec support : <strong className={isDark ? "text-slate-200" : "text-slate-800"}>{busyDaysCount} j</strong>
            </div>
            {maxDayWorkload > 0 && (
              <>
                <div className="hidden sm:block opacity-40">|</div>
                <div>
                  Pic d'activité : <strong className="text-amber-500">{maxDayWorkload} inter.</strong> (le {maxWorkloadDayNum} {MONTHS_FR[currentMonthIndex]})
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2.5 text-[8px] md:text-[9px] font-bold tracking-wider font-mono opacity-80">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 block"></span> Calme</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 block"></span> Modéré</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500 block"></span> Pic</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Breakdown Bar Chart */}
        <div className={`border rounded-xl p-5 shadow-sm flex flex-col justify-between transition-colors ${
          isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200/80 text-slate-900"
        }`}>
          <div className={`flex items-center justify-between mb-4 pb-2 border-b ${isDark ? "border-slate-800" : "border-slate-50"}`}>
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Building className="w-4 h-4 text-teal-555" />
              Volume par Directions & Départements Servis
            </h4>
            <span className="text-xs text-slate-400 font-mono">Top 5</span>
          </div>
          
          <div className="space-y-4 py-2">
            {sortedDepts.map(([dept, count]) => {
              const pct = Math.round((count / maxDeptValue) * 100);
              return (
                <div key={dept} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className={`font-medium truncate max-w-xs ${isDark ? "text-slate-200" : "text-slate-700"}`}>{dept}</span>
                    <span className={`font-bold px-2 py-0.5 rounded font-mono ${isDark ? "bg-slate-805 text-slate-300" : "bg-slate-100 text-slate-900"}`}>
                      {count} inter.
                    </span>
                  </div>
                  <div className={`w-full h-3.5 rounded-full overflow-hidden flex ${isDark ? "bg-slate-950" : "bg-slate-100"}`}>
                    <div 
                      className="bg-teal-600 hover:bg-teal-500 rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-1 text-[8px] font-bold text-white font-mono"
                      style={{ width: `${pct}%` }}
                    >
                      {pct > 15 ? `${pct}%` : ''}
                    </div>
                  </div>
                </div>
              );
            })}
            {sortedDepts.length === 0 && (
              <div className="text-center py-10 text-slate-400 text-xs font-mono">
                Aucune donnée à afficher. Veuillez consigner une intervention.
              </div>
            )}
          </div>
        </div>

        {/* Categories Analysis */}
        <div className={`border rounded-xl p-5 shadow-sm flex flex-col justify-between transition-colors ${
          isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200/80"
        }`}>
          <div className={`flex items-center justify-between mb-4 pb-2 border-b ${isDark ? "border-slate-800" : "border-slate-50"}`}>
            <h4 className={`font-semibold text-sm flex items-center gap-2 ${isDark ? "text-slate-150" : "text-slate-805"}`}>
              <PieIcon className="w-4 h-4 text-indigo-500" />
              Actions Techniques Accomplies par Catégorie
            </h4>
            <span className="text-xs text-slate-400 font-mono">Type d'Actes</span>
          </div>

          <div className="grid grid-cols-2 gap-4 py-2">
            {Object.entries(catMap).map(([category, count]) => {
              const pct = Math.round((count / maxCatValue) * 100);
              const isZero = count === 0;
              return (
                <div key={category} className={`border p-3 rounded-lg flex flex-col justify-between min-h-20 transition-all ${
                  isDark ? "border-slate-805 bg-slate-950/40" : "border-slate-100 bg-slate-50/50"
                }`}>
                  <div className="flex justify-between items-start">
                    <span className={`text-xs font-semibold ${isDark ? "text-slate-350" : "text-slate-600"}`}>{category}</span>
                    <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                      isZero 
                        ? isDark ? 'bg-slate-900 text-slate-600' : 'bg-slate-105 text-slate-400' 
                        : isDark ? 'bg-indigo-950/70 text-indigo-400' : 'bg-indigo-50 text-indigo-700'
                    }`}>
                      {count}
                    </span>
                  </div>
                  
                  <div className="mt-3 text-[10px] text-slate-400 font-mono">
                    <div className={`w-full h-2.5 rounded-full overflow-hidden ${isDark ? "bg-slate-900" : "bg-slate-200/60"}`}>
                      <div 
                        className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${isZero ? 0 : pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recharts BarChart for distribution of intervention types by department */}
        <div className={`border rounded-xl p-5 shadow-sm space-y-4 lg:col-span-2 transition-colors ${
          isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200/80 text-slate-900"
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b dark:border-slate-800 border-slate-50">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-600" />
              Répartition des Types d'Interventions par Département
            </h4>
            <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">Analyse Analytique Recharts</span>
          </div>

          <div className="w-full h-80 pt-2 font-mono text-[10px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e293b" : "#f1f5f9"} />
                  <XAxis type="number" stroke={isDark ? "#94a3b8" : "#64748b"} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    stroke={isDark ? "#94a3b8" : "#64748b"} 
                    tickFormatter={(value) => value.length > 20 ? `${value.substring(0, 18)}...` : value}
                    width={100}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDark ? "#0f172a" : "#ffffff", 
                      borderColor: isDark ? "#1e293b" : "#cbd5e1",
                      borderRadius: "8px",
                      color: isDark ? "#f8fafc" : "#0f172a"
                    }} 
                  />
                  <Legend wrapperStyle={{ fontSize: "10px", marginTop: "10px" }} />
                  <Bar dataKey="Matériel" fill="#0d9488" stackId="a" />
                  <Bar dataKey="Logiciel" fill="#2563eb" stackId="a" />
                  <Bar dataKey="Réseau" fill="#9333ea" stackId="a" />
                  <Bar dataKey="Sécurité" fill="#e11d48" stackId="a" />
                  <Bar dataKey="Optimisation" fill="#d97706" stackId="a" />
                  <Bar dataKey="Autre" fill="#475569" stackId="a" />
                </RechartsBarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400 font-mono">
                Aucune donnée d'intervention disponible pour générer l'analyse administrative.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Proof Support Section: Who we helped the most */}
      <div className={`border rounded-xl p-5 shadow-sm transition-colors ${
        isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200/80"
      }`}>
        <div className={`flex items-center justify-between mb-4 pb-2 border-b ${isDark ? "border-slate-805" : "border-slate-50"}`}>
          <div>
            <h4 className={`font-semibold text-sm flex items-center gap-2 ${isDark ? "text-slate-150" : "text-slate-805"}`}>
              <CalendarCheck className="w-4 h-4 text-emerald-500" />
              Registre de Preuves de Service par Bénéficiaire
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Ces archives démontrent l'étendue de vos travaux de support par bureau et par équipement.
            </p>
          </div>
          <span className={`px-2.5 py-1 rounded font-mono font-bold text-xs ${
            isDark ? "text-teal-400 bg-teal-950/40 border border-teal-800/20" : "text-teal-700 bg-teal-50"
          }`}>
            Total Directeurs/Bénéficiaires : {Object.keys(clientSummary).length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-sans">
            <thead>
              <tr className={`border-b text-[9px] font-bold uppercase tracking-widest ${
                isDark ? "bg-slate-950 border-slate-805 text-slate-400" : "bg-slate-50 border-slate-100 text-slate-400"
              }`}>
                <th className="p-2.5">Bénéficiaire de l'Intervention / Directeur</th>
                <th className="p-2.5">Département d'Intégration d'État</th>
                <th className="p-2.5">Équipements Assistés</th>
                <th className="p-2.5 text-center">Interventions Validées</th>
                <th className="p-2.5 text-right w-44">Preuve administrative</th>
              </tr>
            </thead>
            <tbody>
              {clientsSorted.map(([clientName, info]) => (
                <tr key={clientName} className={`border-b transition-colors ${
                  isDark ? "border-slate-805 hover:bg-slate-850/30" : "border-slate-100 hover:bg-slate-50/50"
                }`}>
                  <td className="p-2.5 font-semibold text-sm flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold uppercase text-[10px] ${
                      isDark ? "bg-slate-850 text-slate-300" : "bg-slate-100 text-slate-600"
                    }`}>
                      {clientName[0] || '?'}
                    </div>
                    <span className={isDark ? "text-slate-200" : "text-slate-800"}>{clientName}</span>
                  </td>
                  <td className="p-2.5 text-slate-405">{info.dept}</td>
                  <td className="p-2.5">
                    <div className="flex flex-wrap gap-1">
                      {info.devices.map(dev => (
                        <span key={dev} className={`px-1.5 py-0.5 rounded text-[10px] ${
                          isDark ? "bg-slate-950 border border-slate-805 text-slate-400" : "bg-slate-100 border border-slate-200 text-slate-600"
                        }`}>
                          {dev}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-2.5 font-bold text-center font-mono">{info.count}</td>
                  <td className={`p-2.5 text-right font-semibold text-xs ${isDark ? "text-teal-400" : "text-teal-700"}`}>
                    ✓ Prête au registre
                  </td>
                </tr>
              ))}
              {clientsSorted.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400 font-mono">
                    Aucun bénéficiaire enregistré au registre de preuve.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
