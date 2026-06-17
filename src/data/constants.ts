/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Intervention } from "../types";

export const DEPARTMENTS = [
  "Direction Générale",
  "Ressources Humaines",
  "Finances et Budget",
  "Secrétariat Général",
  "Affaires Juridiques",
  "Infrastructures et Logistique",
  "Systèmes d'Information (DSI)",
  "Cabinet du Directeur",
  "Relations Publiques et Communication",
  "Statistiques et Études",
  "Service Client et Support"
];

export const DEVICE_TYPES = [
  { value: "PC Bureau", label: "Ordinateur de Bureau" },
  { value: "PC Portable", label: "Ordinateur Portable" },
  { value: "Imprimante", label: "Imprimante / Scanner" },
  { value: "Serveur", label: "Serveur Physique / Virtuel" },
  { value: "Réseau (Switch/Routeur)", label: "Équipement Réseau (Routeur/Switch)" },
  { value: "Téléphonie/IP", label: "Téléphonie IP / Onduleur" },
  { value: "Autre", label: "Autre Équipement" }
];

export const TASK_CATEGORIES = [
  "Matériel",
  "Logiciel",
  "Réseau",
  "Sécurité",
  "Optimisation",
  "Autre"
] as const;

export const INITIAL_INTERVENTIONS: Intervention[] = [
  {
    id: "INT-2026-0001",
    refNumber: "CNIPLC-2026-0001",
    date: "2026-06-01",
    clientName: "M. Daher Ali",
    clientTitle: "Directeur de Cabinet",
    clientDepartment: "Cabinet du Directeur",
    techName: "Said Awaleh",
    techTitle: "Ingénieur Support Informatique",
    deviceType: "PC Portable",
    deviceBrand: "Dell Latitude 5420",
    deviceInventory: "INV/CNIPLC/2026/089",
    rawNotes: "pc tres lent, ajoute 8go ram ddr4, maj antivirus windows, nettoyage complet des ventilateurs empoussiérés",
    professionalSummary: "Intervention de maintenance matérielle et logicielle suite à des signalements de lenteurs extrêmes du système. Démontage complet du châssis pour nettoyage thermique de la ventilation poussiéreuse. Intégration physique d'un module mémoire vive (RAM DDR4 8 Go) pour accroître l'efficacité mémoire. Mise à jour de sécurité de l'infrastructure logicielle (Antivirus Microsoft Defender & Pilotes constructeur Dell).",
    tasks: [
      { id: "task-1", description: "Nettoyage thermique et dépoussiérage du ventilateur interne", category: "Matériel", status: "completed" },
      { id: "task-2", description: "Installation physique d'une barrette de RAM DDR4 8 Go", category: "Optimisation", status: "completed" },
      { id: "task-3", description: "Mise à jour corrective de l'antivirus et des bases de sécurité système", category: "Sécurité", status: "completed" }
    ],
    status: "termine",
    signatureDate: "2026-06-01",
    durationMinutes: 45,
    quickNotes: "Observation : L'utilisateur signale que la batterie chauffe aussi légèrement lors d'une utilisation prolongée.",
    created_at: "2026-06-01T09:30:00Z"
  },
  {
    id: "INT-2026-0002",
    refNumber: "CNIPLC-2026-0002",
    date: "2026-06-02",
    clientName: "Mme Kadra Ousmane",
    clientTitle: "Chef de Service RH",
    clientDepartment: "Ressources Humaines",
    techName: "Said Awaleh",
    techTitle: "Ingénieur Support Informatique",
    deviceType: "Imprimante",
    deviceBrand: "HP LaserJet Pro M404",
    deviceInventory: "INV/CNIPLC/2025/112",
    rawNotes: "imprimante bloquee reseau, configure ip statique et partage reseau interne pour 4 secretaires",
    professionalSummary: "Résolution d'un incident de connectivité réseau hors-ligne sur l'unité d'impression collective. Attribution d'une adresse IP fixe/statique dédiée dans la table de routage administrative. Configuration des accès et des protocoles de partage réseau de proximité, permettant la liaison simultanée des requêtes de 4 postes de secrétariat.",
    tasks: [
      { id: "task-4", description: "Configuration réseau d'une adresse IP statique stable", category: "Réseau", status: "completed" },
      { id: "task-5", description: "Déploiement du pilote d'impression partagé et test de sortie papier", category: "Logiciel", status: "completed" }
    ],
    status: "termine",
    signatureDate: "2026-06-02",
    durationMinutes: 60,
    quickNotes: "",
    created_at: "2026-06-02T11:15:00Z"
  },
  {
    id: "INT-2026-0003",
    refNumber: "CNIPLC-2026-0003",
    date: "2026-06-03",
    clientName: "M. Harbi Elmi",
    clientTitle: "Directeur Financier",
    clientDepartment: "Finances et Budget",
    techName: "Said Awaleh",
    techTitle: "Ingénieur Support Informatique",
    deviceType: "PC Bureau",
    deviceBrand: "Lenovo ThinkCentre",
    deviceInventory: "INV/CNIPLC/2024/004",
    rawNotes: "ecran bleu bsod crash au demarrage. disque ssd sature, nettoyage fichiers système temporaires du ministere",
    professionalSummary: "Diagnostic suite à des pannes récurrentes par écran bleu (BSOD Code KERNEL_DATA_INPAGE_ERROR). Identification d'une saturation totale de l'espace de stockage flash principal (SSD). Purge intégrale des caches, réindexation de la base de registre et suppression des données système obsolètes afin de rétablir un taux d'espace libre de 25% garantissant la stabilité d'exécution.",
    tasks: [
      { id: "task-6", description: "Dépannage du démarrage système (Analyse BSOD & crash dumps)", category: "Logiciel", status: "completed" },
      { id: "task-7", description: "Optimisation d'espace de stockage SSD par purge des fichiers accumulés", category: "Optimisation", status: "completed" }
    ],
    status: "termine",
    signatureDate: "2026-06-03",
    durationMinutes: 90,
    quickNotes: "Détail : Il s'avère que le disque avait de nombreux fichiers résiduels d'anciennes installations d'OS.",
    created_at: "2026-06-03T08:20:00Z"
  }
];
