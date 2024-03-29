export const ThresholdL2WormholeGateway = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint16',
        name: 'chainId',
        type: 'uint16',
      },
      {
        indexed: false,
        internalType: 'bytes32',
        name: 'gateway',
        type: 'bytes32',
      },
    ],
    name: 'GatewayAddressUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'uint8', name: 'version', type: 'uint8' },
    ],
    name: 'Initialized',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'mintingLimit',
        type: 'uint256',
      },
    ],
    name: 'MintingLimitUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'previousOwner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'depositor',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'WormholeTbtcDeposited',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'receiver',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'WormholeTbtcReceived',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint16',
        name: 'recipientChain',
        type: 'uint16',
      },
      {
        indexed: false,
        internalType: 'bytes32',
        name: 'gateway',
        type: 'bytes32',
      },
      {
        indexed: false,
        internalType: 'bytes32',
        name: 'recipient',
        type: 'bytes32',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'arbiterFee',
        type: 'uint256',
      },
      { indexed: false, internalType: 'uint32', name: 'nonce', type: 'uint32' },
    ],
    name: 'WormholeTbtcSent',
    type: 'event',
  },
  {
    inputs: [],
    name: 'bridge',
    outputs: [
      {
        internalType: 'contract IWormholeTokenBridge',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'bridgeToken',
    outputs: [
      { internalType: 'contract IERC20Upgradeable', name: '', type: 'address' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'amount', type: 'uint256' }],
    name: 'depositWormholeTbtc',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: '_address', type: 'bytes32' }],
    name: 'fromWormholeAddress',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint16', name: '', type: 'uint16' }],
    name: 'gateways',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'contract IWormholeTokenBridge',
        name: '_bridge',
        type: 'address',
      },
      {
        internalType: 'contract IERC20Upgradeable',
        name: '_bridgeToken',
        type: 'address',
      },
      { internalType: 'contract L2TBTC', name: '_tbtc', type: 'address' },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'mintedAmount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'mintingLimit',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes', name: 'encodedVm', type: 'bytes' }],
    name: 'receiveTbtc',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'uint16', name: 'recipientChain', type: 'uint16' },
      { internalType: 'bytes32', name: 'recipient', type: 'bytes32' },
      { internalType: 'uint256', name: 'arbiterFee', type: 'uint256' },
      { internalType: 'uint32', name: 'nonce', type: 'uint32' },
    ],
    name: 'sendTbtc',
    outputs: [{ internalType: 'uint64', name: '', type: 'uint64' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'tbtc',
    outputs: [{ internalType: 'contract L2TBTC', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_address', type: 'address' }],
    name: 'toWormholeAddress',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'newOwner', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint16', name: 'chainId', type: 'uint16' },
      { internalType: 'bytes32', name: 'gateway', type: 'bytes32' },
    ],
    name: 'updateGatewayAddress',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_mintingLimit', type: 'uint256' },
    ],
    name: 'updateMintingLimit',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];
