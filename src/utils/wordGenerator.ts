/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Word Document Generator for CNIPLC Fiches (Intervention & Attribution)
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ImageRun,
  HeadingLevel,
  ShadingType,
  VerticalAlign,
  TableLayoutType
} from "docx";
import { Intervention } from "../types";

// Fetch the CNIPLC logo as ArrayBuffer for embedding in Word
async function fetchLogoAsArrayBuffer(): Promise<ArrayBuffer | null> {
  try {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const res = await fetch(origin + "/logo.jpeg");
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

// Reusable border config
const noBorder = {
  top: { style: BorderStyle.NONE, size: 0 },
  bottom: { style: BorderStyle.NONE, size: 0 },
  left: { style: BorderStyle.NONE, size: 0 },
  right: { style: BorderStyle.NONE, size: 0 },
};

const thinBorder = {
  top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
  left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
  right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
};

function formatDateFR(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export async function generateWordBlob(
  intervention: Intervention
): Promise<Blob> {
  const isAttribution = intervention.ficheType === "attribution";
  const logoBuffer = await fetchLogoAsArrayBuffer();

  // Build header children
  const headerChildren: Paragraph[] = [];

  // Logo + Republic header
  if (logoBuffer) {
    headerChildren.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [
          new ImageRun({
            data: logoBuffer,
            transformation: { width: 60, height: 60 },
            type: "jpg",
          }),
        ],
        spacing: { after: 80 },
      })
    );
  }

  headerChildren.push(
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: "RÉPUBLIQUE DE DJIBOUTI",
          bold: true,
          size: 16,
          font: "Calibri",
          color: "64748B",
          allCaps: true,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: "COMMISSION NATIONALE INDÉPENDANTE POUR LA PRÉVENTION ET LA LUTTE CONTRE LA CORRUPTION",
          bold: true,
          size: 15,
          font: "Calibri",
          color: "0F172A",
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: "CNIPLC - SERVICES TECHNIQUES DE L'INFORMATIQUE",
          bold: true,
          size: 16,
          font: "Calibri",
          color: "0D9488",
        }),
      ],
    })
  );

  // Reference and date
  headerChildren.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 20 },
      children: [
        new TextRun({
          text: `REF : ${intervention.refNumber || "N/A"}`,
          bold: true,
          size: 20,
          font: "Courier New",
          color: "0F172A",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 20 },
      children: [
        new TextRun({
          text: `Date : ${formatDateFR(intervention.date)}`,
          size: 18,
          font: "Calibri",
          color: "64748B",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: `Durée : ${intervention.durationMinutes || 30} min`,
          size: 16,
          font: "Calibri",
          color: "94A3B8",
        }),
      ],
    })
  );

  // Separator
  headerChildren.push(
    new Paragraph({
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 3, color: "0F172A" },
      },
      spacing: { after: 200 },
      children: [],
    })
  );

  // Title
  headerChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 100, after: 40 },
      children: [
        new TextRun({
          text: isAttribution
            ? "FICHE D'ATTRIBUTION ET DE RESTITUTION DE MATÉRIEL"
            : "FICHE D'INTERVENTION TECHNIQUE",
          bold: true,
          size: 28,
          font: "Calibri",
          color: "0F172A",
          allCaps: true,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: isAttribution
            ? "& ATTESTATION DE MATÉRIEL ATTRIBUÉ"
            : "& ATTESTATION DE SERVICE FAIT",
          size: 16,
          font: "Courier New",
          color: "64748B",
          allCaps: true,
        }),
      ],
    })
  );

  // Preferred Service badge
  if (intervention.preferredService) {
    headerChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: `★ Service demandé : ${intervention.preferredService}`,
            bold: true,
            size: 16,
            font: "Calibri",
            color: "0D9488",
          }),
        ],
      })
    );
  }

  // Parties Table (Technicien + Bénéficiaire)
  const partiesTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: thinBorder,
            shading: { type: ShadingType.SOLID, color: "F8FAFC" },
            children: [
              new Paragraph({
                spacing: { after: 40 },
                children: [
                  new TextRun({
                    text: "INTERVENANT (TECHNICIEN IT)",
                    bold: true,
                    size: 16,
                    font: "Calibri",
                    color: "0D9488",
                    allCaps: true,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: intervention.techName || "Technicien",
                    bold: true,
                    size: 20,
                    font: "Calibri",
                    color: "1E293B",
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: intervention.techTitle || "Support CNIPLC",
                    size: 18,
                    font: "Calibri",
                    color: "64748B",
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Dép. Validant : ${intervention.techValidatingDept || "CNIPLC Informatique"}`,
                    size: 16,
                    font: "Calibri",
                    color: "94A3B8",
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: thinBorder,
            shading: { type: ShadingType.SOLID, color: "F8FAFC" },
            children: [
              new Paragraph({
                spacing: { after: 40 },
                children: [
                  new TextRun({
                    text: "BÉNÉFICIAIRE (DEMANDEUR)",
                    bold: true,
                    size: 16,
                    font: "Calibri",
                    color: "334155",
                    allCaps: true,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: intervention.clientName || "Collaborateur",
                    bold: true,
                    size: 20,
                    font: "Calibri",
                    color: "1E293B",
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: intervention.clientTitle || "Fonctionnaire",
                    size: 18,
                    font: "Calibri",
                    color: "475569",
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Direction : ${intervention.clientDepartment || "N/A"}`,
                    size: 16,
                    font: "Calibri",
                    color: "94A3B8",
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  headerChildren.push(partiesTable);

  // Equipment Section
  headerChildren.push(
    new Paragraph({ spacing: { before: 200, after: 60 }, children: [] })
  );

  if (isAttribution) {
    headerChildren.push(
      new Paragraph({
        spacing: { after: 60 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
        },
        children: [
          new TextRun({
            text: "RÉFÉRENCE DE L'ÉQUIPEMENT ATTRIBUÉ",
            bold: true,
            size: 16,
            font: "Calibri",
            color: "334155",
            allCaps: true,
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: intervention.equipRef || "Non spécifiée",
            bold: true,
            size: 22,
            font: "Courier New",
            color: "1E293B",
          }),
        ],
      })
    );
  } else {
    const equipTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: thinBorder,
              width: { size: 33, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Type de matériel",
                      size: 14,
                      color: "94A3B8",
                      font: "Calibri",
                    }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: (intervention.deviceType || "PC").toUpperCase(),
                      bold: true,
                      size: 18,
                      font: "Courier New",
                      color: "1E293B",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              borders: thinBorder,
              width: { size: 33, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Modèle / Marque",
                      size: 14,
                      color: "94A3B8",
                      font: "Calibri",
                    }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: intervention.deviceBrand || "Standard",
                      bold: true,
                      size: 18,
                      font: "Courier New",
                      color: "1E293B",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              borders: thinBorder,
              width: { size: 34, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "N° Inventaire (Asset)",
                      size: 14,
                      color: "94A3B8",
                      font: "Calibri",
                    }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: intervention.deviceInventory || "N/A",
                      bold: true,
                      size: 18,
                      font: "Courier New",
                      color: "1E293B",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });

    headerChildren.push(
      new Paragraph({
        spacing: { after: 60 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
        },
        children: [
          new TextRun({
            text: "DÉTAILS DE L'ÉQUIPEMENT INFORMATIQUE",
            bold: true,
            size: 16,
            font: "Calibri",
            color: "334155",
            allCaps: true,
          }),
        ],
      }),
      equipTable
    );
  }

  // Professional Summary
  headerChildren.push(
    new Paragraph({ spacing: { before: 200, after: 60 }, children: [] }),
    new Paragraph({
      spacing: { after: 60 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
      },
      children: [
        new TextRun({
          text: isAttribution
            ? "DESCRIPTION DE L'ATTRIBUTION"
            : "RAPPORT SYNTHÉTIQUE D'INTERVENTION",
          bold: true,
          size: 16,
          font: "Calibri",
          color: "334155",
          allCaps: true,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 120 },
      alignment: AlignmentType.JUSTIFIED,
      children: [
        new TextRun({
          text:
            intervention.professionalSummary || "Aucune description rédigée.",
          size: 20,
          font: "Calibri",
          color: "1E293B",
        }),
      ],
    })
  );

  // Quick Notes
  if (intervention.quickNotes) {
    headerChildren.push(
      new Paragraph({
        spacing: { before: 80, after: 40 },
        children: [
          new TextRun({
            text: "NOTES RAPIDES & OBSERVATIONS",
            bold: true,
            size: 16,
            font: "Calibri",
            color: "0D9488",
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: intervention.quickNotes,
            italics: true,
            size: 18,
            font: "Calibri",
            color: "475569",
          }),
        ],
      })
    );
  }

  // Tasks Table
  const taskHeaderCells = isAttribution
    ? ["N°", "Désignation", "Caractéristiques", "État"]
    : ["N°", "Action Technique", "Catégorie", "Statut"];

  const taskHeaderRow = new TableRow({
    tableHeader: true,
    children: taskHeaderCells.map(
      (label, i) =>
        new TableCell({
          borders: thinBorder,
          shading: { type: ShadingType.SOLID, color: "F1F5F9" },
          width: {
            size: i === 0 ? 8 : i === 1 ? 44 : i === 2 ? 28 : 20,
            type: WidthType.PERCENTAGE,
          },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: i === 0 || i === 3 ? AlignmentType.CENTER : AlignmentType.LEFT,
              children: [
                new TextRun({
                  text: label,
                  bold: true,
                  size: 16,
                  font: "Calibri",
                  color: "334155",
                  allCaps: true,
                }),
              ],
            }),
          ],
        })
    ),
  });

  const taskDataRows =
    intervention.tasks.length > 0
      ? intervention.tasks.map(
          (task, idx) =>
            new TableRow({
              children: [
                new TableCell({
                  borders: thinBorder,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: String(idx + 1),
                          size: 18,
                          font: "Courier New",
                          color: "64748B",
                        }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  borders: thinBorder,
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: task.description,
                          size: 18,
                          font: "Calibri",
                          color: "1E293B",
                        }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  borders: thinBorder,
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: task.category,
                          size: 16,
                          font: "Calibri",
                          color: "0D9488",
                        }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  borders: thinBorder,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: isAttribution
                            ? task.status || "Neuf"
                            : "✓ EFFECTUÉ",
                          bold: true,
                          size: 16,
                          font: "Calibri",
                          color: "047857",
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            })
        )
      : [
          new TableRow({
            children: [
              new TableCell({
                borders: thinBorder,
                columnSpan: 4,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: isAttribution
                          ? "Aucun matériel enregistré."
                          : "Aucune action technique enregistrée.",
                        size: 16,
                        font: "Courier New",
                        color: "94A3B8",
                        italics: true,
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ];

  headerChildren.push(
    new Paragraph({ spacing: { before: 100, after: 60 }, children: [] }),
    new Paragraph({
      spacing: { after: 60 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
      },
      children: [
        new TextRun({
          text: isAttribution
            ? "DÉSIGNATION DU MATÉRIEL ATTRIBUÉ"
            : "NOMENCLATURE DES ACTIONS TECHNIQUES RÉALISÉES",
          bold: true,
          size: 16,
          font: "Calibri",
          color: "334155",
          allCaps: true,
        }),
      ],
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [taskHeaderRow, ...taskDataRows],
    })
  );

  // Restitution Details (Attribution only)
  if (isAttribution && intervention.restitutionDetails) {
    headerChildren.push(
      new Paragraph({ spacing: { before: 120, after: 60 }, children: [] }),
      new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({
            text: "MATÉRIEL RESTITUÉ (ANCIEN ÉQUIPEMENT)",
            bold: true,
            size: 16,
            font: "Calibri",
            color: "B45309",
            allCaps: true,
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: intervention.restitutionDetails,
            size: 18,
            font: "Calibri",
            color: "334155",
          }),
        ],
      })
    );
  }

  // Tech Note (Attribution only)
  if (isAttribution && intervention.techNote) {
    headerChildren.push(
      new Paragraph({
        spacing: { before: 80, after: 40 },
        children: [
          new TextRun({
            text: "NOTE TECHNIQUE",
            bold: true,
            size: 16,
            font: "Calibri",
            color: "0D9488",
            allCaps: true,
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: intervention.techNote,
            size: 18,
            font: "Calibri",
            color: "475569",
          }),
        ],
      })
    );
  }

  // Declaration
  const rawDate = intervention.signatureDate || intervention.date || new Date().toISOString();
  let dateFormatted = "";
  try {
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) {
      dateFormatted = rawDate;
    } else {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      dateFormatted = `${day}/${month}/${year}`;
    }
  } catch {
    dateFormatted = rawDate;
  }

  headerChildren.push(
    new Paragraph({ spacing: { before: 120 }, children: [] }),
    new Paragraph({
      spacing: { after: 120 },
      alignment: AlignmentType.JUSTIFIED,
      shading: { type: ShadingType.SOLID, color: "F8FAFC" },
      children: [
        new TextRun({
          text: "Déclaration administrative : ",
          bold: true,
          size: 20,
          font: "Calibri",
          color: "64748B",
        }),
        new TextRun({
          text: isAttribution
            ? "Ce document atteste de l'attribution effective du matériel informatique décrit ci-dessus par les services techniques du CNIPLC au bénéficiaire désigné. Le signataire du DAF, le bénéficiaire et le technicien informatique attestent par leurs signatures respectives que le matériel a été remis en bon état, configuré et opérationnel."
            : "Ce document atteste de la réalisation effective des travaux de dépannage, d'assistance, d'installation d'équipements ou de maintenance réseau décrits ci-dessus par les services informatiques d'État (CNIPLC). Le bénéficiaire atteste par sa signature que les systèmes informatiques mentionnés sont réparés, fonctionnels et conformes aux exigences professionnelles.",
          size: 20,
          font: "Calibri",
          color: "64748B",
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 120, after: 180 },
      children: [
        new TextRun({
          text: `Fait à Djibouti le ${dateFormatted}`,
          bold: true,
          size: 22,
          font: "Georgia",
          color: "1E293B",
        }),
      ],
    })
  );

  // Triple Signature Table
  const signatureTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({
        height: { value: 2400, rule: "atLeast" as any },
        children: [
          // DAF
          new TableCell({
            borders: thinBorder,
            width: { size: 33, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.TOP,
            children: [
              new Paragraph({
                spacing: { before: 60, after: 40 },
                children: [
                  new TextRun({
                    text: "LE DIRECTEUR ADMINISTRATIF",
                    bold: true,
                    size: 18,
                    font: "Calibri",
                    color: "1E293B",
                    allCaps: true,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { after: 40 },
                children: [
                  new TextRun({
                    text: "ET FINANCIER",
                    bold: true,
                    size: 18,
                    font: "Calibri",
                    color: "1E293B",
                    allCaps: true,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { after: 80 },
                children: [
                  new TextRun({
                    text: intervention.dafName || "Le DAF",
                    size: 20,
                    font: "Calibri",
                    color: "64748B",
                  }),
                ],
              }),
              new Paragraph({ spacing: { before: 1200 }, children: [] }),
            ],
          }),
          // Agent/Bénéficiaire
          new TableCell({
            borders: thinBorder,
            width: { size: 34, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.TOP,
            children: [
              new Paragraph({
                spacing: { before: 60, after: 40 },
                children: [
                  new TextRun({
                    text: "LE BÉNÉFICIAIRE",
                    bold: true,
                    size: 18,
                    font: "Calibri",
                    color: "1E293B",
                    allCaps: true,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { after: 40 },
                children: [
                  new TextRun({
                    text: intervention.clientName || "L'Agent",
                    size: 20,
                    font: "Calibri",
                    color: "64748B",
                  }),
                ],
              }),
              ...(intervention.preferredService
                ? [
                    new Paragraph({
                      spacing: { after: 40 },
                      children: [
                        new TextRun({
                          text: intervention.preferredService,
                          bold: true,
                          size: 16,
                          font: "Calibri",
                          color: "0D9488",
                          allCaps: true,
                        }),
                      ],
                    }),
                  ]
                : []),
              new Paragraph({ spacing: { before: 1200 }, children: [] }),
            ],
          }),
          // Technicien IT
          new TableCell({
            borders: thinBorder,
            width: { size: 33, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.TOP,
            children: [
              new Paragraph({
                spacing: { before: 60, after: 40 },
                children: [
                  new TextRun({
                    text: "LE TECHNICIEN INFORMATIQUE",
                    bold: true,
                    size: 18,
                    font: "Calibri",
                    color: "1E293B",
                    allCaps: true,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { after: 40 },
                children: [
                  new TextRun({
                    text: intervention.techName || "Technicien IT",
                    size: 20,
                    font: "Calibri",
                    color: "64748B",
                  }),
                ],
              }),
              new Paragraph({
                spacing: { after: 80 },
                children: [
                  new TextRun({
                    text:
                      intervention.techValidatingDept || "CNIPLC Informatique",
                    size: 16,
                    font: "Calibri",
                    color: "94A3B8",
                  }),
                ],
              }),
              new Paragraph({ spacing: { before: 1200 }, children: [] }),
            ],
          }),
        ],
      }),
    ],
  });

  headerChildren.push(
    new Paragraph({ spacing: { before: 200 }, children: [] }),
    signatureTable
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 600,
              bottom: 600,
              left: 800,
              right: 800,
            },
          },
        },
        children: headerChildren,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

export async function generateAndDownloadWord(
  intervention: Intervention
): Promise<void> {
  const blob = await generateWordBlob(intervention);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const prefix =
    intervention.ficheType === "attribution" ? "Attribution" : "Intervention";
  a.download = `Fiche_${prefix}_${intervention.refNumber || "CNIPLC"}_${intervention.date}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
