// Zustand store for the profile setup wizard.
// Persists draft to localStorage so the user can resume.
// One store instance per browser session — role is read from auth store.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserRole } from '@/lib/types';

// ─── Shape ────────────────────────────────────────────────────────────────────

export interface RegistrationState {
  role:         UserRole | null;
  currentStep:  number;
  totalSteps:   number;
  /** Accumulated form data across all steps — keyed by field name */
  formData:     Record<string, unknown>;
  /** Tracks which step indexes have been saved to backend */
  savedSteps:   number[];
  /** File records that were successfully uploaded this session */
  uploadedDocs: Record<string, string>; // docType → publicUrl or documentId
  isDirty:      boolean;
  lastSavedAt:  string | null;

  // Actions
  setRole:           (role: UserRole, total: number) => void;
  setStep:           (step: number) => void;
  mergeFormData:     (data: Record<string, unknown>) => void;
  markStepSaved:     (step: number) => void;
  setUploadedDoc:    (docType: string, value: string) => void;
  removeUploadedDoc: (docType: string) => void;
  setLastSaved:      () => void;
  resetWizard:       () => void;
}

// ─── Initial state ────────────────────────────────────────────────────────────

const INITIAL: Omit<RegistrationState,
  | 'setRole' | 'setStep' | 'mergeFormData' | 'markStepSaved'
  | 'setUploadedDoc' | 'removeUploadedDoc' | 'setLastSaved' | 'resetWizard'
> = {
  role:         null,
  currentStep:  0,
  totalSteps:   0,
  formData:     {},
  savedSteps:   [],
  uploadedDocs: {},
  isDirty:      false,
  lastSavedAt:  null,
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useRegistrationStore = create<RegistrationState>()(
  persist(
    (set) => ({
      ...INITIAL,

      setRole(role, total) {
        set({ role, totalSteps: total, currentStep: 0 });
      },

      setStep(step) {
        set({ currentStep: step });
      },

      mergeFormData(data) {
        set((s) => ({
          formData: { ...s.formData, ...data },
          isDirty:  true,
        }));
      },

      markStepSaved(step) {
        set((s) => ({
          savedSteps: Array.from(new Set([...s.savedSteps, step])),
          isDirty:    false,
        }));
      },

      setUploadedDoc(docType, value) {
        set((s) => ({
          uploadedDocs: { ...s.uploadedDocs, [docType]: value },
        }));
      },

      removeUploadedDoc(docType) {
        set((s) => {
          const next = { ...s.uploadedDocs };
          delete next[docType];
          return { uploadedDocs: next };
        });
      },

      setLastSaved() {
        set({ lastSavedAt: new Date().toISOString(), isDirty: false });
      },

      resetWizard() {
        set({ ...INITIAL });
      },
    }),
    {
      name:    'shiftify_reg_draft',
      storage: createJSONStorage(() => localStorage),
      // Only persist data — not actions
      partialize: (s) => ({
        role:         s.role,
        currentStep:  s.currentStep,
        totalSteps:   s.totalSteps,
        formData:     s.formData,
        savedSteps:   s.savedSteps,
        uploadedDocs: s.uploadedDocs,
        lastSavedAt:  s.lastSavedAt,
        isDirty:      s.isDirty,
      }),
    },
  ),
);

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectProgress = (s: RegistrationState) =>
  s.totalSteps > 0 ? Math.round(((s.currentStep) / s.totalSteps) * 100) : 0;

export const selectIsStepSaved = (step: number) => (s: RegistrationState) =>
  s.savedSteps.includes(step);
