export const MayanForwarderShimContractABI = [
  {
    inputs: [
      { internalType: 'address', name: '_mayanForwarder', type: 'address' },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'amountIn', type: 'uint256' },
      { internalType: 'uint256', name: 'fee', type: 'uint256' },
    ],
    name: 'FeeTooLarge',
    type: 'error',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'fee', type: 'uint256' }],
    name: 'FeeTransferFailed',
    type: 'error',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'refundAmount', type: 'uint256' },
    ],
    name: 'RefundFailed',
    type: 'error',
  },
  {
    inputs: [],
    name: 'VERSION',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes', name: 'forwarderData', type: 'bytes' },
      { internalType: 'address', name: 'tokenIn', type: 'address' },
      { internalType: 'uint256', name: 'amountIn', type: 'uint256' },
      {
        components: [
          { internalType: 'uint256', name: 'fee', type: 'uint256' },
          { internalType: 'address', name: 'payee', type: 'address' },
        ],
        internalType: 'struct FeeArgs',
        name: 'feeArgs',
        type: 'tuple',
      },
    ],
    name: 'forwardERC20',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes', name: 'forwarderData', type: 'bytes' },
      {
        components: [
          { internalType: 'uint256', name: 'fee', type: 'uint256' },
          { internalType: 'address', name: 'payee', type: 'address' },
        ],
        internalType: 'struct FeeArgs',
        name: 'feeArgs',
        type: 'tuple',
      },
    ],
    name: 'forwardEth',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'mayanForwarder',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    stateMutability: 'payable',
    type: 'receive',
  },
];
