export type ComplianceStatus = 'pending' | 'in_progress' | 'done' | 'not_applicable' | 'overdue';
export type Priority = 'critical' | 'high' | 'medium' | 'low';

export interface ComplianceCategory {
  id: string;
  name: string;
  icon: string | null;
  sortOrder: number;
}

export interface ComplianceRule {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  priority: Priority;
  conditions: Record<string, unknown>;
  legalReferences: LegalReference[];
  guidanceText: string | null;
  isPublished: boolean;
}

export interface ComplianceItem {
  id: string;
  businessProfileId: string;
  ruleId: string;
  categoryId: string;
  title: string;
  description: string;
  legalBasis: LegalReference[];
  priority: Priority;
  status: ComplianceStatus;
  dueDate: string | null;
  completedAt: string | null;
  evidenceUrl: string | null;
  notes: string | null;
}

export interface LegalReference {
  name: string;
  article: string;
  url: string;
}

export interface ComplianceScore {
  overallScore: number;
  categoryScores: Record<string, number>;
  totalItems: number;
  completedItems: number;
  criticalPending: number;
}
