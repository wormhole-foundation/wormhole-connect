export const HashflowAbi = {
  inputs: [
    {
      components: [
        {
          internalType: 'address',
          name: 'pool',
          type: 'address',
        },
        {
          internalType: 'address',
          name: 'externalAccount',
          type: 'address',
        },
        {
          internalType: 'address',
          name: 'trader',
          type: 'address',
        },
        {
          internalType: 'address',
          name: 'effectiveTrader',
          type: 'address',
        },
        {
          internalType: 'address',
          name: 'baseToken',
          type: 'address',
        },
        {
          internalType: 'address',
          name: 'quoteToken',
          type: 'address',
        },
        {
          internalType: 'uint256',
          name: 'effectiveBaseTokenAmount',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'maxBaseTokenAmount',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'maxQuoteTokenAmount',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'quoteExpiry',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'nonce',
          type: 'uint256',
        },
        {
          internalType: 'bytes32',
          name: 'txid',
          type: 'bytes32',
        },
        {
          internalType: 'bytes',
          name: 'signature',
          type: 'bytes',
        },
      ],
      internalType: 'struct IQuote.RFQTQuote',
      name: 'quote',
      type: 'tuple',
    },
  ],
  name: 'tradeSingleHop',
  outputs: [],
  stateMutability: 'payable',
  type: 'function',
};
