import { Idl } from '@project-serum/anchor';

export const WormholeGatewayIdl: Idl = {
  version: '0.1.0',
  name: 'wormhole_gateway',
  instructions: [
    {
      name: 'initialize',
      accounts: [
        {
          name: 'authority',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'custodian',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'tbtcMint',
          isMut: false,
          isSigner: false,
          docs: [
            "TBTC Program's mint PDA address bump is saved in this program's config. Ordinarily, we would",
            'not have to deserialize this account. But we do in this case to make sure the TBTC program',
            'has been initialized before this program.',
          ],
        },
        {
          name: 'wrappedTbtcMint',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'wrappedTbtcToken',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'tokenBridgeSender',
          isMut: false,
          isSigner: false,
          docs: [
            'sign for transferring via Token Bridge program with a message.',
          ],
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tokenProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'mintingLimit',
          type: 'u64',
        },
      ],
    },
    {
      name: 'changeAuthority',
      accounts: [
        {
          name: 'custodian',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'newAuthority',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: 'cancelAuthorityChange',
      accounts: [
        {
          name: 'custodian',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: false,
          isSigner: true,
        },
      ],
      args: [],
    },
    {
      name: 'takeAuthority',
      accounts: [
        {
          name: 'custodian',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'pendingAuthority',
          isMut: false,
          isSigner: true,
        },
      ],
      args: [],
    },
    {
      name: 'updateGatewayAddress',
      accounts: [
        {
          name: 'custodian',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'gatewayInfo',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'args',
          type: {
            defined: 'UpdateGatewayAddressArgs',
          },
        },
      ],
    },
    {
      name: 'updateMintingLimit',
      accounts: [
        {
          name: 'custodian',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: false,
          isSigner: true,
        },
      ],
      args: [
        {
          name: 'newLimit',
          type: 'u64',
        },
      ],
    },
    {
      name: 'receiveTbtc',
      accounts: [
        {
          name: 'payer',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'custodian',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'postedVaa',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tokenBridgeClaim',
          isMut: true,
          isSigner: false,
          docs: [
            'transfer. By checking whether this account exists is a short-circuit way of bailing out',
            'early if this transfer has already been redeemed (as opposed to letting the Token Bridge',
            'instruction fail).',
          ],
        },
        {
          name: 'wrappedTbtcToken',
          isMut: true,
          isSigner: false,
          docs: ['Custody account.'],
        },
        {
          name: 'wrappedTbtcMint',
          isMut: true,
          isSigner: false,
          docs: [
            'This mint is owned by the Wormhole Token Bridge program. This PDA address is stored in the',
            'custodian account.',
          ],
        },
        {
          name: 'tbtcMint',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'recipientToken',
          isMut: true,
          isSigner: false,
          docs: [
            'Token account for minted tBTC.',
            '',
            'NOTE: Because the recipient is encoded in the transfer message payload, we can check the',
            'authority from the deserialized VAA. But we should still check whether the authority is the',
            'zero address in access control.',
          ],
        },
        {
          name: 'recipient',
          isMut: false,
          isSigner: false,
          docs: ['be created for him.'],
        },
        {
          name: 'recipientWrappedToken',
          isMut: true,
          isSigner: false,
          docs: [
            "The gateway will create an associated token account for the recipient if it doesn't exist.",
            '',
            'NOTE: When the minting limit increases, the recipient can use this token account to mint',
            'tBTC using the deposit_wormhole_tbtc instruction.',
          ],
        },
        {
          name: 'tbtcConfig',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tbtcMinterInfo',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tokenBridgeConfig',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tokenBridgeRegisteredEmitter',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tokenBridgeWrappedAsset',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tokenBridgeMintAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'rent',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tbtcProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tokenBridgeProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'coreBridgeProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'associatedTokenProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tokenProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'messageHash',
          type: {
            array: ['u8', 32],
          },
        },
      ],
    },
    {
      name: 'sendTbtcGateway',
      accounts: [
        {
          name: 'custodian',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'gatewayInfo',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'wrappedTbtcToken',
          isMut: true,
          isSigner: false,
          docs: ['Custody account.'],
        },
        {
          name: 'wrappedTbtcMint',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'tbtcMint',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'senderToken',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'sender',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'tokenBridgeConfig',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tokenBridgeWrappedAsset',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tokenBridgeTransferAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'coreBridgeData',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'coreMessage',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'tokenBridgeCoreEmitter',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'coreEmitterSequence',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'coreFeeCollector',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'clock',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tokenBridgeSender',
          isMut: false,
          isSigner: false,
          docs: [
            'sign for transferring via Token Bridge program with a message.',
          ],
        },
        {
          name: 'rent',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tokenBridgeProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'coreBridgeProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tokenProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'args',
          type: {
            defined: 'SendTbtcGatewayArgs',
          },
        },
      ],
    },
    {
      name: 'sendTbtcWrapped',
      accounts: [
        {
          name: 'custodian',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'wrappedTbtcToken',
          isMut: true,
          isSigner: false,
          docs: ['Custody account.'],
        },
        {
          name: 'wrappedTbtcMint',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'tbtcMint',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'senderToken',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'sender',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'tokenBridgeConfig',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tokenBridgeWrappedAsset',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tokenBridgeTransferAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'coreBridgeData',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'coreMessage',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'tokenBridgeCoreEmitter',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'coreEmitterSequence',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'coreFeeCollector',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'clock',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'rent',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tokenBridgeProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'coreBridgeProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tokenProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'args',
          type: {
            defined: 'SendTbtcWrappedArgs',
          },
        },
      ],
    },
    {
      name: 'depositWormholeTbtc',
      accounts: [
        {
          name: 'custodian',
          isMut: true,
          isSigner: false,
          docs: [
            'NOTE: This account also acts as a minter for the TBTC program.',
          ],
        },
        {
          name: 'wrappedTbtcToken',
          isMut: true,
          isSigner: false,
          docs: [
            'This token account is owned by this program, whose mint is the wrapped TBTC mint. This PDA',
            'address is stored in the custodian account.',
          ],
        },
        {
          name: 'wrappedTbtcMint',
          isMut: false,
          isSigner: false,
          docs: [
            'This mint is owned by the Wormhole Token Bridge program. This PDA address is stored in the',
            'custodian account.',
          ],
        },
        {
          name: 'tbtcMint',
          isMut: true,
          isSigner: false,
          docs: [
            'This mint is owned by the TBTC program. This PDA address is stored in the custodian account.',
          ],
        },
        {
          name: 'recipientWrappedToken',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'recipientToken',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'recipient',
          isMut: false,
          isSigner: true,
          docs: [
            'This program requires that the owner of the TBTC token account sign for TBTC being minted',
            'into his account.',
          ],
        },
        {
          name: 'tbtcConfig',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tbtcMinterInfo',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tokenProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tbtcProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'amount',
          type: 'u64',
        },
      ],
    },
  ],
  accounts: [
    {
      name: 'Custodian',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'bump',
            type: 'u8',
          },
          {
            name: 'authority',
            type: 'publicKey',
          },
          {
            name: 'pendingAuthority',
            type: {
              option: 'publicKey',
            },
          },
          {
            name: 'tbtcMint',
            type: 'publicKey',
          },
          {
            name: 'wrappedTbtcMint',
            type: 'publicKey',
          },
          {
            name: 'wrappedTbtcToken',
            type: 'publicKey',
          },
          {
            name: 'tokenBridgeSender',
            type: 'publicKey',
          },
          {
            name: 'tokenBridgeSenderBump',
            type: 'u8',
          },
          {
            name: 'mintingLimit',
            type: 'u64',
          },
          {
            name: 'mintedAmount',
            type: 'u64',
          },
        ],
      },
    },
    {
      name: 'GatewayInfo',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'bump',
            type: 'u8',
          },
          {
            name: 'address',
            type: {
              array: ['u8', 32],
            },
          },
        ],
      },
    },
  ],
  types: [
    {
      name: 'UpdateGatewayAddressArgs',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'chain',
            type: 'u16',
          },
          {
            name: 'address',
            type: {
              array: ['u8', 32],
            },
          },
        ],
      },
    },
    {
      name: 'SendTbtcGatewayArgs',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'amount',
            type: 'u64',
          },
          {
            name: 'recipientChain',
            type: 'u16',
          },
          {
            name: 'recipient',
            type: {
              array: ['u8', 32],
            },
          },
          {
            name: 'nonce',
            type: 'u32',
          },
        ],
      },
    },
    {
      name: 'SendTbtcWrappedArgs',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'amount',
            type: 'u64',
          },
          {
            name: 'recipientChain',
            type: 'u16',
          },
          {
            name: 'recipient',
            type: {
              array: ['u8', 32],
            },
          },
          {
            name: 'arbiterFee',
            type: 'u64',
          },
          {
            name: 'nonce',
            type: 'u32',
          },
        ],
      },
    },
  ],
  events: [
    {
      name: 'WormholeTbtcReceived',
      fields: [
        {
          name: 'receiver',
          type: 'publicKey',
          index: false,
        },
        {
          name: 'amount',
          type: 'u64',
          index: false,
        },
      ],
    },
    {
      name: 'WormholeTbtcSent',
      fields: [
        {
          name: 'amount',
          type: 'u64',
          index: false,
        },
        {
          name: 'recipientChain',
          type: 'u16',
          index: false,
        },
        {
          name: 'gateway',
          type: {
            array: ['u8', 32],
          },
          index: false,
        },
        {
          name: 'recipient',
          type: {
            array: ['u8', 32],
          },
          index: false,
        },
        {
          name: 'arbiterFee',
          type: 'u64',
          index: false,
        },
        {
          name: 'nonce',
          type: 'u32',
          index: false,
        },
      ],
    },
    {
      name: 'WormholeTbtcDeposited',
      fields: [
        {
          name: 'depositor',
          type: 'publicKey',
          index: false,
        },
        {
          name: 'amount',
          type: 'u64',
          index: false,
        },
      ],
    },
    {
      name: 'GatewayAddressUpdated',
      fields: [
        {
          name: 'chain',
          type: 'u16',
          index: false,
        },
        {
          name: 'gateway',
          type: {
            array: ['u8', 32],
          },
          index: false,
        },
      ],
    },
    {
      name: 'MintingLimitUpdated',
      fields: [
        {
          name: 'mintingLimit',
          type: 'u64',
          index: false,
        },
      ],
    },
  ],
  errors: [
    {
      code: 6016,
      name: 'MintingLimitExceeded',
      msg: 'Cannot mint more than the minting limit',
    },
    {
      code: 6032,
      name: 'IsNotAuthority',
      msg: 'Only custodian authority is permitted for this action',
    },
    {
      code: 6034,
      name: 'IsNotPendingAuthority',
      msg: 'Not valid pending authority to take authority',
    },
    {
      code: 6036,
      name: 'NoPendingAuthorityChange',
      msg: 'No pending authority',
    },
    {
      code: 6048,
      name: 'ZeroRecipient',
      msg: '0x0 recipient not allowed',
    },
    {
      code: 6064,
      name: 'NotEnoughWrappedTbtc',
      msg: 'Not enough wormhole tBTC in the gateway to bridge',
    },
    {
      code: 6080,
      name: 'ZeroAmount',
      msg: 'Amount must not be 0',
    },
    {
      code: 6112,
      name: 'TransferAlreadyRedeemed',
      msg: 'Token Bridge transfer already redeemed',
    },
    {
      code: 6128,
      name: 'InvalidEthereumTbtc',
      msg: "Token chain and address do not match Ethereum's tBTC",
    },
    {
      code: 6144,
      name: 'NoTbtcTransferred',
      msg: 'No tBTC transferred',
    },
    {
      code: 6160,
      name: 'RecipientZeroAddress',
      msg: '0x0 receiver not allowed',
    },
    {
      code: 6176,
      name: 'MintedAmountUnderflow',
      msg: 'Not enough minted by the gateway to satisfy sending tBTC',
    },
    {
      code: 6178,
      name: 'MintedAmountOverflow',
      msg: 'Minted amount after deposit exceeds u64',
    },
  ],
};
