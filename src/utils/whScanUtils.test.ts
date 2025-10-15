import type { WormholeScanTransaction } from 'hooks/useTransactionHistoryWHScan';
import { describe, it, expect } from 'vitest';
import { isPortalBridgeAttestationTx } from './whScanUtils';

const ATTESTATION_TX: WormholeScanTransaction = {
  id: '6/0000000000000000000000000e082f06ff657d94310cb8ce8b0d9a04541d8052/234714',
  emitterChain: 6,
  emitterAddress: {
    hex: '0000000000000000000000000e082f06ff657d94310cb8ce8b0d9a04541d8052',
    native: '0x0e082f06ff657d94310cb8ce8b0d9a04541d8052',
  },
  sequence: '234714',
  vaa: {
    raw: 'AQAAAAQNAMCetgiX3D0qSyIjsugh+/im3MjtgI1YHAyDCuSVFwEWRztR3oiJp8W5rLUg0SZ9FvJebN64EMRCQl/1DpGztk0BAQqaNiplrnEh3sScdjqQkChlMEH4U4t8Hr8Xct19pzo1dOiibO0wsCqQ85mjOrlLnxl+PHTRk1I/aehOZLxFuzUAAvS0TqY5NQlElOJwKFZvG0oBgfxak/8MNaZcTNeAGxFCcMrZDvWqU4xfjZWnoNso5XJ8Q+ksS+l0ohwK/dU2IWsAAxaNikxICx8ZG8NUuB5tWR18kLprgwJotRwGIMKywHB6NDye1iw7HC/L3Jp312MOr/gIfgXz9Ikp/8/J0HXk06QBBB/HuP7jEEUUFpkonOmP9/f+gANzwWhcsqjtVpyLgRq4Pq8W+5R6mNX9sh3vEsoZCE1Q4zngea8Tv3+3EQVEYAUABscOpiXtlhuWEJFnsIYUCRKjgiRVkMjP2x6QgEv3gvYlO+7zTA6IU9R/PUQFpN/2jC0e6OYHTiY6NgAwvbbbsvAAB0VlWaUW/kHr4LxCgcksIkOA1QRarydsa3jbeDbTeZ5wf308RKLnBW3bKvuSWNnb+MKKSiBCp3bxiFfIJxBeiyEACBkppzrHrqgvd+HWyCxpVGd5xNszZ7jU/5vICGqjsDnWewz3RjwU2S3K6a1Ug3TzIqpwpoD5Ok835nr+38vuOicACv1s3xjYRip7YeZkJ8Hnf4w21DdDuLq2A08AikvG3r/kcALGFI7uYlajSve6INtoNuxrJ/mytMB2zF6hUwrJGxUACxO/7tTVpR17b3+V7n8tTTuMlEL6zluWnSrciNx5bWYeP+2q0aVLbRWNu+fnYoY/Q5dx1BxREd4ae1cjLWDgWNYADs5XbdhtaGbdaQzG9EHc6si9WFmJHEn9FBW8qKTEyJ7CVR/4MzkNQ50PDeZB6tms8xcm3qs0Z+3oMvlB2gjXHLoAD5LOtR9Q2+z2nMZowjv330hFi24Bi/UoNjjWA/8SrbhrUdv7kzS0h4+Oc5/5FZmL0jvPi1LaP+Lo0zh/y99XU0EAEpQywr/nNWkpj3UaFAwwgT5w17t6W8r4Z5QgtInewtyGR4DM92QTs1tVkrrF9CtPDFugToUBMzWfcBSB0YO/YwQBaNVxTwAAAAAABgAAAAAAAAAAAAAAAA4ILwb/ZX2UMQy4zosNmgRUHYBSAAAAAAADlNoBAgAAAAAAAAAAAAAAALMfZqo8HnhTY/CHWht04nuF/WbHAAYSV0FWQVgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABXcmFwcGVkIEFWQVgAAAAAAAAAAAAAAAAAAAAAAAAAAA==',
    guardianSetIndex: 4,
    isDuplicated: false,
  },
  content: {
    payload: {
      xname: 'Wrapped AVAX',
      payloadType: 2,
      symbol: 'WAVAX',
      tokenAddress:
        '0x000000000000000000000000b31f66aa3c1e785363f0875a1b74e27b85fd66c7',
      tokenChain: 6,
    },
    standarizedProperties: {
      appIds: ['PORTAL_TOKEN_BRIDGE'],
      fromChain: 6,
      fromAddress:
        '0x0000000000000000000000000e082f06ff657d94310cb8ce8b0d9a04541d8052',
      toChain: 0,
      toAddress: '',
      tokenChain: 6,
      tokenAddress: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
      amount: '',
      feeAddress: '',
      feeChain: 0,
      fee: '',
      normalizedDecimals: null,
    },
    executorRequest: null,
  },
  sourceChain: {
    chainId: 6,
    timestamp: '2025-09-25T16:43:59Z',
    transaction: {
      txHash:
        '0x6dca8e10a616ad8b7e23c964465862c7325210e1ce640c2d9fc6e3619f01e4bd',
    },
    from: '0x49887a216375fded17dc1aaad4920c3777265614',
    status: 'confirmed',
    fee: '0.0001176242835278',
    gasTokenNotional: '29.78',
    feeUSD: '0.003502851163457884',
  },
} as unknown as WormholeScanTransaction;

const NORMAL_TX: WormholeScanTransaction = {
  id: '2/00000000000000000000000092e0080400ca3387670fba50584a4b8ef37bbf12/6',
  emitterChain: 2,
  emitterAddress: {
    hex: '00000000000000000000000092e0080400ca3387670fba50584a4b8ef37bbf12',
    native: '0x92e0080400ca3387670fba50584a4b8ef37bbf12',
  },
  sequence: '6',
  vaa: {
    raw: 'AQAAAAQNAPpjEdzEkAjoABS0rEpBceAY2qvXM2XYWnU2bkfQGvjgRKMdfESPD4edKMqvrMrb4Xd7RyJQfHPFWLAHBAX2O4IBAaGNTUcQBEnSkTcMFQV2YXtc7ZVLrXLIwrNh0s2LOqQVA8fm4owudRmgfiSmYmIZb7pBo+7tZ5Z/CUPslJ+1meMAAzlaO+x5BghUWslGBVLBWad9GDWmrRL7fTM/dXDv4Ok8XqI7KhYIynw0lHhZt0Mdxno+B08PEAFKzX5i5R4ujUIABnZQMAQoJb89BaQesV7RT0EgJheaukb3AYeVNcSPvNXXLVfni4mIC5oFqXTv423maAZ28KyYwg0V02NwZthbmDwAB+DDHA1M/Wg+ea10LeEnz3sDruoa/y3CQ2NegQS7xFPcG9IOVNF9+RiuHb1MYBRaIrquYkqnPp+fUUbnUeQvMCYBCDTe2lXQ9cFnJNYMMukW9SmimyWbwXUjGoM2G68fJTsLW2va78xm+AcaEnyZE/a+p4Mw3Gs6bpi6qNMRPfZADy0BCUCe2cApgPuJseBs/VyScBoAwK05jWWp0YxJuLopnCx4OPOQz3AC7FyCqZLoPm1URnw9cJe3XC9AaW7ZCtJwnLgBCqGs3+H4fKWH4nUYXG/xA1/nd9EQiTD0kozPHdDmb13rLGiHa30LE8SpFK9kTMhVxh2c4Tx3Kkdtw6rjMDc94ekADdhIcSejXiIiYB5Ed3QkigOQff54AX90dARk41/QOBNhQXm8VE+RuH/uCAzDDkfvbbbZXyhy6UL00tVLTXuP5sIADgAQcXJGQwWSIV7djbD87uICIw7nLBroEGz6fQbJ9H3+WPWX8RxhfVGwmIokvEO5SuAK9osV8OFMcSJC87ZF7OMBD3ypXv29BnDTIEqWBDJTQJJs2KlrlLW8BoqBOph/nJrEWmz9ejyz+OBNhQ/XjPbzcasLLD1MjpA1/RMSP85lMcIBEAUb/5yNu7wVGC2anhB+J143AgePbasT8E+/iJzH6+TUI3vh0U5oqLBfG70GI7bzdpQLMxecsZsJXR7PK1scSzYAET/oDAWks4TDkmmlJyoZxb9+xbiFDy4YHcTy6LJbg/aeEbilM8f4+2hfyCST3xZOHkTEYXeGz7bXxg1aPfHhfnsAaNReqwAAAAAAAgAAAAAAAAAAAAAAAJLgCAQAyjOHZw+6UFhKS47ze78SAAAAAAAAAAbKmUX/EAAAAAAAAAAAAAAAAP65QSCOef/wYbjrZwzEW1Dd9fpkAAAAAAAAAAAAAAAABiXQUG2mgoA41EhcanlPIz5wB8oAkQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAA0tnJNhZahfJ6Wn4Hr7l00CK4lGMAT5lOVFQGAAAAAAAPQkAAAAAAAAAAAAAAAACguGmRxiGLNsHRnUounrDONgbrSAAAAAAAAAAAAAAAAEmIeiFjdf3tF9waqtSSDDd3JlYUADkAAA==',
    guardianSetIndex: 4,
    isDuplicated: false,
  },
  content: {
    payload: {
      nttManagerMessage: {
        id: '0000000000000000000000000000000000000000000000000000000000000004',
        sender:
          '0x000000000000000000000000d2d9c936165a85f27a5a7e07afb974d022b89463',
      },
      nttMessage: {
        additionalPayload: '',
        sourceToken:
          '0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        to: '0x00000000000000000000000049887a216375fded17dc1aaad4920c3777265614',
        toChain: 57,
        trimmedAmount: {
          amount: '1000000',
          decimals: 6,
        },
      },
      transceiverMessage: {
        prefix: '9945ff10',
        recipientNttManager:
          '0x0000000000000000000000000625d0506da6828038d4485c6a794f233e7007ca',
        sourceNttManager:
          '0x000000000000000000000000feb941208e79fff061b8eb670cc45b50ddf5fa64',
        transceiverPayload: '',
      },
    },
    standarizedProperties: {
      appIds: ['NATIVE_TOKEN_TRANSFER', 'MESSAGING_EXECUTOR'],
      fromChain: 2,
      fromAddress: '0xD2D9c936165a85F27a5a7e07aFb974D022B89463',
      toChain: 57,
      toAddress: '0x49887A216375FDED17DC1aAAD4920c3777265614',
      tokenChain: 2,
      tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      amount: '100000000',
      feeAddress: '0xD2D9c936165a85F27a5a7e07aFb974D022B89463',
      feeChain: 2,
      fee: '',
      normalizedDecimals: 6,
    },
    executorRequest: {
      event_index: 0,
      type: 'ERN1',
      amount_paid: '121966135403149',
      amount_paid_usd: '0.50868172',
      to_chain_id: 57,
      to_address:
        '0x0000000000000000000000000625d0506da6828038d4485c6a794f233e7007ca',
      refund_address: '0x49887A216375FDED17DC1aAAD4920c3777265614',
      sender_address: '0x49887a216375fded17dc1aaad4920c3777265614',
      request: {
        messageId:
          '0000000000000000000000000000000000000000000000000000000000000004',
        prefix: 'ERN1',
        sourceChain: 'Ethereum',
        sourceManager:
          '0x000000000000000000000000feb941208e79fff061b8eb670cc45b50ddf5fa64',
      },
      instructions: [
        {
          gasLimit: '500000',
          msgValue: '0',
          type: 'gas',
        },
      ],
      signedQuote: {
        baseFee: '240564',
        dstChain: 57,
        dstGasPrice: '275000000000',
        dstPrice: '29600000000',
        expiryTime: '1758750266',
        payeeAddress:
          '0x0000000000000000000000006a8bfc410a3cc7306d52872f116afb12f1cec6c6',
        prefix: 'EQ01',
        quoterAddress: '0xa54008017941ece968623a0dd8ee907e2b133596',
        signature:
          '0x12cdb09f2f1f73ffcab94be4d78378688871d6e7958d7aab8b07b2d3b291b81b4b3c9329e4311294f72444bbf41c807a3b420c976e4fd68a97ba6dcb2ecc862d1c',
        srcChain: 2,
        srcPrice: '41568900000000',
      },
    },
  },
  sourceChain: {
    chainId: 2,
    timestamp: '2025-09-24T21:12:11Z',
    transaction: {
      txHash:
        '0x063cffcebed8bba6bac7f43a352583d44ff0d3b3f4ae798abdefbac50ad06090',
    },
    from: '0x49887a216375fded17dc1aaad4920c3777265614',
    status: 'confirmed',
    fee: '0.000297472485766126',
    gasTokenNotional: '4169.09',
    feeUSD: '1.24018956568269824534',
  },
} as unknown as WormholeScanTransaction;

describe('isPortalBridgeAttestationTx', () => {
  it('should return "true" for an attestation tx', () => {
    expect(isPortalBridgeAttestationTx(ATTESTATION_TX)).toBeTruthy();
  });

  it('should return "false" for a non-attestation tx', () => {
    expect(isPortalBridgeAttestationTx(NORMAL_TX)).toBeFalsy();
  });
});
