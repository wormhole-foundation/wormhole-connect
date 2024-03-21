import React from 'react';
import ReactDOM from 'react-dom/client';
import WormholeConnect from './WormholeConnect';
import ErrorBoundary from './components/ErrorBoundary';
export * from './theme';

// This is the demo app used for local development

function DemoApp() {
  return (
    <WormholeConnect
      config={{
        networks: ['ethereum', 'solana'],
        env: 'mainnet',
        tokensConfig: {
          ZOOMER: {
            key: 'ZOOMER',
            symbol: 'ZOOMER',
            nativeChain: 'ethereum',
            tokenId: {
              chain: 'ethereum',
              address: '0x0D505C03d30e65f6e9b4Ef88855a47a89e4b7676',
            },
            coinGeckoId: 'zoomer',
            icon: 'https://assets.coingecko.com/coins/images/30894/large/zoooooooooomer.jpg?1696529740',
            color: '#FEFC52',
            decimals: {
              Solana: 8,
              default: 18,
            },
            foreignAssets: {
              solana: {
                address: 'nBZEcHSG771mRbi4y2sSgKjfDUH8jsM2Eo5fNcASLeU',
                decimals: 8,
              },
            },
          },
        },
        rpcs: {
          solana:
            'https://mainnet.helius-rpc.com/?api-key=a769a00e-2047-4cf5-bd06-60535321aadc',
        },
      }}
    />
  );
}

const root = ReactDOM.createRoot(document.querySelector('main') as HTMLElement);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <DemoApp />
    </ErrorBoundary>
  </React.StrictMode>,
);
