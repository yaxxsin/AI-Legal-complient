import { create } from 'zustand';

export interface BusinessProfile {
  id: string;
  businessName: string;
  entityType: string;
  city: string | null;
  province: string | null;
  hasNib: boolean;
  nibNumber: string | null;
  isDraft: boolean;
  createdAt: string;
}

interface ProfileStore {
  profiles: BusinessProfile[];
  activeProfileId: string | null;
  isLoading: boolean;
  setProfiles: (profiles: BusinessProfile[]) => void;
  setActiveProfileId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  /** Get the currently active profile object */
  getActiveProfile: () => BusinessProfile | null;
}

/** Global business profile state — supports multi-profile switching */
export const useProfileStore = create<ProfileStore>((set, get) => ({
  profiles: [],
  activeProfileId: null,
  isLoading: true,

  setProfiles: (profiles) => {
    const current = get().activeProfileId;
    // Auto-select first non-draft profile if none selected
    const validProfiles = profiles.filter((p) => !p.isDraft);
    const autoSelect = validProfiles.length > 0
      ? (current && validProfiles.find((p) => p.id === current) ? current : validProfiles[0].id)
      : profiles[0]?.id ?? null;

    set({ profiles, activeProfileId: autoSelect, isLoading: false });
  },

  setActiveProfileId: (id) => set({ activeProfileId: id }),
  setLoading: (isLoading) => set({ isLoading }),

  getActiveProfile: () => {
    const { profiles, activeProfileId } = get();
    return profiles.find((p) => p.id === activeProfileId) ?? null;
  },
}));
