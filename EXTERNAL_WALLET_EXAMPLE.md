# External Wallet Management Example

This example shows how to use the External Wallet Manager interface to integrate Wormhole Connect with your own wallet management system.

## Basic Implementation

```typescript
import WormholeConnect, { ExternalWalletManager, WalletType, ExternalWalletState, TransactionRequest } from '@wormhole-foundation/wormhole-connect';

// Implement the external wallet manager interface
const externalWalletManager: ExternalWalletManager = {
  // Get current wallet state
  getWalletState: async (type: WalletType): Promise<ExternalWalletState> => {
    const wallet = myWalletManager.getWallet(type);
    return {
      isConnected: wallet.isConnected(),
      address: wallet.getAddress(),
      chainId: wallet.getChainId(),
      walletName: wallet.getName(),
      walletIcon: wallet.getIcon()
    };
  },

  // Handle connection requests from Connect
  requestConnection: async (type: WalletType, chain: Chain): Promise<boolean> => {
    try {
      await myWalletManager.connectWallet(type, chain);
      return true;
    } catch (error) {
      console.error('Connection failed:', error);
      return false;
    }
  },

  // Handle disconnection requests from Connect
  requestDisconnection: async (type: WalletType): Promise<void> => {
    await myWalletManager.disconnectWallet(type);
  },

  // Handle transaction signing requests from Connect
  signAndSendTransaction: async (params: TransactionRequest): Promise<string> => {
    const { chain, transaction, walletType } = params;
    const wallet = myWalletManager.getWallet(walletType);
    return await wallet.signAndSendTransaction(transaction);
  },

  // Optional: Handle wallet requirement notifications
  onWalletRequired: (type: WalletType, chain: Chain) => {
    // Show your wallet connection UI
    myWalletManager.showConnectionDialog(type, chain);
  },

  // Optional: Handle chain switch requirements
  onChainSwitchRequired: (type: WalletType, chain: Chain) => {
    // Handle chain switching in your wallet
    myWalletManager.switchChain(type, chain);
  },

  // Register callback for wallet state changes
  onWalletStateChanged: (callback: WalletStateChangeCallback) => {
    // Register Connect's callback to be notified of wallet state changes
    myWalletManager.onStateChange((type, state) => {
      callback(type, {
        isConnected: state.isConnected,
        address: state.address,
        chainId: state.chainId,
        walletName: state.walletName,
        walletIcon: state.walletIcon
      });
    });
  },

  // Optional: Handle wallet swapping (when user clicks swap button)
  swapWallets: async () => {
    await myWalletManager.swapWallets();
  }
};

// Configure Connect with external wallet management
const App = () => {
  return (
    <WormholeConnect 
      config={{
        // Enable external wallet management
        externalWalletManager,
        
        // Other config options...
        network: 'Mainnet',
        chains: ['Ethereum', 'Solana'],
        tokens: ['ETH', 'USDC', 'SOL']
      }}
    />
  );
};
```

## Key Points

1. **Full Control**: Your app maintains complete control over wallet management
2. **Unified UX**: Users see your wallet UI/flows, not Connect's wallet selection
3. **State Sync**: Connect automatically stays in sync with your wallet state changes
4. **Flexible**: You can still use Connect's internal wallet management if preferred
5. **Backward Compatible**: Existing integrations continue working unchanged

## Interface Methods

### Required Methods

- `getWalletState(type)` - Returns current wallet state
- `requestConnection(type, chain)` - Connect wallet for a specific chain
- `requestDisconnection(type)` - Disconnect wallet
- `signAndSendTransaction(params)` - Sign and send transactions

### Optional Methods

- `onWalletRequired(type, chain)` - Notification when Connect needs a wallet
- `onChainSwitchRequired(type, chain)` - Notification when chain switch is needed  
- `onWalletStateChanged(callback)` - Register for wallet state change notifications
- `swapWallets()` - Handle wallet swapping when user clicks swap button

## Configuration Options

- `externalWalletManager` - Your wallet manager implementation (internal wallets are automatically disabled when this is provided)

This allows you to provide a seamless bridging experience while maintaining full control over wallet interactions.