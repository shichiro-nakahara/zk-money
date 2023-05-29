import '@rainbow-me/rainbowkit/styles.css';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import { metaMaskWallet, walletConnectWallet, braveWallet } from '@rainbow-me/rainbowkit/wallets';

import { configureChains, createClient, Chain } from 'wagmi';
import { polygon, polygonMumbai, localhost } from 'wagmi/chains';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';
import type { Config } from '../config.js';

function getChain(config: Config): Chain {
  switch (config.chainId) {
    case 8008:
      return {
        id: 8008,
        name: 'Localhost 8544',
        network: 'localhost',
        nativeCurrency: {
          decimals: 18,
          name: 'MATIC',
          symbol: 'MATIC',
        },
        rpcUrls: {
          default: { http: ['http://127.0.0.1:8544'] },
          public: { http: ['http://127.0.0.1:8544'] },
        },
      };
    case 1337:
      return { ...localhost, id: config.chainId };
    case 80001:
      return polygonMumbai;
    default:
      throw new Error(`Unknown chainId: ${config.chainId}`);
  }
}

function getPublicProvider(config: Config) {
  try {
    return jsonRpcProvider({ rpc: () => ({ http: config.ethereumHost }) });
  } catch (e) {
    throw new Error('Could not determine publicProvider');
  }
}

export function getWagmiRainbowConfig(config: Config) {
  const { chains, provider, webSocketProvider } = configureChains([getChain(config)], [getPublicProvider(config)]);

  const wallets = [metaMaskWallet({ chains }), walletConnectWallet({ chains }), braveWallet({ chains })];
  const connectors = connectorsForWallets([{ groupName: 'Supported', wallets }]);
  const wagmiClient = createClient({
    autoConnect: true,
    connectors,
    provider,
    webSocketProvider,
  });
  return { wagmiClient, chains };
}
