import { create } from 'zustand';

const useStore = create((set) => ({
  // --- Authentication & Session Metrics ---
  isAuthenticated: true, // Defaulting true for development flow
  userRole: 'Lead Architect',
  
  // --- Global Navigation ---
  activeTab: 'Deep Audit Suite',

  // --- Real-Time Audit Core Storage (Synced with New Backend Analytics) ---
  latestScanResult: null,   // Holds the current stringified JSON response payload object
  auditHistoryList: [],     // Holds the relational SQL arrays records fetched from backend
  isScanLoading: false,     // Global processing state trigger for components animations
  activeProjectContext: "Default Project",

  // --- Actions ---
  login: () => set({ isAuthenticated: true, userRole: 'Lead Architect' }),
  logout: () => set({ isAuthenticated: false, userRole: null, latestScanResult: null, auditHistoryList: [] }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setProjectContext: (projectName) => set({ activeProjectContext: projectName }),
  
  // --- Active Pipelines Sync ---
  startScanPipeline: () => set({ isScanLoading: true }),
  commitScanSuccess: (payload) => set({ latestScanResult: payload, isScanLoading: false }),
  commitScanFailure: () => set({ isScanLoading: false }),
  syncAuditHistory: (historyArray) => set({ auditHistoryList: historyArray }),
}));

export default useStore;