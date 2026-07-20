import { create } from 'zustand';
import { RoyaltyAgreement } from '@/shared/types';
import { getUserAgreements, getAgreement } from '../services/registryService';

interface AgreementStore {
  agreements: RoyaltyAgreement[];
  isLoading: boolean;
  error: string | null;

  fetchAgreements: (owner: string) => Promise<void>;
  addAgreement: (agreement: RoyaltyAgreement) => void;
  clearAgreements: () => void;
}

export const useAgreementStore = create<AgreementStore>()((set, get) => ({
  agreements: [],
  isLoading: false,
  error: null,

  fetchAgreements: async (owner: string) => {
    set({ isLoading: true, error: null });
    try {
      const ids = await getUserAgreements(owner);
      if (ids.length === 0) {
        set({ agreements: [], isLoading: false });
        return;
      }

      // Fetch each agreement in parallel
      const results = await Promise.all(
        ids.map(id => getAgreement(id, owner))
      );

      const agreements = results.filter(
        (a): a is RoyaltyAgreement => a !== null
      );

      // Sort by created_at descending (newest first)
      agreements.sort((a, b) => b.created_at - a.created_at);

      set({ agreements, isLoading: false });
    } catch (e: any) {
      console.error('Failed to fetch agreements:', e);
      set({
        error: e?.message || 'Failed to fetch agreements',
        isLoading: false,
      });
    }
  },

  addAgreement: (agreement: RoyaltyAgreement) => {
    set(state => ({
      agreements: [agreement, ...state.agreements],
    }));
  },

  clearAgreements: () => {
    set({ agreements: [], isLoading: false, error: null });
  },
}));
