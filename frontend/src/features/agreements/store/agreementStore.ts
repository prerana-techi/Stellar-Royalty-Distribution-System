import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
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

export const useAgreementStore = create<AgreementStore>()(
  persist(
    (set, get) => ({
      agreements: [],
      isLoading: false,
      error: null,

      fetchAgreements: async (owner: string) => {
        set({ isLoading: true, error: null });
        try {
          const ids = await getUserAgreements(owner);
          const currentAgreements = get().agreements;

          if (ids.length === 0) {
            // Keep local agreements if chain simulation returns empty
            set({ isLoading: false });
            return;
          }

          // Fetch each agreement in parallel
          const results = await Promise.all(
            ids.map(id => getAgreement(id, owner))
          );

          const fetched = results.filter(
            (a): a is RoyaltyAgreement => a !== null
          );

          // Merge fetched agreements with local ones (prefer fetched, dedupe by ID or title)
          const mergedMap = new Map<string | number, RoyaltyAgreement>();
          
          // Put current local agreements first
          currentAgreements.forEach(a => mergedMap.set(a.id || a.title, a));
          // Override/add fetched agreements
          fetched.forEach(a => mergedMap.set(a.id || a.title, a));

          const agreements = Array.from(mergedMap.values());
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
        set(state => {
          const exists = state.agreements.some(
            a => a.id === agreement.id || a.title === agreement.title
          );
          if (exists) {
            return {
              agreements: state.agreements.map(a =>
                a.id === agreement.id || a.title === agreement.title ? agreement : a
              ),
            };
          }
          return {
            agreements: [agreement, ...state.agreements],
          };
        });
      },

      clearAgreements: () => {
        set({ agreements: [], isLoading: false, error: null });
      },
    }),
    {
      name: 'royaltyflow_agreements_storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ agreements: state.agreements }),
    }
  )
);

