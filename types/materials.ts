export type MaterialKind = "video" | "audio" | "sheet" | "link";

export type MaterialAccessLevel = "free" | "partial" | "premium";

export type Material = {
  id: string;
  title: string;
  description?: string;
  kind: MaterialKind;
  category?: string;
  accessLevel: MaterialAccessLevel;
  priceCents?: number;
  isActive: boolean;

  // Gdy materiał jest plikiem w Firebase Storage.
  storagePath?: string;

  // Alternatywa dla pliku (np. osadzony film lub zewnętrzny link).
  externalUrl?: string;

  createdAt: number;
  updatedAt?: number;
};

export type MaterialWithAccess = Material & {
  canAccess: boolean;
  requiresPlanUpgrade: boolean;
  resolvedUrl?: string;
};

export type MaterialsForParent = {
  materialsAccess: "none" | "partial" | "all";
  available: MaterialWithAccess[];
  locked: MaterialWithAccess[];
};
