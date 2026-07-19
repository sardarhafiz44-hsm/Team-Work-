import React from 'react';
import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { mainnet, polygon, bsc, arbitrum, optimism } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

// Enterprise Multi-Chain Architecture Provisioning Matrix
const config = getDefaultConfig({
  appName: 'SolShield Pro',
  projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || 'c3a812b489d81d7729fca0c354e819b1', 
  chains: [mainnet, polygon, bsc, arbitrum, optimism],
  ssr: false,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function Web3Provider({ children }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          modalSize="compact"
          // Fixed: Standard native darkTheme mapping parameters without inner overrides properties leaks
          theme={darkTheme()}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}