import { create } from 'zustand';

const useStore = create((set) => ({
  // Authentication
  isAuthenticated: false,
  userRole: 'Security Analyst',
  walletAddress: null,

  // Navigation
  activeTab: 'Executive Dashboard',
  activeSubTab: 'Overview',

  // Audit State
  latestScanResult: null,
  auditHistoryList: [],
  isScanLoading: false,
  activeProjectContext: 'Default Project',

  // Actions
  login: (wallet = null) => set({ isAuthenticated: true, walletAddress: wallet, userRole: 'Lead Security Architect' }),
  logout: () => set({ isAuthenticated: false, userRole: null, walletAddress: null, latestScanResult: null }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setActiveSubTab: (tab) => set({ activeSubTab: tab }),
  setProjectContext: (name) => set({ activeProjectContext: name }),

  // Scan Pipeline
  startScanPipeline: () => set({ isScanLoading: true }),
  commitScanSuccess: (payload) => set({ latestScanResult: payload, isScanLoading: false }),
  commitScanFailure: () => set({ isScanLoading: false }),
  syncAuditHistory: (history) => set({ auditHistoryList: history }),
}));

export default useStore;
