export type EntityType = 'pt' | 'cv' | 'firma' | 'ud' | 'perorangan' | 'koperasi' | 'yayasan';
export type AnnualRevenue = '<500jt' | '500jt-2.5M' | '2.5M-50M' | '>50M';

export interface BusinessProfile {
  id: string;
  userId: string;
  businessName: string;
  entityType: EntityType;
  establishmentDate: string | null;
  sectorId: string | null;
  subSectorIds: string[] | null;
  employeeCount: number;
  annualRevenue: AnnualRevenue | null;
  city: string | null;
  province: string | null;
  hasNib: boolean;
  nibNumber: string | null;
  npwp: string | null;
  isOnlineBusiness: boolean;
  onboardingStep: number;
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Sector {
  id: string;
  name: string;
  code: string | null;
  parentId: string | null;
  icon: string | null;
  isActive: boolean;
}
