/** @type {import('tailwindcss').Config} */
// SolShield Pro — Design System Tokens
// Single source of truth for the Nessus-inspired enterprise palette.
// Every component derives color from these names; no raw hex in JSX.
export default {
 content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
 theme: {
 extend: {
 colors: {
 // --- Core surfaces (deep navy, not near-black) ---
 canvas: '#0A1628', // app background
 surface: '#0D2137', // cards / panels
 'surface-raised': '#10294A', // hover / nested panels
 'surface-inset': '#081222', // code wells, table headers
 // --- Accent (used with restraint) ---
 'cyber-primary': '#00D4FF',
 'cyber-primary-dim': 'rgba(0,212,255,0.12)',
 // --- Severity scale (enterprise, muted — not neon) ---
 critical: '#FF3B5C',
 high: '#FF8A3D',
 medium: '#F5C451',
 low: '#00D4FF',
 'cyber-success': '#2ED47A',
 // --- Text ---
 'text-primary': '#F4F7FB',
 'text-muted': '#7C92AD',
 'text-faint': '#3A5070',
 },
 borderColor: {
 DEFAULT: 'rgba(255,255,255,0.07)',
 hairline: 'rgba(255,255,255,0.07)',
 accent: 'rgba(0,212,255,0.30)',
 },
 fontFamily: {
 sans: ['Inter', 'system-ui', 'sans-serif'],
 mono: ['"JetBrains Mono"', '"SF Mono"', 'monospace'],
 },
 boxShadow: {
 neon: '0 0 18px rgba(0,212,255,0.25)',
 'card': '0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.35)',
 'critical-glow': '0 0 20px rgba(255,59,92,0.18)',
 },
 keyframes: {
 'fade-up': {
 '0%': { opacity: '0', transform: 'translateY(8px)' },
 '100%': { opacity: '1', transform: 'translateY(0)' },
 },
 },
 animation: {
 'fade-up': 'fade-up 0.4s cubic-bezier(0.16,1,0.3,1) both',
 },
 },
 },
 plugins: [],
};