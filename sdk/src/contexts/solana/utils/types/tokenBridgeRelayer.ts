export type TokenBridgeRelayer = {
  version: '0.1.0';
  name: 'token_bridge_relayer';
  constants: [
    {
      name: 'SEED_PREFIX_BRIDGED';
      type: 'bytes';
      value: '[98, 114, 105, 100, 103, 101, 100]';
    },
    {
      name: 'SEED_PREFIX_TMP';
      type: 'bytes';
      value: '[116, 109, 112]';
    },
    {
      name: 'SWAP_RATE_PRECISION';
      type: 'u32';
      value: '100_000_000';
    },
  ];
  instructions: [
    {
      name: 'initialize';
      docs: [
        "This instruction is be used to generate your program's config.",
        'And for convenience, we will store Wormhole-related PDAs in the',
        'config so we can verify these accounts with a simple == constraint.',
        '# Arguments',
        '',
        '* `ctx`           - `Initialize` context',
        '* `fee_recipient` - Recipient of all relayer fees and swap proceeds',
        '* `assistant`     - Privileged key to manage certain accounts',
      ];
      accounts: [
        {
          name: 'owner';
          isMut: true;
          isSigner: true;
          docs: ['Deployer of the program.'];
        },
        {
          name: 'senderConfig';
          isMut: true;
          isSigner: false;
          docs: [
            'Sender Config account, which saves program data useful for other',
            'instructions, specifically for outbound transfers. Also saves the payer',
            "of the [`initialize`](crate::initialize) instruction as the program's",
            'owner.',
          ];
        },
        {
          name: 'redeemerConfig';
          isMut: true;
          isSigner: false;
          docs: [
            'Redeemer Config account, which saves program data useful for other',
            'instructions, specifically for inbound transfers. Also saves the payer',
            "of the [`initialize`](crate::initialize) instruction as the program's",
            'owner.',
          ];
        },
        {
          name: 'ownerConfig';
          isMut: true;
          isSigner: false;
          docs: [
            'Owner config account, which saves the owner, assistant and',
            'pending owner keys. This account is used to manage the ownership of the',
            'program.',
          ];
        },
        {
          name: 'tokenBridgeEmitter';
          isMut: false;
          isSigner: false;
          docs: [
            'that holds data; it is purely just a signer for posting Wormhole',
            'messages on behalf of the Token Bridge program.',
          ];
        },
        {
          name: 'tokenBridgeSequence';
          isMut: false;
          isSigner: false;
          docs: [
            "Token Bridge emitter's sequence account. Like with all Wormhole",
            'emitters, this account keeps track of the sequence number of the last',
            'posted message.',
          ];
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
          docs: ['System program.'];
        },
        {
          name: 'programData';
          isMut: true;
          isSigner: false;
          docs: [
            'upgrade authority. We check this PDA address just in case there is another program that this',
            'deployer has deployed.',
            '',
            'NOTE: Set upgrade authority is scary because any public key can be used to set as the',
            'authority.',
          ];
        },
        {
          name: 'bpfLoaderUpgradeableProgram';
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: 'feeRecipient';
          type: 'publicKey';
        },
        {
          name: 'assistant';
          type: 'publicKey';
        },
      ];
    },
    {
      name: 'registerForeignContract';
      docs: [
        'This instruction registers a new foreign contract (from another',
        'network) and saves the emitter information in a ForeignEmitter account.',
        'This instruction is owner-only, meaning that only the owner of the',
        'program (defined in the [Config] account) can add and update foreign',
        'contracts.',
        '',
        '# Arguments',
        '',
        '* `ctx`     - `RegisterForeignContract` context',
        '* `chain`   - Wormhole Chain ID',
        '* `address` - Wormhole Emitter Address',
        '* `relayer_fee` - Relayer fee scaled by the `relayer_fee_precision`',
      ];
      accounts: [
        {
          name: 'owner';
          isMut: true;
          isSigner: true;
          docs: [
            'Owner of the program set in the [`SenderConfig`] account. Signer for',
            'creating [`ForeignContract`] account.',
          ];
        },
        {
          name: 'config';
          isMut: false;
          isSigner: false;
          docs: [
            'Sender Config account. This program requires that the `owner` specified',
            'in the context equals the pubkey specified in this account. Read-only.',
          ];
        },
        {
          name: 'foreignContract';
          isMut: true;
          isSigner: false;
          docs: [
            'Foreign Contract account. Create this account if an emitter has not been',
            'registered yet for this Wormhole chain ID. If there already is a',
            'contract address saved in this account, overwrite it.',
          ];
        },
        {
          name: 'tokenBridgeForeignEndpoint';
          isMut: false;
          isSigner: false;
          docs: [
            'Token Bridge foreign endpoint. This account should really be one',
            "endpoint per chain, but Token Bridge's PDA allows for multiple",
            'endpoints for each chain. We store the proper endpoint for the',
            'emitter chain.',
          ];
        },
        {
          name: 'tokenBridgeProgram';
          isMut: false;
          isSigner: false;
          docs: ['Token Bridge program.'];
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
          docs: ['System program.'];
        },
      ];
      args: [
        {
          name: 'chain';
          type: 'u16';
        },
        {
          name: 'address';
          type: {
            array: ['u8', 32];
          };
        },
        {
          name: 'relayerFee';
          type: 'u64';
        },
      ];
    },
    {
      name: 'registerToken';
      docs: [
        'This instruction registers a new token and saves the initial `swap_rate`',
        'and `max_native_token_amount` in a RegisteredToken account.',
        'This instruction is owner-only, meaning that only the owner of the',
        'program (defined in the [Config] account) can register a token.',
        '',
        '# Arguments',
        '',
        '* `ctx` - `RegisterToken` context',
        '* `swap_rate`:',
        '- USD conversion rate scaled by the `swap_rate_precision`. For example,',
        '- if the conversion rate is $15 and the `swap_rate_precision` is',
        '- 1000000, the `swap_rate` should be set to 15000000.',
        '* `max_native_swap_amount`:',
        '- Maximum amount of native tokens that can be swapped for this token',
        '- on this chain.',
      ];
      accounts: [
        {
          name: 'owner';
          isMut: true;
          isSigner: true;
          docs: [
            'Owner of the program set in the [`SenderConfig`] account. Signer for',
            'creating [`ForeignContract`] account.',
          ];
        },
        {
          name: 'config';
          isMut: false;
          isSigner: false;
          docs: [
            'Sender Config account. This program requires that the `owner` specified',
            'in the context equals the pubkey specified in this account. Read-only.',
          ];
        },
        {
          name: 'registeredToken';
          isMut: true;
          isSigner: false;
          docs: [
            'Registered Token account. This account stores information about the',
            'token, including the swap rate and max native swap amount. Create this',
            'account if the mint has not been registered yet. Mutable.',
          ];
        },
        {
          name: 'mint';
          isMut: false;
          isSigner: false;
          docs: [
            'Mint info. This is the SPL token that will be bridged over to the',
            'foreign contract.',
          ];
        },
        {
          name: 'tokenProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
          docs: ['System program.'];
        },
      ];
      args: [
        {
          name: 'swapRate';
          type: 'u64';
        },
        {
          name: 'maxNativeSwapAmount';
          type: 'u64';
        },
      ];
    },
    {
      name: 'deregisterToken';
      docs: [
        'This instruction deregisters a token by closing the existing',
        '`RegisteredToken` account for a particular mint. This instruction is',
        'owner-only, meaning that only the owner of the program (defined in the',
        '[Config] account) can deregister a token.',
      ];
      accounts: [
        {
          name: 'owner';
          isMut: false;
          isSigner: true;
          docs: [
            'Owner of the program set in the [`SenderConfig`] account. Signer for',
            'closing [`RegisteredToken`] account.',
          ];
        },
        {
          name: 'config';
          isMut: false;
          isSigner: false;
          docs: [
            'Sender Config account. This program requires that the `owner` specified',
            'in the context equals the pubkey specified in this account. Read-only.',
          ];
        },
        {
          name: 'mint';
          isMut: false;
          isSigner: false;
          docs: [
            'Mint info. This is the SPL token that will be bridged over to the',
            'foreign contract.',
          ];
        },
        {
          name: 'registeredToken';
          isMut: true;
          isSigner: false;
          docs: [
            'Registered Token account. This account stores information about the',
            'token, including the swap rate and max native swap amount. This account',
            'also determines if a mint is registered or not.',
          ];
        },
      ];
      args: [];
    },
    {
      name: 'updateRelayerFee';
      docs: [
        'This instruction updates the `relayer_fee` in the `ForeignContract` account.',
        'The `relayer_fee` is scaled by the `relayer_fee_precision`. For example,',
        'if the `relayer_fee` is $15 and the `relayer_fee_precision` is 1000000,',
        'the `relayer_fee` should be set to 15000000. This instruction can',
        'only be called by the owner or assistant, which are defined in the',
        '[OwnerConfig] account.',
        '',
        '# Arguments',
        '',
        '* `ctx`   - `UpdateRelayerFee` context',
        '* `chain` - Wormhole Chain ID',
        '* `fee`   - Relayer fee scaled by the `relayer_fee_precision`',
      ];
      accounts: [
        {
          name: 'payer';
          isMut: true;
          isSigner: true;
          docs: ['Signer of the transaction. Must be the owner or assistant.'];
        },
        {
          name: 'ownerConfig';
          isMut: false;
          isSigner: false;
          docs: [
            'The owner_config is used when updating the swap rate',
            'so that the assistant key can be used in addition to the',
            'owner key.',
          ];
        },
        {
          name: 'foreignContract';
          isMut: true;
          isSigner: false;
          docs: [
            'This account holds the USD denominated relayer fee for the specified',
            '`chain`. This account is used to determine the cost of relaying',
            'a transfer to a target chain. If there already is a relayer fee',
            'saved in this account, overwrite it.',
          ];
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
          docs: ['System program.'];
        },
      ];
      args: [
        {
          name: 'chain';
          type: 'u16';
        },
        {
          name: 'fee';
          type: 'u64';
        },
      ];
    },
    {
      name: 'updateRelayerFeePrecision';
      docs: [
        'This instruction updates the `relayer_fee_precision` in the',
        '`SenderConfig` and `RedeemerConfig` accounts. The `relayer_fee_precision`',
        'is used to scale the `relayer_fee`. This instruction is owner-only,',
        'meaning that only the owner of the program (defined in the [Config]',
        'account) can register a token.',
        '',
        '# Arguments',
        '',
        '* `ctx` - `UpdatePrecision` context',
        '* `relayer_fee_precision` - Precision used to scale the relayer fee.',
      ];
      accounts: [
        {
          name: 'owner';
          isMut: false;
          isSigner: true;
          docs: [
            'Owner of the program set in the [`RedeemerConfig`] and [`SenderConfig`] account.',
          ];
        },
        {
          name: 'redeemerConfig';
          isMut: true;
          isSigner: false;
          docs: [
            'Redeemer Config account. This program requires that the `owner`',
            'specified in the context equals the pubkey specified in this account.',
            'Mutable.',
          ];
        },
        {
          name: 'senderConfig';
          isMut: true;
          isSigner: false;
          docs: [
            'Sender Config account. This program requires that the `owner`',
            'specified in the context equals the pubkey specified in this account.',
            'Mutable. The `owner` check is redundant here, but we keep it as an',
            'extra protection for future changes to the context. Mutable.',
          ];
        },
      ];
      args: [
        {
          name: 'relayerFeePrecision';
          type: 'u32';
        },
      ];
    },
    {
      name: 'updateSwapRate';
      docs: [
        'This instruction updates the `swap_rate` in the `RegisteredToken`',
        'account. This instruction can only be called by the owner or',
        'assistant, which are defined in the [OwnerConfig] account.',
        '',
        '# Arguments',
        '',
        '* `ctx`       - `UpdateSwapRate` context',
        '* `swap_rate` - USD conversion rate for the specified token.',
      ];
      accounts: [
        {
          name: 'owner';
          isMut: false;
          isSigner: true;
          docs: [
            'The signer of the transaction. Must be the owner or assistant.',
          ];
        },
        {
          name: 'ownerConfig';
          isMut: false;
          isSigner: false;
          docs: [
            'The owner_config is used when updating the swap rate so that the',
            'assistant key can be used in additional to the owner key.',
          ];
        },
        {
          name: 'registeredToken';
          isMut: true;
          isSigner: false;
          docs: [
            'Registered Token account. This account stores information about the',
            'token, including the swap rate and max native swap amount. The program',
            'will modify this account to update the swap rate. Mutable.',
          ];
        },
        {
          name: 'mint';
          isMut: false;
          isSigner: false;
          docs: [
            'Mint info. This is the SPL token that will be bridged over to the',
            'foreign contract.',
          ];
        },
      ];
      args: [
        {
          name: 'swapRate';
          type: 'u64';
        },
      ];
    },
    {
      name: 'updateMaxNativeSwapAmount';
      docs: [
        'This instruction updates the `max_native_swap_amount` in the',
        '`RegisteredToken` account. This instruction is owner-only,',
        'meaning that only the owner of the program (defined in the [Config]',
        'account) can register a token.',
        '',
        '# Arguments',
        '',
        '* `ctx` - `UpdateMaxNativeSwapAmount` context',
        '* `max_native_swap_amount`:',
        '- Maximum amount of native tokens that can be swapped for this token',
        '- on this chain.',
      ];
      accounts: [
        {
          name: 'owner';
          isMut: false;
          isSigner: true;
          docs: [
            'Owner of the program set in the [`SenderConfig`] account. Signer for',
            'creating [`ForeignContract`] account.',
          ];
        },
        {
          name: 'config';
          isMut: false;
          isSigner: false;
          docs: [
            'Sender Config account. This program requires that the `owner` specified',
            'in the context equals the pubkey specified in this account. Read-only.',
          ];
        },
        {
          name: 'registeredToken';
          isMut: true;
          isSigner: false;
          docs: [
            'Registered Token account. This account stores information about the',
            'token, including the swap rate and max native swap amount. The program',
            'will modify this account when the swap rate or max native swap amount',
            'changes. Mutable.',
          ];
        },
        {
          name: 'mint';
          isMut: false;
          isSigner: false;
          docs: [
            'Mint info. This is the SPL token that will be bridged over to the',
            'foreign contract.',
          ];
        },
      ];
      args: [
        {
          name: 'maxNativeSwapAmount';
          type: 'u64';
        },
      ];
    },
    {
      name: 'setPauseForTransfers';
      docs: [
        'This instruction updates the `paused` boolean in the `SenderConfig`',
        'account. This instruction is owner-only, meaning that only the owner',
        'of the program (defined in the [Config] account) can pause outbound',
        'transfers.',
        '',
        '# Arguments',
        '',
        '* `ctx` - `PauseOutboundTransfers` context',
        '* `paused` - Boolean indicating whether outbound transfers are paused.',
      ];
      accounts: [
        {
          name: 'owner';
          isMut: false;
          isSigner: true;
          docs: ['Owner of the program set in the [`SenderConfig`] account.'];
        },
        {
          name: 'config';
          isMut: true;
          isSigner: false;
          docs: [
            'Sender Config account. This program requires that the `owner` specified',
            'in the context equals the pubkey specified in this account. Mutable.',
          ];
        },
      ];
      args: [
        {
          name: 'paused';
          type: 'bool';
        },
      ];
    },
    {
      name: 'submitOwnershipTransferRequest';
      docs: [
        'This instruction sets the `pending_owner` field in the `OwnerConfig`',
        'account. This instruction is owner-only, meaning that only the owner',
        'of the program (defined in the [Config] account) can submit an',
        'ownership transfer request.',
        '',
        '# Arguments',
        '',
        '* `ctx`       - `ManageOwnership` context',
        '* `new_owner` - Pubkey of the pending owner.',
      ];
      accounts: [
        {
          name: 'owner';
          isMut: false;
          isSigner: true;
          docs: ['Owner of the program set in the [`OwnerConfig`] account.'];
        },
        {
          name: 'ownerConfig';
          isMut: true;
          isSigner: false;
          docs: [
            'Owner Config account. This program requires that the `owner` specified',
            'in the context equals the pubkey specified in this account. Mutable.',
          ];
        },
      ];
      args: [
        {
          name: 'newOwner';
          type: 'publicKey';
        },
      ];
    },
    {
      name: 'confirmOwnershipTransferRequest';
      docs: [
        'This instruction confirms that the `pending_owner` is the signer of',
        'the transaction and updates the `owner` field in the `SenderConfig`,',
        '`RedeemerConfig`, and `OwnerConfig` accounts.',
      ];
      accounts: [
        {
          name: 'pendingOwner';
          isMut: false;
          isSigner: true;
          docs: [
            'Must be the pending owner of the program set in the [`OwnerConfig`]',
            'account.',
          ];
        },
        {
          name: 'ownerConfig';
          isMut: true;
          isSigner: false;
          docs: [
            'Owner Config account. This program requires that the `pending_owner`',
            'specified in the context equals the pubkey specified in this account.',
          ];
        },
        {
          name: 'senderConfig';
          isMut: true;
          isSigner: false;
          docs: [
            'Sender Config account. This instruction will update the `owner`',
            'specified in this account to the `pending_owner` specified in the',
            '[`OwnerConfig`] account. Mutable.',
          ];
        },
        {
          name: 'redeemerConfig';
          isMut: true;
          isSigner: false;
          docs: [
            'Redeemer Config account. This instruction will update the `owner`',
            'specified in this account to the `pending_owner` specified in the',
            '[`OwnerConfig`] account. Mutable.',
          ];
        },
      ];
      args: [];
    },
    {
      name: 'cancelOwnershipTransferRequest';
      docs: [
        'This instruction cancels the ownership transfer request by setting',
        'the `pending_owner` field in the `OwnerConfig` account to `None`.',
        'This instruction is owner-only, meaning that only the owner of the',
        'program (defined in the [Config] account) can cancel an ownership',
        'transfer request.',
      ];
      accounts: [
        {
          name: 'owner';
          isMut: false;
          isSigner: true;
          docs: ['Owner of the program set in the [`OwnerConfig`] account.'];
        },
        {
          name: 'ownerConfig';
          isMut: true;
          isSigner: false;
          docs: [
            'Owner Config account. This program requires that the `owner` specified',
            'in the context equals the pubkey specified in this account. Mutable.',
          ];
        },
      ];
      args: [];
    },
    {
      name: 'updateAssistant';
      docs: [
        'This instruction updates the `assistant` field in the `OwnerConfig`',
        'account. This instruction is owner-only, meaning that only the owner',
        'of the program (defined in the [Config] account) can update the',
        'assistant.',
        '',
        '# Arguments',
        '',
        '* `ctx` - `ManageOwnership` context',
        '* `new_assistant` - Pubkey of the new assistant.',
      ];
      accounts: [
        {
          name: 'owner';
          isMut: false;
          isSigner: true;
          docs: ['Owner of the program set in the [`OwnerConfig`] account.'];
        },
        {
          name: 'ownerConfig';
          isMut: true;
          isSigner: false;
          docs: [
            'Owner Config account. This program requires that the `owner` specified',
            'in the context equals the pubkey specified in this account. Mutable.',
          ];
        },
      ];
      args: [
        {
          name: 'newAssistant';
          type: 'publicKey';
        },
      ];
    },
    {
      name: 'updateFeeRecipient';
      docs: [
        'This instruction updates the `fee_recipient` field in the `RedeemerConfig`',
        'account. This instruction is owner-only, meaning that only the owner',
        'of the program (defined in the [Config] account) can update the',
        'fee recipient.',
        '',
        '# Arguments',
        '',
        '* `ctx` - `UpdateFeeRecipient` context',
        '* `new_fee_recipient` - Pubkey of the new fee recipient.',
      ];
      accounts: [
        {
          name: 'owner';
          isMut: false;
          isSigner: true;
          docs: ['Owner of the program set in the [`RedeemerConfig`] account.'];
        },
        {
          name: 'redeemerConfig';
          isMut: true;
          isSigner: false;
          docs: [
            'Redeemer Config account, which saves program data useful for other',
            'instructions, specifically for inbound transfers. Also saves the payer',
            "of the [`initialize`](crate::initialize) instruction as the program's",
            'owner.',
          ];
        },
      ];
      args: [
        {
          name: 'newFeeRecipient';
          type: 'publicKey';
        },
      ];
    },
    {
      name: 'transferNativeTokensWithRelay';
      docs: [
        'This instruction is used to transfer native tokens from Solana to a',
        'foreign blockchain. The user can optionally specify a',
        '`to_native_token_amount` to swap some of the tokens for the native',
        'asset on the target chain. For a fee, an off-chain relayer will redeem',
        'the transfer on the target chain. If the user is transferring native',
        'SOL, the contract will automatically wrap the lamports into a WSOL.',
        '',
        '# Arguments',
        '',
        '* `ctx` - `TransferNativeWithRelay` context',
        '* `amount` - Amount of tokens to send',
        '* `to_native_token_amount`:',
        '- Amount of tokens to swap for native assets on the target chain',
        '* `recipient_chain` - Chain ID of the target chain',
        '* `recipient_address` - Address of the target wallet on the target chain',
        '* `batch_id` - Nonce of Wormhole message',
        '* `wrap_native` - Whether to wrap native SOL',
      ];
      accounts: [
        {
          name: 'payer';
          isMut: true;
          isSigner: true;
          docs: [
            'Payer will pay Wormhole fee to transfer tokens and create temporary',
            'token account.',
          ];
        },
        {
          name: 'payerSequence';
          isMut: true;
          isSigner: false;
          docs: ["Used to keep track of payer's Wormhole sequence number."];
        },
        {
          name: 'config';
          isMut: false;
          isSigner: false;
          docs: [
            'Sender Config account. Acts as the signer for the Token Bridge token',
            'transfer. Read-only.',
          ];
        },
        {
          name: 'foreignContract';
          isMut: false;
          isSigner: false;
          docs: [
            'Foreign Contract account. Send tokens to the contract specified in this',
            'account. Funnily enough, the Token Bridge program does not have any',
            'requirements for outbound transfers for the recipient chain to be',
            'registered. This account provides extra protection against sending',
            'tokens to an unregistered Wormhole chain ID. Read-only.',
          ];
        },
        {
          name: 'mint';
          isMut: true;
          isSigner: false;
          docs: [
            'Mint info. This is the SPL token that will be bridged over to the',
            'foreign contract. Mutable.',
          ];
        },
        {
          name: 'fromTokenAccount';
          isMut: true;
          isSigner: false;
          docs: [
            "Payer's associated token account. We may want to make this a generic",
            'token account in the future.',
          ];
        },
        {
          name: 'registeredToken';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'tmpTokenAccount';
          isMut: true;
          isSigner: false;
          docs: [
            "Program's temporary token account. This account is created before the",
            "instruction is invoked to temporarily take custody of the payer's",
            'tokens. When the tokens are finally bridged out, the token account',
            'will have zero balance and can be closed.',
          ];
        },
        {
          name: 'tokenBridgeConfig';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'tokenBridgeCustody';
          isMut: true;
          isSigner: false;
          docs: [
            "account that holds this mint's balance. This account needs to be",
            'unchecked because a token account may not have been created for this',
            'mint yet. Mutable.',
          ];
        },
        {
          name: 'tokenBridgeAuthoritySigner';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'tokenBridgeCustodySigner';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'wormholeBridge';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'wormholeMessage';
          isMut: true;
          isSigner: false;
          docs: [
            'tokens transferred in this account for our program. Mutable.',
          ];
        },
        {
          name: 'tokenBridgeEmitter';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'tokenBridgeSequence';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'wormholeFeeCollector';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'tokenProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'wormholeProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'tokenBridgeProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'clock';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'rent';
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: 'amount';
          type: 'u64';
        },
        {
          name: 'toNativeTokenAmount';
          type: 'u64';
        },
        {
          name: 'recipientChain';
          type: 'u16';
        },
        {
          name: 'recipientAddress';
          type: {
            array: ['u8', 32];
          };
        },
        {
          name: 'batchId';
          type: 'u32';
        },
        {
          name: 'wrapNative';
          type: 'bool';
        },
      ];
    },
    {
      name: 'transferWrappedTokensWithRelay';
      docs: [
        'This instruction is used to transfer wrapped tokens from Solana to a',
        'foreign blockchain. The user can optionally specify a',
        '`to_native_token_amount` to swap some of the tokens for the native',
        'assets on the target chain. For a fee, an off-chain relayer will redeem',
        'the transfer on the target chain. This instruction should only be called',
        'when the user is transferring a wrapped token.',
        '',
        '# Arguments',
        '',
        '* `ctx` - `TransferWrappedWithRelay` context',
        '* `amount` - Amount of tokens to send',
        '* `to_native_token_amount`:',
        '- Amount of tokens to swap for native assets on the target chain',
        '* `recipient_chain` - Chain ID of the target chain',
        '* `recipient_address` - Address of the target wallet on the target chain',
        '* `batch_id` - Nonce of Wormhole message',
      ];
      accounts: [
        {
          name: 'payer';
          isMut: true;
          isSigner: true;
          docs: ['Payer will pay Wormhole fee to transfer tokens.'];
        },
        {
          name: 'payerSequence';
          isMut: true;
          isSigner: false;
          docs: ["Used to keep track of payer's Wormhole sequence number."];
        },
        {
          name: 'config';
          isMut: false;
          isSigner: false;
          docs: [
            'Sender Config account. Acts as the Token Bridge sender PDA. Mutable.',
          ];
        },
        {
          name: 'foreignContract';
          isMut: false;
          isSigner: false;
          docs: [
            'Foreign Contract account. Send tokens to the contract specified in this',
            'account. Funnily enough, the Token Bridge program does not have any',
            'requirements for outbound transfers for the recipient chain to be',
            'registered. This account provides extra protection against sending',
            'tokens to an unregistered Wormhole chain ID. Read-only.',
          ];
        },
        {
          name: 'tokenBridgeWrappedMint';
          isMut: true;
          isSigner: false;
          docs: [
            'Token Bridge wrapped mint info. This is the SPL token that will be',
            'bridged to the foreign contract. The wrapped mint PDA must agree',
            "with the native token's metadata. Mutable.",
          ];
        },
        {
          name: 'fromTokenAccount';
          isMut: true;
          isSigner: false;
          docs: [
            "Payer's associated token account. We may want to make this a generic",
            'token account in the future.',
          ];
        },
        {
          name: 'registeredToken';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'tmpTokenAccount';
          isMut: true;
          isSigner: false;
          docs: [
            "Program's temporary token account. This account is created before the",
            "instruction is invoked to temporarily take custody of the payer's",
            'tokens. When the tokens are finally bridged out, the token account',
            'will have zero balance and can be closed.',
          ];
        },
        {
          name: 'tokenBridgeWrappedMeta';
          isMut: false;
          isSigner: false;
          docs: [
            'about the token from its native chain:',
            '* Wormhole Chain ID',
            "* Token's native contract address",
            "* Token's native decimals",
          ];
        },
        {
          name: 'tokenBridgeConfig';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'tokenBridgeAuthoritySigner';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'wormholeBridge';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'wormholeMessage';
          isMut: true;
          isSigner: false;
          docs: ['tokens transferred in this account.'];
        },
        {
          name: 'tokenBridgeEmitter';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'tokenBridgeSequence';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'wormholeFeeCollector';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'wormholeProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'tokenBridgeProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'tokenProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'clock';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'rent';
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: 'amount';
          type: 'u64';
        },
        {
          name: 'toNativeTokenAmount';
          type: 'u64';
        },
        {
          name: 'recipientChain';
          type: 'u16';
        },
        {
          name: 'recipientAddress';
          type: {
            array: ['u8', 32];
          };
        },
        {
          name: 'batchId';
          type: 'u32';
        },
      ];
    },
    {
      name: 'completeNativeTransferWithRelay';
      docs: [
        'This instruction is used to redeem token transfers from foreign emitters.',
        'It takes custody of the released native tokens and sends the tokens to the',
        'encoded `recipient`. It pays the `fee_recipient` in the token',
        'denomination. If requested by the user, it will perform a swap with the',
        'off-chain relayer to provide the user with lamports. If the token',
        'being transferred is WSOL, the contract will unwrap the WSOL and send',
        'the lamports to the recipient and pay the relayer in lamports.',
        '',
        '# Arguments',
        '',
        '* `ctx` - `CompleteNativeWithRelay` context',
        '* `vaa_hash` - Hash of the VAA that triggered the transfer',
      ];
      accounts: [
        {
          name: 'payer';
          isMut: true;
          isSigner: true;
          docs: [
            'Payer will pay Wormhole fee to transfer tokens and create temporary',
            'token account.',
          ];
        },
        {
          name: 'config';
          isMut: false;
          isSigner: false;
          docs: [
            'Redeemer Config account. Acts as the Token Bridge redeemer, which signs',
            'for the complete transfer instruction. Read-only.',
          ];
        },
        {
          name: 'feeRecipientTokenAccount';
          isMut: true;
          isSigner: false;
          docs: [
            "Fee recipient's token account. Must be an associated token account. Mutable.",
          ];
        },
        {
          name: 'foreignContract';
          isMut: false;
          isSigner: false;
          docs: [
            'Foreign Contract account. The registered contract specified in this',
            "account must agree with the target address for the Token Bridge's token",
            'transfer. Read-only.',
          ];
        },
        {
          name: 'mint';
          isMut: false;
          isSigner: false;
          docs: [
            'Mint info. This is the SPL token that will be bridged over from the',
            'foreign contract. This must match the token address specified in the',
            'signed Wormhole message. Read-only.',
          ];
        },
        {
          name: 'recipientTokenAccount';
          isMut: true;
          isSigner: false;
          docs: [
            'Recipient associated token account. The recipient authority check',
            'is necessary to ensure that the recipient is the intended recipient',
            'of the bridged tokens. Mutable.',
          ];
        },
        {
          name: 'recipient';
          isMut: true;
          isSigner: false;
          docs: [
            'transaction. This instruction verifies that the recipient key',
            'passed in this context matches the intended recipient in the vaa.',
          ];
        },
        {
          name: 'registeredToken';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'nativeRegisteredToken';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'tmpTokenAccount';
          isMut: true;
          isSigner: false;
          docs: [
            "Program's temporary token account. This account is created before the",
            "instruction is invoked to temporarily take custody of the payer's",
            'tokens. When the tokens are finally bridged in, the tokens will be',
            'transferred to the destination token accounts. This account will have',
            'zero balance and can be closed.',
          ];
        },
        {
          name: 'tokenBridgeConfig';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'vaa';
          isMut: false;
          isSigner: false;
          docs: [
            'Verified Wormhole message account. The Wormhole program verified',
            'signatures and posted the account data here. Read-only.',
          ];
        },
        {
          name: 'tokenBridgeClaim';
          isMut: true;
          isSigner: false;
          docs: [
            'is true if the bridged assets have been claimed. If the transfer has',
            'not been redeemed, this account will not exist yet.',
            '',
            "NOTE: The Token Bridge program's claim account is only initialized when",
            'a transfer is redeemed (and the boolean value `true` is written as',
            'its data).',
            '',
            'The Token Bridge program will automatically fail if this transfer',
            'is redeemed again. But we choose to short-circuit the failure as the',
            'first evaluation of this instruction.',
          ];
        },
        {
          name: 'tokenBridgeForeignEndpoint';
          isMut: false;
          isSigner: false;
          docs: [
            'endpoint per chain, but the PDA allows for multiple endpoints for each',
            'chain! We store the proper endpoint for the emitter chain.',
          ];
        },
        {
          name: 'tokenBridgeCustody';
          isMut: true;
          isSigner: false;
          docs: ["account that holds this mint's balance."];
        },
        {
          name: 'tokenBridgeCustodySigner';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'wormholeProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'tokenBridgeProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'tokenProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'rent';
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: 'vaaHash';
          type: {
            array: ['u8', 32];
          };
        },
      ];
    },
    {
      name: 'completeWrappedTransferWithRelay';
      docs: [
        'This instruction is used to redeem token transfers from foreign emitters.',
        'It takes custody of the minted wrapped tokens and sends the tokens to the',
        'encoded `recipient`. It pays the `fee_recipient` in the wrapped-token',
        'denomination. If requested by the user, it will perform a swap with the',
        'off-chain relayer to provide the user with lamports.',
        '',
        '# Arguments',
        '',
        '* `ctx` - `CompleteWrappedWithRelay` context',
        '* `vaa_hash` - Hash of the VAA that triggered the transfer',
      ];
      accounts: [
        {
          name: 'payer';
          isMut: true;
          isSigner: true;
          docs: [
            'Payer will pay Wormhole fee to transfer tokens and create temporary',
            'token account.',
          ];
        },
        {
          name: 'config';
          isMut: false;
          isSigner: false;
          docs: [
            'Redeemer Config account. Acts as the Token Bridge redeemer, which signs',
            'for the complete transfer instruction. Read-only.',
          ];
        },
        {
          name: 'feeRecipientTokenAccount';
          isMut: true;
          isSigner: false;
          docs: [
            "Fee recipient's token account. Must be an associated token account. Mutable.",
          ];
        },
        {
          name: 'foreignContract';
          isMut: false;
          isSigner: false;
          docs: [
            'Foreign Contract account. The registered contract specified in this',
            "account must agree with the target address for the Token Bridge's token",
            'transfer. Read-only.',
          ];
        },
        {
          name: 'tokenBridgeWrappedMint';
          isMut: true;
          isSigner: false;
          docs: [
            'Token Bridge wrapped mint info. This is the SPL token that will be',
            'bridged from the foreign contract. The wrapped mint PDA must agree',
            "with the native token's metadata in the wormhole message. Mutable.",
          ];
        },
        {
          name: 'recipientTokenAccount';
          isMut: true;
          isSigner: false;
          docs: [
            'Recipient associated token account. The recipient authority check',
            'is necessary to ensure that the recipient is the intended recipient',
            'of the bridged tokens. Mutable.',
          ];
        },
        {
          name: 'recipient';
          isMut: true;
          isSigner: false;
          docs: [
            'transaction. This instruction verifies that the recipient key',
            'passed in this context matches the intended recipient in the vaa.',
          ];
        },
        {
          name: 'registeredToken';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'nativeRegisteredToken';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'tmpTokenAccount';
          isMut: true;
          isSigner: false;
          docs: [
            "Program's temporary token account. This account is created before the",
            "instruction is invoked to temporarily take custody of the payer's",
            'tokens. When the tokens are finally bridged in, the tokens will be',
            'transferred to the destination token accounts. This account will have',
            'zero balance and can be closed.',
          ];
        },
        {
          name: 'tokenBridgeWrappedMeta';
          isMut: false;
          isSigner: false;
          docs: [
            'about the token from its native chain:',
            '* Wormhole Chain ID',
            "* Token's native contract address",
            "* Token's native decimals",
          ];
        },
        {
          name: 'tokenBridgeConfig';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'vaa';
          isMut: false;
          isSigner: false;
          docs: [
            'Verified Wormhole message account. The Wormhole program verified',
            'signatures and posted the account data here. Read-only.',
          ];
        },
        {
          name: 'tokenBridgeClaim';
          isMut: true;
          isSigner: false;
          docs: [
            'is true if the bridged assets have been claimed. If the transfer has',
            'not been redeemed, this account will not exist yet.',
            '',
            "NOTE: The Token Bridge program's claim account is only initialized when",
            'a transfer is redeemed (and the boolean value `true` is written as',
            'its data).',
            '',
            'The Token Bridge program will automatically fail if this transfer',
            'is redeemed again. But we choose to short-circuit the failure as the',
            'first evaluation of this instruction.',
          ];
        },
        {
          name: 'tokenBridgeForeignEndpoint';
          isMut: false;
          isSigner: false;
          docs: [
            'endpoint per chain, but the PDA allows for multiple endpoints for each',
            'chain! We store the proper endpoint for the emitter chain.',
          ];
        },
        {
          name: 'tokenBridgeMintAuthority';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'wormholeProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'tokenBridgeProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'tokenProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'rent';
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: 'vaaHash';
          type: {
            array: ['u8', 32];
          };
        },
      ];
    },
  ];
  accounts: [
    {
      name: 'foreignContract';
      docs: ['Foreign emitter account data.'];
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'chain';
            docs: ["Emitter chain. Cannot equal `1` (Solana's Chain ID)."];
            type: 'u16';
          },
          {
            name: 'address';
            docs: ['Emitter address. Cannot be zero address.'];
            type: {
              array: ['u8', 32];
            };
          },
          {
            name: 'tokenBridgeForeignEndpoint';
            docs: ["Token Bridge program's foreign endpoint account key."];
            type: 'publicKey';
          },
          {
            name: 'fee';
            docs: [
              'The fee that is paid to the `fee_recipient` upon redeeming a transfer.',
              'This value is set in terms of USD and scaled by the `relayer_fee_precision`.',
              'For example, if the `relayer_fee_precision` is `100000000` and the intended',
              'fee is $5, then the `fee` value should be `500000000`.',
            ];
            type: 'u64';
          },
        ];
      };
    },
    {
      name: 'ownerConfig';
      docs: ['Owner account data.'];
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'owner';
            docs: ["Program's owner."];
            type: 'publicKey';
          },
          {
            name: 'assistant';
            docs: [
              "Program's assistant. Can be used to update the relayer fee and swap rate.",
            ];
            type: 'publicKey';
          },
          {
            name: 'pendingOwner';
            docs: [
              'Intermediate storage for the pending owner. Is used to transfer ownership.',
            ];
            type: {
              option: 'publicKey';
            };
          },
        ];
      };
    },
    {
      name: 'redeemerConfig';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'owner';
            docs: ["Program's owner."];
            type: 'publicKey';
          },
          {
            name: 'bump';
            docs: ['PDA bump.'];
            type: 'u8';
          },
          {
            name: 'relayerFeePrecision';
            docs: ['Relayer fee and swap rate precision.'];
            type: 'u32';
          },
          {
            name: 'feeRecipient';
            docs: ['Recipient of all relayer fees and swap proceeds.'];
            type: 'publicKey';
          },
        ];
      };
    },
    {
      name: 'registeredToken';
      docs: ['Registered token account data.'];
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'swapRate';
            docs: [
              'Token swap rate. The swap rate is the USD conversion rate of the token.',
            ];
            type: 'u64';
          },
          {
            name: 'maxNativeSwapAmount';
            docs: [
              'Maximum amount of native SOL the contract will swap for each transfer.',
            ];
            type: 'u64';
          },
        ];
      };
    },
    {
      name: 'senderConfig';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'owner';
            docs: ["Program's owner."];
            type: 'publicKey';
          },
          {
            name: 'bump';
            docs: ['PDA bump.'];
            type: 'u8';
          },
          {
            name: 'tokenBridge';
            docs: ["Token Bridge program's relevant addresses."];
            type: {
              defined: 'OutboundTokenBridgeAddresses';
            };
          },
          {
            name: 'relayerFeePrecision';
            docs: ['Relayer fee and swap rate precision.'];
            type: 'u32';
          },
          {
            name: 'paused';
            docs: ['Boolean indicating whether outbound transfers are paused.'];
            type: 'bool';
          },
        ];
      };
    },
    {
      name: 'signerSequence';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'value';
            type: 'u64';
          },
        ];
      };
    },
  ];
  types: [
    {
      name: 'OutboundTokenBridgeAddresses';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'sequence';
            type: 'publicKey';
          },
        ];
      };
    },
    {
      name: 'TokenBridgeRelayerMessage';
      docs: [
        'Expected message types for this program. Only valid payloads are:',
        '* `TransferWithRelay`: Payload ID == 1.',
        '',
        'Payload IDs are encoded as u8.',
      ];
      type: {
        kind: 'enum';
        variants: [
          {
            name: 'TransferWithRelay';
            fields: [
              {
                name: 'target_relayer_fee';
                type: 'u64';
              },
              {
                name: 'to_native_token_amount';
                type: 'u64';
              },
              {
                name: 'recipient';
                type: {
                  array: ['u8', 32];
                };
              },
            ];
          },
        ];
      };
    },
  ];
  errors: [
    {
      code: 6000;
      name: 'InvalidWormholeBridge';
      msg: 'InvalidWormholeBridge';
    },
    {
      code: 6001;
      name: 'InvalidWormholeFeeCollector';
      msg: 'InvalidWormholeFeeCollector';
    },
    {
      code: 6002;
      name: 'OwnerOnly';
      msg: 'OwnerOnly';
    },
    {
      code: 6003;
      name: 'OutboundTransfersPaused';
      msg: 'OutboundTransfersPaused';
    },
    {
      code: 6004;
      name: 'OwnerOrAssistantOnly';
      msg: 'OwnerOrAssistantOnly';
    },
    {
      code: 6005;
      name: 'NotPendingOwner';
      msg: 'NotPendingOwner';
    },
    {
      code: 6006;
      name: 'AlreadyTheOwner';
      msg: 'AlreadyTheOwner';
    },
    {
      code: 6007;
      name: 'AlreadyTheAssistant';
      msg: 'AlreadyTheAssistant';
    },
    {
      code: 6008;
      name: 'AlreadyTheFeeRecipient';
      msg: 'AlreadyTheFeeRecipient';
    },
    {
      code: 6009;
      name: 'BumpNotFound';
      msg: 'BumpNotFound';
    },
    {
      code: 6010;
      name: 'FailedToMakeImmutable';
      msg: 'FailedToMakeImmutable';
    },
    {
      code: 6011;
      name: 'InvalidForeignContract';
      msg: 'InvalidForeignContract';
    },
    {
      code: 6012;
      name: 'ZeroBridgeAmount';
      msg: 'ZeroBridgeAmount';
    },
    {
      code: 6013;
      name: 'InvalidToNativeAmount';
      msg: 'InvalidToNativeAmount';
    },
    {
      code: 6014;
      name: 'NativeMintRequired';
      msg: 'NativeMintRequired';
    },
    {
      code: 6015;
      name: 'SwapsNotAllowedForNativeMint';
      msg: 'SwapsNotAllowedForNativeMint';
    },
    {
      code: 6016;
      name: 'InvalidTokenBridgeConfig';
      msg: 'InvalidTokenBridgeConfig';
    },
    {
      code: 6017;
      name: 'InvalidTokenBridgeAuthoritySigner';
      msg: 'InvalidTokenBridgeAuthoritySigner';
    },
    {
      code: 6018;
      name: 'InvalidTokenBridgeCustodySigner';
      msg: 'InvalidTokenBridgeCustodySigner';
    },
    {
      code: 6019;
      name: 'InvalidTokenBridgeEmitter';
      msg: 'InvalidTokenBridgeEmitter';
    },
    {
      code: 6020;
      name: 'InvalidTokenBridgeSequence';
      msg: 'InvalidTokenBridgeSequence';
    },
    {
      code: 6021;
      name: 'InvalidRecipient';
      msg: 'InvalidRecipient';
    },
    {
      code: 6022;
      name: 'InvalidTransferToChain';
      msg: 'InvalidTransferToChain';
    },
    {
      code: 6023;
      name: 'InvalidTransferTokenChain';
      msg: 'InvalidTransferTokenChain';
    },
    {
      code: 6024;
      name: 'InvalidPrecision';
      msg: 'InvalidPrecision';
    },
    {
      code: 6025;
      name: 'InvalidTransferToAddress';
      msg: 'InvalidTransferToAddress';
    },
    {
      code: 6026;
      name: 'AlreadyRedeemed';
      msg: 'AlreadyRedeemed';
    },
    {
      code: 6027;
      name: 'InvalidTokenBridgeForeignEndpoint';
      msg: 'InvalidTokenBridgeForeignEndpoint';
    },
    {
      code: 6028;
      name: 'InvalidTokenBridgeMintAuthority';
      msg: 'InvalidTokenBridgeMintAuthority';
    },
    {
      code: 6029;
      name: 'InvalidPublicKey';
      msg: 'InvalidPublicKey';
    },
    {
      code: 6030;
      name: 'ZeroSwapRate';
      msg: 'ZeroSwapRate';
    },
    {
      code: 6031;
      name: 'TokenNotRegistered';
      msg: 'TokenNotRegistered';
    },
    {
      code: 6032;
      name: 'ChainNotRegistered';
      msg: 'ChainNotRegistered';
    },
    {
      code: 6033;
      name: 'TokenAlreadyRegistered';
      msg: 'TokenAlreadyRegistered';
    },
    {
      code: 6034;
      name: 'FeeCalculationError';
      msg: 'TokenFeeCalculationError';
    },
    {
      code: 6035;
      name: 'InvalidSwapCalculation';
      msg: 'InvalidSwapCalculation';
    },
    {
      code: 6036;
      name: 'InsufficientFunds';
      msg: 'InsufficientFunds';
    },
  ];
};

export const IDL: TokenBridgeRelayer = {
  version: '0.1.0',
  name: 'token_bridge_relayer',
  constants: [
    {
      name: 'SEED_PREFIX_BRIDGED',
      type: 'bytes',
      value: '[98, 114, 105, 100, 103, 101, 100]',
    },
    {
      name: 'SEED_PREFIX_TMP',
      type: 'bytes',
      value: '[116, 109, 112]',
    },
    {
      name: 'SWAP_RATE_PRECISION',
      type: 'u32',
      value: '100_000_000',
    },
  ],
  instructions: [
    {
      name: 'initialize',
      docs: [
        "This instruction is be used to generate your program's config.",
        'And for convenience, we will store Wormhole-related PDAs in the',
        'config so we can verify these accounts with a simple == constraint.',
        '# Arguments',
        '',
        '* `ctx`           - `Initialize` context',
        '* `fee_recipient` - Recipient of all relayer fees and swap proceeds',
        '* `assistant`     - Privileged key to manage certain accounts',
      ],
      accounts: [
        {
          name: 'owner',
          isMut: true,
          isSigner: true,
          docs: ['Deployer of the program.'],
        },
        {
          name: 'senderConfig',
          isMut: true,
          isSigner: false,
          docs: [
            'Sender Config account, which saves program data useful for other',
            'instructions, specifically for outbound transfers. Also saves the payer',
            "of the [`initialize`](crate::initialize) instruction as the program's",
            'owner.',
          ],
        },
        {
          name: 'redeemerConfig',
          isMut: true,
          isSigner: false,
          docs: [
            'Redeemer Config account, which saves program data useful for other',
            'instructions, specifically for inbound transfers. Also saves the payer',
            "of the [`initialize`](crate::initialize) instruction as the program's",
            'owner.',
          ],
        },
        {
          name: 'ownerConfig',
          isMut: true,
          isSigner: false,
          docs: [
            'Owner config account, which saves the owner, assistant and',
            'pending owner keys. This account is used to manage the ownership of the',
            'program.',
          ],
        },
        {
          name: 'tokenBridgeEmitter',
          isMut: false,
          isSigner: false,
          docs: [
            'that holds data; it is purely just a signer for posting Wormhole',
            'messages on behalf of the Token Bridge program.',
          ],
        },
        {
          name: 'tokenBridgeSequence',
          isMut: false,
          isSigner: false,
          docs: [
            "Token Bridge emitter's sequence account. Like with all Wormhole",
            'emitters, this account keeps track of the sequence number of the last',
            'posted message.',
          ],
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
          docs: ['System program.'],
        },
        {
          name: 'programData',
          isMut: true,
          isSigner: false,
          docs: [
            'upgrade authority. We check this PDA address just in case there is another program that this',
            'deployer has deployed.',
            '',
            'NOTE: Set upgrade authority is scary because any public key can be used to set as the',
            'authority.',
          ],
        },
        {
          name: 'bpfLoaderUpgradeableProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'feeRecipient',
          type: 'publicKey',
        },
        {
          name: 'assistant',
          type: 'publicKey',
        },
      ],
    },
    {
      name: 'registerForeignContract',
      docs: [
        'This instruction registers a new foreign contract (from another',
        'network) and saves the emitter information in a ForeignEmitter account.',
        'This instruction is owner-only, meaning that only the owner of the',
        'program (defined in the [Config] account) can add and update foreign',
        'contracts.',
        '',
        '# Arguments',
        '',
        '* `ctx`     - `RegisterForeignContract` context',
        '* `chain`   - Wormhole Chain ID',
        '* `address` - Wormhole Emitter Address',
        '* `relayer_fee` - Relayer fee scaled by the `relayer_fee_precision`',
      ],
      accounts: [
        {
          name: 'owner',
          isMut: true,
          isSigner: true,
          docs: [
            'Owner of the program set in the [`SenderConfig`] account. Signer for',
            'creating [`ForeignContract`] account.',
          ],
        },
        {
          name: 'config',
          isMut: false,
          isSigner: false,
          docs: [
            'Sender Config account. This program requires that the `owner` specified',
            'in the context equals the pubkey specified in this account. Read-only.',
          ],
        },
        {
          name: 'foreignContract',
          isMut: true,
          isSigner: false,
          docs: [
            'Foreign Contract account. Create this account if an emitter has not been',
            'registered yet for this Wormhole chain ID. If there already is a',
            'contract address saved in this account, overwrite it.',
          ],
        },
        {
          name: 'tokenBridgeForeignEndpoint',
          isMut: false,
          isSigner: false,
          docs: [
            'Token Bridge foreign endpoint. This account should really be one',
            "endpoint per chain, but Token Bridge's PDA allows for multiple",
            'endpoints for each chain. We store the proper endpoint for the',
            'emitter chain.',
          ],
        },
        {
          name: 'tokenBridgeProgram',
          isMut: false,
          isSigner: false,
          docs: ['Token Bridge program.'],
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
          docs: ['System program.'],
        },
      ],
      args: [
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
        {
          name: 'relayerFee',
          type: 'u64',
        },
      ],
    },
    {
      name: 'registerToken',
      docs: [
        'This instruction registers a new token and saves the initial `swap_rate`',
        'and `max_native_token_amount` in a RegisteredToken account.',
        'This instruction is owner-only, meaning that only the owner of the',
        'program (defined in the [Config] account) can register a token.',
        '',
        '# Arguments',
        '',
        '* `ctx` - `RegisterToken` context',
        '* `swap_rate`:',
        '- USD conversion rate scaled by the `swap_rate_precision`. For example,',
        '- if the conversion rate is $15 and the `swap_rate_precision` is',
        '- 1000000, the `swap_rate` should be set to 15000000.',
        '* `max_native_swap_amount`:',
        '- Maximum amount of native tokens that can be swapped for this token',
        '- on this chain.',
      ],
      accounts: [
        {
          name: 'owner',
          isMut: true,
          isSigner: true,
          docs: [
            'Owner of the program set in the [`SenderConfig`] account. Signer for',
            'creating [`ForeignContract`] account.',
          ],
        },
        {
          name: 'config',
          isMut: false,
          isSigner: false,
          docs: [
            'Sender Config account. This program requires that the `owner` specified',
            'in the context equals the pubkey specified in this account. Read-only.',
          ],
        },
        {
          name: 'registeredToken',
          isMut: true,
          isSigner: false,
          docs: [
            'Registered Token account. This account stores information about the',
            'token, including the swap rate and max native swap amount. Create this',
            'account if the mint has not been registered yet. Mutable.',
          ],
        },
        {
          name: 'mint',
          isMut: false,
          isSigner: false,
          docs: [
            'Mint info. This is the SPL token that will be bridged over to the',
            'foreign contract.',
          ],
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
          docs: ['System program.'],
        },
      ],
      args: [
        {
          name: 'swapRate',
          type: 'u64',
        },
        {
          name: 'maxNativeSwapAmount',
          type: 'u64',
        },
      ],
    },
    {
      name: 'deregisterToken',
      docs: [
        'This instruction deregisters a token by closing the existing',
        '`RegisteredToken` account for a particular mint. This instruction is',
        'owner-only, meaning that only the owner of the program (defined in the',
        '[Config] account) can deregister a token.',
      ],
      accounts: [
        {
          name: 'owner',
          isMut: false,
          isSigner: true,
          docs: [
            'Owner of the program set in the [`SenderConfig`] account. Signer for',
            'closing [`RegisteredToken`] account.',
          ],
        },
        {
          name: 'config',
          isMut: false,
          isSigner: false,
          docs: [
            'Sender Config account. This program requires that the `owner` specified',
            'in the context equals the pubkey specified in this account. Read-only.',
          ],
        },
        {
          name: 'mint',
          isMut: false,
          isSigner: false,
          docs: [
            'Mint info. This is the SPL token that will be bridged over to the',
            'foreign contract.',
          ],
        },
        {
          name: 'registeredToken',
          isMut: true,
          isSigner: false,
          docs: [
            'Registered Token account. This account stores information about the',
            'token, including the swap rate and max native swap amount. This account',
            'also determines if a mint is registered or not.',
          ],
        },
      ],
      args: [],
    },
    {
      name: 'updateRelayerFee',
      docs: [
        'This instruction updates the `relayer_fee` in the `ForeignContract` account.',
        'The `relayer_fee` is scaled by the `relayer_fee_precision`. For example,',
        'if the `relayer_fee` is $15 and the `relayer_fee_precision` is 1000000,',
        'the `relayer_fee` should be set to 15000000. This instruction can',
        'only be called by the owner or assistant, which are defined in the',
        '[OwnerConfig] account.',
        '',
        '# Arguments',
        '',
        '* `ctx`   - `UpdateRelayerFee` context',
        '* `chain` - Wormhole Chain ID',
        '* `fee`   - Relayer fee scaled by the `relayer_fee_precision`',
      ],
      accounts: [
        {
          name: 'payer',
          isMut: true,
          isSigner: true,
          docs: ['Signer of the transaction. Must be the owner or assistant.'],
        },
        {
          name: 'ownerConfig',
          isMut: false,
          isSigner: false,
          docs: [
            'The owner_config is used when updating the swap rate',
            'so that the assistant key can be used in addition to the',
            'owner key.',
          ],
        },
        {
          name: 'foreignContract',
          isMut: true,
          isSigner: false,
          docs: [
            'This account holds the USD denominated relayer fee for the specified',
            '`chain`. This account is used to determine the cost of relaying',
            'a transfer to a target chain. If there already is a relayer fee',
            'saved in this account, overwrite it.',
          ],
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
          docs: ['System program.'],
        },
      ],
      args: [
        {
          name: 'chain',
          type: 'u16',
        },
        {
          name: 'fee',
          type: 'u64',
        },
      ],
    },
    {
      name: 'updateRelayerFeePrecision',
      docs: [
        'This instruction updates the `relayer_fee_precision` in the',
        '`SenderConfig` and `RedeemerConfig` accounts. The `relayer_fee_precision`',
        'is used to scale the `relayer_fee`. This instruction is owner-only,',
        'meaning that only the owner of the program (defined in the [Config]',
        'account) can register a token.',
        '',
        '# Arguments',
        '',
        '* `ctx` - `UpdatePrecision` context',
        '* `relayer_fee_precision` - Precision used to scale the relayer fee.',
      ],
      accounts: [
        {
          name: 'owner',
          isMut: false,
          isSigner: true,
          docs: [
            'Owner of the program set in the [`RedeemerConfig`] and [`SenderConfig`] account.',
          ],
        },
        {
          name: 'redeemerConfig',
          isMut: true,
          isSigner: false,
          docs: [
            'Redeemer Config account. This program requires that the `owner`',
            'specified in the context equals the pubkey specified in this account.',
            'Mutable.',
          ],
        },
        {
          name: 'senderConfig',
          isMut: true,
          isSigner: false,
          docs: [
            'Sender Config account. This program requires that the `owner`',
            'specified in the context equals the pubkey specified in this account.',
            'Mutable. The `owner` check is redundant here, but we keep it as an',
            'extra protection for future changes to the context. Mutable.',
          ],
        },
      ],
      args: [
        {
          name: 'relayerFeePrecision',
          type: 'u32',
        },
      ],
    },
    {
      name: 'updateSwapRate',
      docs: [
        'This instruction updates the `swap_rate` in the `RegisteredToken`',
        'account. This instruction can only be called by the owner or',
        'assistant, which are defined in the [OwnerConfig] account.',
        '',
        '# Arguments',
        '',
        '* `ctx`       - `UpdateSwapRate` context',
        '* `swap_rate` - USD conversion rate for the specified token.',
      ],
      accounts: [
        {
          name: 'owner',
          isMut: false,
          isSigner: true,
          docs: [
            'The signer of the transaction. Must be the owner or assistant.',
          ],
        },
        {
          name: 'ownerConfig',
          isMut: false,
          isSigner: false,
          docs: [
            'The owner_config is used when updating the swap rate so that the',
            'assistant key can be used in additional to the owner key.',
          ],
        },
        {
          name: 'registeredToken',
          isMut: true,
          isSigner: false,
          docs: [
            'Registered Token account. This account stores information about the',
            'token, including the swap rate and max native swap amount. The program',
            'will modify this account to update the swap rate. Mutable.',
          ],
        },
        {
          name: 'mint',
          isMut: false,
          isSigner: false,
          docs: [
            'Mint info. This is the SPL token that will be bridged over to the',
            'foreign contract.',
          ],
        },
      ],
      args: [
        {
          name: 'swapRate',
          type: 'u64',
        },
      ],
    },
    {
      name: 'updateMaxNativeSwapAmount',
      docs: [
        'This instruction updates the `max_native_swap_amount` in the',
        '`RegisteredToken` account. This instruction is owner-only,',
        'meaning that only the owner of the program (defined in the [Config]',
        'account) can register a token.',
        '',
        '# Arguments',
        '',
        '* `ctx` - `UpdateMaxNativeSwapAmount` context',
        '* `max_native_swap_amount`:',
        '- Maximum amount of native tokens that can be swapped for this token',
        '- on this chain.',
      ],
      accounts: [
        {
          name: 'owner',
          isMut: false,
          isSigner: true,
          docs: [
            'Owner of the program set in the [`SenderConfig`] account. Signer for',
            'creating [`ForeignContract`] account.',
          ],
        },
        {
          name: 'config',
          isMut: false,
          isSigner: false,
          docs: [
            'Sender Config account. This program requires that the `owner` specified',
            'in the context equals the pubkey specified in this account. Read-only.',
          ],
        },
        {
          name: 'registeredToken',
          isMut: true,
          isSigner: false,
          docs: [
            'Registered Token account. This account stores information about the',
            'token, including the swap rate and max native swap amount. The program',
            'will modify this account when the swap rate or max native swap amount',
            'changes. Mutable.',
          ],
        },
        {
          name: 'mint',
          isMut: false,
          isSigner: false,
          docs: [
            'Mint info. This is the SPL token that will be bridged over to the',
            'foreign contract.',
          ],
        },
      ],
      args: [
        {
          name: 'maxNativeSwapAmount',
          type: 'u64',
        },
      ],
    },
    {
      name: 'setPauseForTransfers',
      docs: [
        'This instruction updates the `paused` boolean in the `SenderConfig`',
        'account. This instruction is owner-only, meaning that only the owner',
        'of the program (defined in the [Config] account) can pause outbound',
        'transfers.',
        '',
        '# Arguments',
        '',
        '* `ctx` - `PauseOutboundTransfers` context',
        '* `paused` - Boolean indicating whether outbound transfers are paused.',
      ],
      accounts: [
        {
          name: 'owner',
          isMut: false,
          isSigner: true,
          docs: ['Owner of the program set in the [`SenderConfig`] account.'],
        },
        {
          name: 'config',
          isMut: true,
          isSigner: false,
          docs: [
            'Sender Config account. This program requires that the `owner` specified',
            'in the context equals the pubkey specified in this account. Mutable.',
          ],
        },
      ],
      args: [
        {
          name: 'paused',
          type: 'bool',
        },
      ],
    },
    {
      name: 'submitOwnershipTransferRequest',
      docs: [
        'This instruction sets the `pending_owner` field in the `OwnerConfig`',
        'account. This instruction is owner-only, meaning that only the owner',
        'of the program (defined in the [Config] account) can submit an',
        'ownership transfer request.',
        '',
        '# Arguments',
        '',
        '* `ctx`       - `ManageOwnership` context',
        '* `new_owner` - Pubkey of the pending owner.',
      ],
      accounts: [
        {
          name: 'owner',
          isMut: false,
          isSigner: true,
          docs: ['Owner of the program set in the [`OwnerConfig`] account.'],
        },
        {
          name: 'ownerConfig',
          isMut: true,
          isSigner: false,
          docs: [
            'Owner Config account. This program requires that the `owner` specified',
            'in the context equals the pubkey specified in this account. Mutable.',
          ],
        },
      ],
      args: [
        {
          name: 'newOwner',
          type: 'publicKey',
        },
      ],
    },
    {
      name: 'confirmOwnershipTransferRequest',
      docs: [
        'This instruction confirms that the `pending_owner` is the signer of',
        'the transaction and updates the `owner` field in the `SenderConfig`,',
        '`RedeemerConfig`, and `OwnerConfig` accounts.',
      ],
      accounts: [
        {
          name: 'pendingOwner',
          isMut: false,
          isSigner: true,
          docs: [
            'Must be the pending owner of the program set in the [`OwnerConfig`]',
            'account.',
          ],
        },
        {
          name: 'ownerConfig',
          isMut: true,
          isSigner: false,
          docs: [
            'Owner Config account. This program requires that the `pending_owner`',
            'specified in the context equals the pubkey specified in this account.',
          ],
        },
        {
          name: 'senderConfig',
          isMut: true,
          isSigner: false,
          docs: [
            'Sender Config account. This instruction will update the `owner`',
            'specified in this account to the `pending_owner` specified in the',
            '[`OwnerConfig`] account. Mutable.',
          ],
        },
        {
          name: 'redeemerConfig',
          isMut: true,
          isSigner: false,
          docs: [
            'Redeemer Config account. This instruction will update the `owner`',
            'specified in this account to the `pending_owner` specified in the',
            '[`OwnerConfig`] account. Mutable.',
          ],
        },
      ],
      args: [],
    },
    {
      name: 'cancelOwnershipTransferRequest',
      docs: [
        'This instruction cancels the ownership transfer request by setting',
        'the `pending_owner` field in the `OwnerConfig` account to `None`.',
        'This instruction is owner-only, meaning that only the owner of the',
        'program (defined in the [Config] account) can cancel an ownership',
        'transfer request.',
      ],
      accounts: [
        {
          name: 'owner',
          isMut: false,
          isSigner: true,
          docs: ['Owner of the program set in the [`OwnerConfig`] account.'],
        },
        {
          name: 'ownerConfig',
          isMut: true,
          isSigner: false,
          docs: [
            'Owner Config account. This program requires that the `owner` specified',
            'in the context equals the pubkey specified in this account. Mutable.',
          ],
        },
      ],
      args: [],
    },
    {
      name: 'updateAssistant',
      docs: [
        'This instruction updates the `assistant` field in the `OwnerConfig`',
        'account. This instruction is owner-only, meaning that only the owner',
        'of the program (defined in the [Config] account) can update the',
        'assistant.',
        '',
        '# Arguments',
        '',
        '* `ctx` - `ManageOwnership` context',
        '* `new_assistant` - Pubkey of the new assistant.',
      ],
      accounts: [
        {
          name: 'owner',
          isMut: false,
          isSigner: true,
          docs: ['Owner of the program set in the [`OwnerConfig`] account.'],
        },
        {
          name: 'ownerConfig',
          isMut: true,
          isSigner: false,
          docs: [
            'Owner Config account. This program requires that the `owner` specified',
            'in the context equals the pubkey specified in this account. Mutable.',
          ],
        },
      ],
      args: [
        {
          name: 'newAssistant',
          type: 'publicKey',
        },
      ],
    },
    {
      name: 'updateFeeRecipient',
      docs: [
        'This instruction updates the `fee_recipient` field in the `RedeemerConfig`',
        'account. This instruction is owner-only, meaning that only the owner',
        'of the program (defined in the [Config] account) can update the',
        'fee recipient.',
        '',
        '# Arguments',
        '',
        '* `ctx` - `UpdateFeeRecipient` context',
        '* `new_fee_recipient` - Pubkey of the new fee recipient.',
      ],
      accounts: [
        {
          name: 'owner',
          isMut: false,
          isSigner: true,
          docs: ['Owner of the program set in the [`RedeemerConfig`] account.'],
        },
        {
          name: 'redeemerConfig',
          isMut: true,
          isSigner: false,
          docs: [
            'Redeemer Config account, which saves program data useful for other',
            'instructions, specifically for inbound transfers. Also saves the payer',
            "of the [`initialize`](crate::initialize) instruction as the program's",
            'owner.',
          ],
        },
      ],
      args: [
        {
          name: 'newFeeRecipient',
          type: 'publicKey',
        },
      ],
    },
    {
      name: 'transferNativeTokensWithRelay',
      docs: [
        'This instruction is used to transfer native tokens from Solana to a',
        'foreign blockchain. The user can optionally specify a',
        '`to_native_token_amount` to swap some of the tokens for the native',
        'asset on the target chain. For a fee, an off-chain relayer will redeem',
        'the transfer on the target chain. If the user is transferring native',
        'SOL, the contract will automatically wrap the lamports into a WSOL.',
        '',
        '# Arguments',
        '',
        '* `ctx` - `TransferNativeWithRelay` context',
        '* `amount` - Amount of tokens to send',
        '* `to_native_token_amount`:',
        '- Amount of tokens to swap for native assets on the target chain',
        '* `recipient_chain` - Chain ID of the target chain',
        '* `recipient_address` - Address of the target wallet on the target chain',
        '* `batch_id` - Nonce of Wormhole message',
        '* `wrap_native` - Whether to wrap native SOL',
      ],
      accounts: [
        {
          name: 'payer',
          isMut: true,
          isSigner: true,
          docs: [
            'Payer will pay Wormhole fee to transfer tokens and create temporary',
            'token account.',
          ],
        },
        {
          name: 'payerSequence',
          isMut: true,
          isSigner: false,
          docs: ["Used to keep track of payer's Wormhole sequence number."],
        },
        {
          name: 'config',
          isMut: false,
          isSigner: false,
          docs: [
            'Sender Config account. Acts as the signer for the Token Bridge token',
            'transfer. Read-only.',
          ],
        },
        {
          name: 'foreignContract',
          isMut: false,
          isSigner: false,
          docs: [
            'Foreign Contract account. Send tokens to the contract specified in this',
            'account. Funnily enough, the Token Bridge program does not have any',
            'requirements for outbound transfers for the recipient chain to be',
            'registered. This account provides extra protection against sending',
            'tokens to an unregistered Wormhole chain ID. Read-only.',
          ],
        },
        {
          name: 'mint',
          isMut: true,
          isSigner: false,
          docs: [
            'Mint info. This is the SPL token that will be bridged over to the',
            'foreign contract. Mutable.',
          ],
        },
        {
          name: 'fromTokenAccount',
          isMut: true,
          isSigner: false,
          docs: [
            "Payer's associated token account. We may want to make this a generic",
            'token account in the future.',
          ],
        },
        {
          name: 'registeredToken',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tmpTokenAccount',
          isMut: true,
          isSigner: false,
          docs: [
            "Program's temporary token account. This account is created before the",
            "instruction is invoked to temporarily take custody of the payer's",
            'tokens. When the tokens are finally bridged out, the token account',
            'will have zero balance and can be closed.',
          ],
        },
        {
          name: 'tokenBridgeConfig',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tokenBridgeCustody',
          isMut: true,
          isSigner: false,
          docs: [
            "account that holds this mint's balance. This account needs to be",
            'unchecked because a token account may not have been created for this',
            'mint yet. Mutable.',
          ],
        },
        {
          name: 'tokenBridgeAuthoritySigner',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tokenBridgeCustodySigner',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'wormholeBridge',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'wormholeMessage',
          isMut: true,
          isSigner: false,
          docs: [
            'tokens transferred in this account for our program. Mutable.',
          ],
        },
        {
          name: 'tokenBridgeEmitter',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tokenBridgeSequence',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'wormholeFeeCollector',
          isMut: true,
          isSigner: false,
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
        {
          name: 'wormholeProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tokenBridgeProgram',
          isMut: false,
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
      ],
      args: [
        {
          name: 'amount',
          type: 'u64',
        },
        {
          name: 'toNativeTokenAmount',
          type: 'u64',
        },
        {
          name: 'recipientChain',
          type: 'u16',
        },
        {
          name: 'recipientAddress',
          type: {
            array: ['u8', 32],
          },
        },
        {
          name: 'batchId',
          type: 'u32',
        },
        {
          name: 'wrapNative',
          type: 'bool',
        },
      ],
    },
    {
      name: 'transferWrappedTokensWithRelay',
      docs: [
        'This instruction is used to transfer wrapped tokens from Solana to a',
        'foreign blockchain. The user can optionally specify a',
        '`to_native_token_amount` to swap some of the tokens for the native',
        'assets on the target chain. For a fee, an off-chain relayer will redeem',
        'the transfer on the target chain. This instruction should only be called',
        'when the user is transferring a wrapped token.',
        '',
        '# Arguments',
        '',
        '* `ctx` - `TransferWrappedWithRelay` context',
        '* `amount` - Amount of tokens to send',
        '* `to_native_token_amount`:',
        '- Amount of tokens to swap for native assets on the target chain',
        '* `recipient_chain` - Chain ID of the target chain',
        '* `recipient_address` - Address of the target wallet on the target chain',
        '* `batch_id` - Nonce of Wormhole message',
      ],
      accounts: [
        {
          name: 'payer',
          isMut: true,
          isSigner: true,
          docs: ['Payer will pay Wormhole fee to transfer tokens.'],
        },
        {
          name: 'payerSequence',
          isMut: true,
          isSigner: false,
          docs: ["Used to keep track of payer's Wormhole sequence number."],
        },
        {
          name: 'config',
          isMut: false,
          isSigner: false,
          docs: [
            'Sender Config account. Acts as the Token Bridge sender PDA. Mutable.',
          ],
        },
        {
          name: 'foreignContract',
          isMut: false,
          isSigner: false,
          docs: [
            'Foreign Contract account. Send tokens to the contract specified in this',
            'account. Funnily enough, the Token Bridge program does not have any',
            'requirements for outbound transfers for the recipient chain to be',
            'registered. This account provides extra protection against sending',
            'tokens to an unregistered Wormhole chain ID. Read-only.',
          ],
        },
        {
          name: 'tokenBridgeWrappedMint',
          isMut: true,
          isSigner: false,
          docs: [
            'Token Bridge wrapped mint info. This is the SPL token that will be',
            'bridged to the foreign contract. The wrapped mint PDA must agree',
            "with the native token's metadata. Mutable.",
          ],
        },
        {
          name: 'fromTokenAccount',
          isMut: true,
          isSigner: false,
          docs: [
            "Payer's associated token account. We may want to make this a generic",
            'token account in the future.',
          ],
        },
        {
          name: 'registeredToken',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tmpTokenAccount',
          isMut: true,
          isSigner: false,
          docs: [
            "Program's temporary token account. This account is created before the",
            "instruction is invoked to temporarily take custody of the payer's",
            'tokens. When the tokens are finally bridged out, the token account',
            'will have zero balance and can be closed.',
          ],
        },
        {
          name: 'tokenBridgeWrappedMeta',
          isMut: false,
          isSigner: false,
          docs: [
            'about the token from its native chain:',
            '* Wormhole Chain ID',
            "* Token's native contract address",
            "* Token's native decimals",
          ],
        },
        {
          name: 'tokenBridgeConfig',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tokenBridgeAuthoritySigner',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'wormholeBridge',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'wormholeMessage',
          isMut: true,
          isSigner: false,
          docs: ['tokens transferred in this account.'],
        },
        {
          name: 'tokenBridgeEmitter',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tokenBridgeSequence',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'wormholeFeeCollector',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'wormholeProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tokenBridgeProgram',
          isMut: false,
          isSigner: false,
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
      ],
      args: [
        {
          name: 'amount',
          type: 'u64',
        },
        {
          name: 'toNativeTokenAmount',
          type: 'u64',
        },
        {
          name: 'recipientChain',
          type: 'u16',
        },
        {
          name: 'recipientAddress',
          type: {
            array: ['u8', 32],
          },
        },
        {
          name: 'batchId',
          type: 'u32',
        },
      ],
    },
    {
      name: 'completeNativeTransferWithRelay',
      docs: [
        'This instruction is used to redeem token transfers from foreign emitters.',
        'It takes custody of the released native tokens and sends the tokens to the',
        'encoded `recipient`. It pays the `fee_recipient` in the token',
        'denomination. If requested by the user, it will perform a swap with the',
        'off-chain relayer to provide the user with lamports. If the token',
        'being transferred is WSOL, the contract will unwrap the WSOL and send',
        'the lamports to the recipient and pay the relayer in lamports.',
        '',
        '# Arguments',
        '',
        '* `ctx` - `CompleteNativeWithRelay` context',
        '* `vaa_hash` - Hash of the VAA that triggered the transfer',
      ],
      accounts: [
        {
          name: 'payer',
          isMut: true,
          isSigner: true,
          docs: [
            'Payer will pay Wormhole fee to transfer tokens and create temporary',
            'token account.',
          ],
        },
        {
          name: 'config',
          isMut: false,
          isSigner: false,
          docs: [
            'Redeemer Config account. Acts as the Token Bridge redeemer, which signs',
            'for the complete transfer instruction. Read-only.',
          ],
        },
        {
          name: 'feeRecipientTokenAccount',
          isMut: true,
          isSigner: false,
          docs: [
            "Fee recipient's token account. Must be an associated token account. Mutable.",
          ],
        },
        {
          name: 'foreignContract',
          isMut: false,
          isSigner: false,
          docs: [
            'Foreign Contract account. The registered contract specified in this',
            "account must agree with the target address for the Token Bridge's token",
            'transfer. Read-only.',
          ],
        },
        {
          name: 'mint',
          isMut: false,
          isSigner: false,
          docs: [
            'Mint info. This is the SPL token that will be bridged over from the',
            'foreign contract. This must match the token address specified in the',
            'signed Wormhole message. Read-only.',
          ],
        },
        {
          name: 'recipientTokenAccount',
          isMut: true,
          isSigner: false,
          docs: [
            'Recipient associated token account. The recipient authority check',
            'is necessary to ensure that the recipient is the intended recipient',
            'of the bridged tokens. Mutable.',
          ],
        },
        {
          name: 'recipient',
          isMut: true,
          isSigner: false,
          docs: [
            'transaction. This instruction verifies that the recipient key',
            'passed in this context matches the intended recipient in the vaa.',
          ],
        },
        {
          name: 'registeredToken',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'nativeRegisteredToken',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tmpTokenAccount',
          isMut: true,
          isSigner: false,
          docs: [
            "Program's temporary token account. This account is created before the",
            "instruction is invoked to temporarily take custody of the payer's",
            'tokens. When the tokens are finally bridged in, the tokens will be',
            'transferred to the destination token accounts. This account will have',
            'zero balance and can be closed.',
          ],
        },
        {
          name: 'tokenBridgeConfig',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'vaa',
          isMut: false,
          isSigner: false,
          docs: [
            'Verified Wormhole message account. The Wormhole program verified',
            'signatures and posted the account data here. Read-only.',
          ],
        },
        {
          name: 'tokenBridgeClaim',
          isMut: true,
          isSigner: false,
          docs: [
            'is true if the bridged assets have been claimed. If the transfer has',
            'not been redeemed, this account will not exist yet.',
            '',
            "NOTE: The Token Bridge program's claim account is only initialized when",
            'a transfer is redeemed (and the boolean value `true` is written as',
            'its data).',
            '',
            'The Token Bridge program will automatically fail if this transfer',
            'is redeemed again. But we choose to short-circuit the failure as the',
            'first evaluation of this instruction.',
          ],
        },
        {
          name: 'tokenBridgeForeignEndpoint',
          isMut: false,
          isSigner: false,
          docs: [
            'endpoint per chain, but the PDA allows for multiple endpoints for each',
            'chain! We store the proper endpoint for the emitter chain.',
          ],
        },
        {
          name: 'tokenBridgeCustody',
          isMut: true,
          isSigner: false,
          docs: ["account that holds this mint's balance."],
        },
        {
          name: 'tokenBridgeCustodySigner',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'wormholeProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tokenBridgeProgram',
          isMut: false,
          isSigner: false,
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
        {
          name: 'rent',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'vaaHash',
          type: {
            array: ['u8', 32],
          },
        },
      ],
    },
    {
      name: 'completeWrappedTransferWithRelay',
      docs: [
        'This instruction is used to redeem token transfers from foreign emitters.',
        'It takes custody of the minted wrapped tokens and sends the tokens to the',
        'encoded `recipient`. It pays the `fee_recipient` in the wrapped-token',
        'denomination. If requested by the user, it will perform a swap with the',
        'off-chain relayer to provide the user with lamports.',
        '',
        '# Arguments',
        '',
        '* `ctx` - `CompleteWrappedWithRelay` context',
        '* `vaa_hash` - Hash of the VAA that triggered the transfer',
      ],
      accounts: [
        {
          name: 'payer',
          isMut: true,
          isSigner: true,
          docs: [
            'Payer will pay Wormhole fee to transfer tokens and create temporary',
            'token account.',
          ],
        },
        {
          name: 'config',
          isMut: false,
          isSigner: false,
          docs: [
            'Redeemer Config account. Acts as the Token Bridge redeemer, which signs',
            'for the complete transfer instruction. Read-only.',
          ],
        },
        {
          name: 'feeRecipientTokenAccount',
          isMut: true,
          isSigner: false,
          docs: [
            "Fee recipient's token account. Must be an associated token account. Mutable.",
          ],
        },
        {
          name: 'foreignContract',
          isMut: false,
          isSigner: false,
          docs: [
            'Foreign Contract account. The registered contract specified in this',
            "account must agree with the target address for the Token Bridge's token",
            'transfer. Read-only.',
          ],
        },
        {
          name: 'tokenBridgeWrappedMint',
          isMut: true,
          isSigner: false,
          docs: [
            'Token Bridge wrapped mint info. This is the SPL token that will be',
            'bridged from the foreign contract. The wrapped mint PDA must agree',
            "with the native token's metadata in the wormhole message. Mutable.",
          ],
        },
        {
          name: 'recipientTokenAccount',
          isMut: true,
          isSigner: false,
          docs: [
            'Recipient associated token account. The recipient authority check',
            'is necessary to ensure that the recipient is the intended recipient',
            'of the bridged tokens. Mutable.',
          ],
        },
        {
          name: 'recipient',
          isMut: true,
          isSigner: false,
          docs: [
            'transaction. This instruction verifies that the recipient key',
            'passed in this context matches the intended recipient in the vaa.',
          ],
        },
        {
          name: 'registeredToken',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'nativeRegisteredToken',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tmpTokenAccount',
          isMut: true,
          isSigner: false,
          docs: [
            "Program's temporary token account. This account is created before the",
            "instruction is invoked to temporarily take custody of the payer's",
            'tokens. When the tokens are finally bridged in, the tokens will be',
            'transferred to the destination token accounts. This account will have',
            'zero balance and can be closed.',
          ],
        },
        {
          name: 'tokenBridgeWrappedMeta',
          isMut: false,
          isSigner: false,
          docs: [
            'about the token from its native chain:',
            '* Wormhole Chain ID',
            "* Token's native contract address",
            "* Token's native decimals",
          ],
        },
        {
          name: 'tokenBridgeConfig',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'vaa',
          isMut: false,
          isSigner: false,
          docs: [
            'Verified Wormhole message account. The Wormhole program verified',
            'signatures and posted the account data here. Read-only.',
          ],
        },
        {
          name: 'tokenBridgeClaim',
          isMut: true,
          isSigner: false,
          docs: [
            'is true if the bridged assets have been claimed. If the transfer has',
            'not been redeemed, this account will not exist yet.',
            '',
            "NOTE: The Token Bridge program's claim account is only initialized when",
            'a transfer is redeemed (and the boolean value `true` is written as',
            'its data).',
            '',
            'The Token Bridge program will automatically fail if this transfer',
            'is redeemed again. But we choose to short-circuit the failure as the',
            'first evaluation of this instruction.',
          ],
        },
        {
          name: 'tokenBridgeForeignEndpoint',
          isMut: false,
          isSigner: false,
          docs: [
            'endpoint per chain, but the PDA allows for multiple endpoints for each',
            'chain! We store the proper endpoint for the emitter chain.',
          ],
        },
        {
          name: 'tokenBridgeMintAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'wormholeProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tokenBridgeProgram',
          isMut: false,
          isSigner: false,
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
        {
          name: 'rent',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'vaaHash',
          type: {
            array: ['u8', 32],
          },
        },
      ],
    },
  ],
  accounts: [
    {
      name: 'foreignContract',
      docs: ['Foreign emitter account data.'],
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'chain',
            docs: ["Emitter chain. Cannot equal `1` (Solana's Chain ID)."],
            type: 'u16',
          },
          {
            name: 'address',
            docs: ['Emitter address. Cannot be zero address.'],
            type: {
              array: ['u8', 32],
            },
          },
          {
            name: 'tokenBridgeForeignEndpoint',
            docs: ["Token Bridge program's foreign endpoint account key."],
            type: 'publicKey',
          },
          {
            name: 'fee',
            docs: [
              'The fee that is paid to the `fee_recipient` upon redeeming a transfer.',
              'This value is set in terms of USD and scaled by the `relayer_fee_precision`.',
              'For example, if the `relayer_fee_precision` is `100000000` and the intended',
              'fee is $5, then the `fee` value should be `500000000`.',
            ],
            type: 'u64',
          },
        ],
      },
    },
    {
      name: 'ownerConfig',
      docs: ['Owner account data.'],
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'owner',
            docs: ["Program's owner."],
            type: 'publicKey',
          },
          {
            name: 'assistant',
            docs: [
              "Program's assistant. Can be used to update the relayer fee and swap rate.",
            ],
            type: 'publicKey',
          },
          {
            name: 'pendingOwner',
            docs: [
              'Intermediate storage for the pending owner. Is used to transfer ownership.',
            ],
            type: {
              option: 'publicKey',
            },
          },
        ],
      },
    },
    {
      name: 'redeemerConfig',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'owner',
            docs: ["Program's owner."],
            type: 'publicKey',
          },
          {
            name: 'bump',
            docs: ['PDA bump.'],
            type: 'u8',
          },
          {
            name: 'relayerFeePrecision',
            docs: ['Relayer fee and swap rate precision.'],
            type: 'u32',
          },
          {
            name: 'feeRecipient',
            docs: ['Recipient of all relayer fees and swap proceeds.'],
            type: 'publicKey',
          },
        ],
      },
    },
    {
      name: 'registeredToken',
      docs: ['Registered token account data.'],
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'swapRate',
            docs: [
              'Token swap rate. The swap rate is the USD conversion rate of the token.',
            ],
            type: 'u64',
          },
          {
            name: 'maxNativeSwapAmount',
            docs: [
              'Maximum amount of native SOL the contract will swap for each transfer.',
            ],
            type: 'u64',
          },
        ],
      },
    },
    {
      name: 'senderConfig',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'owner',
            docs: ["Program's owner."],
            type: 'publicKey',
          },
          {
            name: 'bump',
            docs: ['PDA bump.'],
            type: 'u8',
          },
          {
            name: 'tokenBridge',
            docs: ["Token Bridge program's relevant addresses."],
            type: {
              defined: 'OutboundTokenBridgeAddresses',
            },
          },
          {
            name: 'relayerFeePrecision',
            docs: ['Relayer fee and swap rate precision.'],
            type: 'u32',
          },
          {
            name: 'paused',
            docs: ['Boolean indicating whether outbound transfers are paused.'],
            type: 'bool',
          },
        ],
      },
    },
    {
      name: 'signerSequence',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'value',
            type: 'u64',
          },
        ],
      },
    },
  ],
  types: [
    {
      name: 'OutboundTokenBridgeAddresses',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'sequence',
            type: 'publicKey',
          },
        ],
      },
    },
    {
      name: 'TokenBridgeRelayerMessage',
      docs: [
        'Expected message types for this program. Only valid payloads are:',
        '* `TransferWithRelay`: Payload ID == 1.',
        '',
        'Payload IDs are encoded as u8.',
      ],
      type: {
        kind: 'enum',
        variants: [
          {
            name: 'TransferWithRelay',
            fields: [
              {
                name: 'target_relayer_fee',
                type: 'u64',
              },
              {
                name: 'to_native_token_amount',
                type: 'u64',
              },
              {
                name: 'recipient',
                type: {
                  array: ['u8', 32],
                },
              },
            ],
          },
        ],
      },
    },
  ],
  errors: [
    {
      code: 6000,
      name: 'InvalidWormholeBridge',
      msg: 'InvalidWormholeBridge',
    },
    {
      code: 6001,
      name: 'InvalidWormholeFeeCollector',
      msg: 'InvalidWormholeFeeCollector',
    },
    {
      code: 6002,
      name: 'OwnerOnly',
      msg: 'OwnerOnly',
    },
    {
      code: 6003,
      name: 'OutboundTransfersPaused',
      msg: 'OutboundTransfersPaused',
    },
    {
      code: 6004,
      name: 'OwnerOrAssistantOnly',
      msg: 'OwnerOrAssistantOnly',
    },
    {
      code: 6005,
      name: 'NotPendingOwner',
      msg: 'NotPendingOwner',
    },
    {
      code: 6006,
      name: 'AlreadyTheOwner',
      msg: 'AlreadyTheOwner',
    },
    {
      code: 6007,
      name: 'AlreadyTheAssistant',
      msg: 'AlreadyTheAssistant',
    },
    {
      code: 6008,
      name: 'AlreadyTheFeeRecipient',
      msg: 'AlreadyTheFeeRecipient',
    },
    {
      code: 6009,
      name: 'BumpNotFound',
      msg: 'BumpNotFound',
    },
    {
      code: 6010,
      name: 'FailedToMakeImmutable',
      msg: 'FailedToMakeImmutable',
    },
    {
      code: 6011,
      name: 'InvalidForeignContract',
      msg: 'InvalidForeignContract',
    },
    {
      code: 6012,
      name: 'ZeroBridgeAmount',
      msg: 'ZeroBridgeAmount',
    },
    {
      code: 6013,
      name: 'InvalidToNativeAmount',
      msg: 'InvalidToNativeAmount',
    },
    {
      code: 6014,
      name: 'NativeMintRequired',
      msg: 'NativeMintRequired',
    },
    {
      code: 6015,
      name: 'SwapsNotAllowedForNativeMint',
      msg: 'SwapsNotAllowedForNativeMint',
    },
    {
      code: 6016,
      name: 'InvalidTokenBridgeConfig',
      msg: 'InvalidTokenBridgeConfig',
    },
    {
      code: 6017,
      name: 'InvalidTokenBridgeAuthoritySigner',
      msg: 'InvalidTokenBridgeAuthoritySigner',
    },
    {
      code: 6018,
      name: 'InvalidTokenBridgeCustodySigner',
      msg: 'InvalidTokenBridgeCustodySigner',
    },
    {
      code: 6019,
      name: 'InvalidTokenBridgeEmitter',
      msg: 'InvalidTokenBridgeEmitter',
    },
    {
      code: 6020,
      name: 'InvalidTokenBridgeSequence',
      msg: 'InvalidTokenBridgeSequence',
    },
    {
      code: 6021,
      name: 'InvalidRecipient',
      msg: 'InvalidRecipient',
    },
    {
      code: 6022,
      name: 'InvalidTransferToChain',
      msg: 'InvalidTransferToChain',
    },
    {
      code: 6023,
      name: 'InvalidTransferTokenChain',
      msg: 'InvalidTransferTokenChain',
    },
    {
      code: 6024,
      name: 'InvalidPrecision',
      msg: 'InvalidPrecision',
    },
    {
      code: 6025,
      name: 'InvalidTransferToAddress',
      msg: 'InvalidTransferToAddress',
    },
    {
      code: 6026,
      name: 'AlreadyRedeemed',
      msg: 'AlreadyRedeemed',
    },
    {
      code: 6027,
      name: 'InvalidTokenBridgeForeignEndpoint',
      msg: 'InvalidTokenBridgeForeignEndpoint',
    },
    {
      code: 6028,
      name: 'InvalidTokenBridgeMintAuthority',
      msg: 'InvalidTokenBridgeMintAuthority',
    },
    {
      code: 6029,
      name: 'InvalidPublicKey',
      msg: 'InvalidPublicKey',
    },
    {
      code: 6030,
      name: 'ZeroSwapRate',
      msg: 'ZeroSwapRate',
    },
    {
      code: 6031,
      name: 'TokenNotRegistered',
      msg: 'TokenNotRegistered',
    },
    {
      code: 6032,
      name: 'ChainNotRegistered',
      msg: 'ChainNotRegistered',
    },
    {
      code: 6033,
      name: 'TokenAlreadyRegistered',
      msg: 'TokenAlreadyRegistered',
    },
    {
      code: 6034,
      name: 'FeeCalculationError',
      msg: 'TokenFeeCalculationError',
    },
    {
      code: 6035,
      name: 'InvalidSwapCalculation',
      msg: 'InvalidSwapCalculation',
    },
    {
      code: 6036,
      name: 'InsufficientFunds',
      msg: 'InsufficientFunds',
    },
  ],
};
