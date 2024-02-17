export type ExampleNativeTokenTransfers = {
  version: '0.1.0';
  name: 'example_native_token_transfers';
  instructions: [
    {
      name: 'initialize';
      accounts: [
        {
          name: 'payer';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'owner';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'config';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'mint';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'seq';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'rateLimit';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'tokenAuthority';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'custody';
          isMut: true;
          isSigner: false;
          docs: [
            'The custody account that holds tokens in locking mode.',
            'NOTE: the account is unconditionally initialized, but not used in',
            'burning mode.',
          ];
        },
        {
          name: 'tokenProgram';
          isMut: false;
          isSigner: false;
          docs: ['associated token account for the given mint.'];
        },
        {
          name: 'associatedTokenProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: 'args';
          type: {
            defined: 'InitializeArgs';
          };
        },
      ];
    },
    {
      name: 'transferBurn';
      accounts: [
        {
          name: 'common';
          accounts: [
            {
              name: 'payer';
              isMut: true;
              isSigner: true;
            },
            {
              name: 'config';
              accounts: [
                {
                  name: 'config';
                  isMut: false;
                  isSigner: false;
                },
              ];
            },
            {
              name: 'mint';
              isMut: true;
              isSigner: false;
            },
            {
              name: 'from';
              isMut: true;
              isSigner: false;
            },
            {
              name: 'fromAuthority';
              isMut: false;
              isSigner: true;
              docs: ['authority to burn the tokens (owner)'];
            },
            {
              name: 'tokenProgram';
              isMut: false;
              isSigner: false;
            },
            {
              name: 'seq';
              isMut: true;
              isSigner: false;
            },
            {
              name: 'outboxItem';
              isMut: true;
              isSigner: true;
            },
            {
              name: 'outboxRateLimit';
              isMut: true;
              isSigner: false;
            },
            {
              name: 'systemProgram';
              isMut: false;
              isSigner: false;
            },
          ];
        },
        {
          name: 'inboxRateLimit';
          isMut: true;
          isSigner: false;
        },
      ];
      args: [
        {
          name: 'args';
          type: {
            defined: 'TransferArgs';
          };
        },
      ];
    },
    {
      name: 'transferLock';
      accounts: [
        {
          name: 'common';
          accounts: [
            {
              name: 'payer';
              isMut: true;
              isSigner: true;
            },
            {
              name: 'config';
              accounts: [
                {
                  name: 'config';
                  isMut: false;
                  isSigner: false;
                },
              ];
            },
            {
              name: 'mint';
              isMut: true;
              isSigner: false;
            },
            {
              name: 'from';
              isMut: true;
              isSigner: false;
            },
            {
              name: 'fromAuthority';
              isMut: false;
              isSigner: true;
              docs: ['authority to burn the tokens (owner)'];
            },
            {
              name: 'tokenProgram';
              isMut: false;
              isSigner: false;
            },
            {
              name: 'seq';
              isMut: true;
              isSigner: false;
            },
            {
              name: 'outboxItem';
              isMut: true;
              isSigner: true;
            },
            {
              name: 'outboxRateLimit';
              isMut: true;
              isSigner: false;
            },
            {
              name: 'systemProgram';
              isMut: false;
              isSigner: false;
            },
          ];
        },
        {
          name: 'inboxRateLimit';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'tokenAuthority';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'custody';
          isMut: true;
          isSigner: false;
        },
      ];
      args: [
        {
          name: 'args';
          type: {
            defined: 'TransferArgs';
          };
        },
      ];
    },
    {
      name: 'releaseOutbound';
      accounts: [
        {
          name: 'payer';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'config';
          accounts: [
            {
              name: 'config';
              isMut: false;
              isSigner: false;
            },
          ];
        },
        {
          name: 'outboxItem';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'endpoint';
          accounts: [
            {
              name: 'endpoint';
              isMut: false;
              isSigner: false;
            },
          ];
        },
        {
          name: 'wormholeMessage';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'emitter';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'wormholeBridge';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'wormholeFeeCollector';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'wormholeSequence';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'wormholeProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'systemProgram';
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
          name: 'args';
          type: {
            defined: 'ReleaseOutboundArgs';
          };
        },
      ];
    },
    {
      name: 'redeem';
      accounts: [
        {
          name: 'payer';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'config';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'sibling';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'endpointMessage';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'endpoint';
          accounts: [
            {
              name: 'endpoint';
              isMut: false;
              isSigner: false;
            },
          ];
        },
        {
          name: 'inboxItem';
          isMut: true;
          isSigner: false;
          docs: [
            'NOTE: This account is content-addressed (PDA seeded by the message hash).',
            'This is because in a multi-endpoint configuration, the different',
            'endpoints "vote" on messages (by delivering them). By making the inbox',
            "items content-addressed, we can ensure that disagreeing votes don't",
            'interfere with each other.',
          ];
        },
        {
          name: 'inboxRateLimit';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'outboxRateLimit';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: 'args';
          type: {
            defined: 'RedeemArgs';
          };
        },
      ];
    },
    {
      name: 'releaseInboundMint';
      accounts: [
        {
          name: 'common';
          accounts: [
            {
              name: 'payer';
              isMut: true;
              isSigner: true;
            },
            {
              name: 'config';
              accounts: [
                {
                  name: 'config';
                  isMut: false;
                  isSigner: false;
                },
              ];
            },
            {
              name: 'inboxItem';
              isMut: true;
              isSigner: false;
            },
            {
              name: 'recipient';
              isMut: true;
              isSigner: false;
            },
            {
              name: 'tokenAuthority';
              isMut: false;
              isSigner: false;
            },
            {
              name: 'mint';
              isMut: true;
              isSigner: false;
            },
            {
              name: 'tokenProgram';
              isMut: false;
              isSigner: false;
            },
          ];
        },
      ];
      args: [
        {
          name: 'args';
          type: {
            defined: 'ReleaseInboundArgs';
          };
        },
      ];
    },
    {
      name: 'releaseInboundUnlock';
      accounts: [
        {
          name: 'common';
          accounts: [
            {
              name: 'payer';
              isMut: true;
              isSigner: true;
            },
            {
              name: 'config';
              accounts: [
                {
                  name: 'config';
                  isMut: false;
                  isSigner: false;
                },
              ];
            },
            {
              name: 'inboxItem';
              isMut: true;
              isSigner: false;
            },
            {
              name: 'recipient';
              isMut: true;
              isSigner: false;
            },
            {
              name: 'tokenAuthority';
              isMut: false;
              isSigner: false;
            },
            {
              name: 'mint';
              isMut: true;
              isSigner: false;
            },
            {
              name: 'tokenProgram';
              isMut: false;
              isSigner: false;
            },
          ];
        },
        {
          name: 'custody';
          isMut: true;
          isSigner: false;
        },
      ];
      args: [
        {
          name: 'args';
          type: {
            defined: 'ReleaseInboundArgs';
          };
        },
      ];
    },
    {
      name: 'transferOwnership';
      accounts: [
        {
          name: 'config';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'owner';
          isMut: false;
          isSigner: true;
        },
      ];
      args: [
        {
          name: 'args';
          type: {
            defined: 'TransferOwnershipArgs';
          };
        },
      ];
    },
    {
      name: 'claimOwnership';
      accounts: [
        {
          name: 'config';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'newOwner';
          isMut: false;
          isSigner: true;
        },
      ];
      args: [];
    },
    {
      name: 'setPaused';
      accounts: [
        {
          name: 'config';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'owner';
          isMut: false;
          isSigner: true;
        },
      ];
      args: [
        {
          name: 'pause';
          type: 'bool';
        },
      ];
    },
    {
      name: 'setSibling';
      accounts: [
        {
          name: 'config';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'owner';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'payer';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'sibling';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'inboxRateLimit';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'mint';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: 'args';
          type: {
            defined: 'SetSiblingArgs';
          };
        },
      ];
    },
    {
      name: 'registerEndpoint';
      accounts: [
        {
          name: 'config';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'owner';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'payer';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'endpoint';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'registeredEndpoint';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
      ];
      args: [];
    },
    {
      name: 'setOutboundLimit';
      accounts: [
        {
          name: 'config';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'owner';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'rateLimit';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'mint';
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: 'args';
          type: {
            defined: 'SetOutboundLimitArgs';
          };
        },
      ];
    },
    {
      name: 'setInboundLimit';
      accounts: [
        {
          name: 'config';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'owner';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'rateLimit';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'mint';
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: 'args';
          type: {
            defined: 'SetInboundLimitArgs';
          };
        },
      ];
    },
    {
      name: 'setWormholeSibling';
      accounts: [
        {
          name: 'config';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'owner';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'payer';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'sibling';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: 'args';
          type: {
            defined: 'SetEndpointSiblingArgs';
          };
        },
      ];
    },
    {
      name: 'receiveWormholeMessage';
      accounts: [
        {
          name: 'payer';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'config';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'sibling';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'vaa';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'endpointMessage';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
      ];
      args: [];
    },
  ];
  accounts: [
    {
      name: 'config';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'bump';
            type: 'u8';
          },
          {
            name: 'owner';
            docs: ['Owner of the program.'];
            type: 'publicKey';
          },
          {
            name: 'pendingOwner';
            docs: ['Pending next owner (before claiming ownership).'];
            type: {
              option: 'publicKey';
            };
          },
          {
            name: 'mint';
            docs: ['Mint address of the token managed by this program.'];
            type: 'publicKey';
          },
          {
            name: 'tokenProgram';
            docs: [
              'Address of the token program (token or token22). This could always be queried',
              "from the [`mint`] account's owner, but storing it here avoids an indirection",
              'on the client side.',
            ];
            type: 'publicKey';
          },
          {
            name: 'mode';
            docs: [
              'The mode that this program is running in. This is used to determine',
              'whether the program is burning tokens or locking tokens.',
            ];
            type: {
              defined: 'Mode';
            };
          },
          {
            name: 'chainId';
            docs: [
              "The chain id of the chain that this program is running on. We don't",
              'hardcode this so that the program is deployable on any potential SVM',
              'forks.',
            ];
            type: {
              defined: 'ChainId';
            };
          },
          {
            name: 'nextEndpointId';
            docs: ['The next endpoint id to use when registering an endpoint.'];
            type: 'u8';
          },
          {
            name: 'threshold';
            docs: [
              'The number of endpoints that must attest to a transfer before it is',
              'accepted.',
            ];
            type: 'u8';
          },
          {
            name: 'enabledEndpoints';
            docs: ['Bitmap of enabled endpoints'];
            type: {
              defined: 'Bitmap';
            };
          },
          {
            name: 'paused';
            docs: [
              'Pause the program. This is useful for upgrades and other maintenance.',
            ];
            type: 'bool';
          },
        ];
      };
    },
    {
      name: 'endpointSibling';
      docs: [
        'A sibling on another chain. Stored in a PDA seeded by the chain id.',
      ];
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'bump';
            type: 'u8';
          },
          {
            name: 'address';
            type: {
              array: ['u8', 32];
            };
          },
        ];
      };
    },
    {
      name: 'validatedEndpointMessage';
      generics: ['A'];
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'fromChain';
            type: {
              defined: 'ChainId';
            };
          },
          {
            name: 'message';
            type: {
              definedWithTypeArgs: {
                name: 'EndpointMessageData';
                args: [
                  {
                    type: {
                      generic: 'A';
                    };
                  },
                ];
              };
            };
          },
        ];
      };
    },
    {
      name: 'inboxItem';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'init';
            type: 'bool';
          },
          {
            name: 'bump';
            type: 'u8';
          },
          {
            name: 'amount';
            type: {
              defined: 'NormalizedAmount';
            };
          },
          {
            name: 'recipientAddress';
            type: 'publicKey';
          },
          {
            name: 'votes';
            type: {
              defined: 'Bitmap';
            };
          },
          {
            name: 'releaseStatus';
            type: {
              defined: 'ReleaseStatus';
            };
          },
        ];
      };
    },
    {
      name: 'inboxRateLimit';
      docs: [
        'Inbound rate limit per chain.',
        'SECURITY: must check the PDA (since there are multiple PDAs, namely one for each chain.)',
      ];
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'bump';
            type: 'u8';
          },
          {
            name: 'rateLimit';
            type: {
              defined: 'RateLimitState';
            };
          },
        ];
      };
    },
    {
      name: 'outboxItem';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'sequence';
            type: 'u64';
          },
          {
            name: 'amount';
            type: {
              defined: 'NormalizedAmount';
            };
          },
          {
            name: 'sender';
            type: 'publicKey';
          },
          {
            name: 'recipientChain';
            type: {
              defined: 'ChainId';
            };
          },
          {
            name: 'recipientAddress';
            type: {
              array: ['u8', 32];
            };
          },
          {
            name: 'releaseTimestamp';
            type: 'i64';
          },
          {
            name: 'released';
            type: {
              defined: 'Bitmap';
            };
          },
        ];
      };
    },
    {
      name: 'outboxRateLimit';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'rateLimit';
            type: {
              defined: 'RateLimitState';
            };
          },
        ];
      };
    },
    {
      name: 'registeredEndpoint';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'bump';
            type: 'u8';
          },
          {
            name: 'id';
            type: 'u8';
          },
          {
            name: 'endpointAddress';
            type: 'publicKey';
          },
          {
            name: 'enabled';
            docs: [
              'Whether the endpoint is enabled.',
              'NOTE: there is a bitmap in the config account which must be kept in sync',
              'with this. If endpoint disabling is implemented, the bitmap must be updated',
              'in the same transaction as the endpoint account.',
            ];
            type: 'bool';
          },
        ];
      };
    },
    {
      name: 'sequence';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'bump';
            type: 'u8';
          },
          {
            name: 'sequence';
            type: 'u64';
          },
        ];
      };
    },
    {
      name: 'managerSibling';
      docs: [
        'A sibling on another chain. Stored in a PDA seeded by the chain id.',
      ];
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'bump';
            type: 'u8';
          },
          {
            name: 'address';
            type: {
              array: ['u8', 32];
            };
          },
        ];
      };
    },
    {
      name: 'bridgeData';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'guardianSetIndex';
            docs: [
              'The current guardian set index, used to decide which signature sets to accept.',
            ];
            type: 'u32';
          },
          {
            name: 'lastLamports';
            docs: ['Lamports in the collection account'];
            type: 'u64';
          },
          {
            name: 'config';
            docs: [
              'Bridge configuration, which is set once upon initialization.',
            ];
            type: {
              defined: 'BridgeConfig';
            };
          },
        ];
      };
    },
  ];
  types: [
    {
      name: 'Bitmap';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'map';
            type: 'u128';
          },
        ];
      };
    },
    {
      name: 'ChainId';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'id';
            type: 'u16';
          },
        ];
      };
    },
    {
      name: 'Mode';
      type: {
        kind: 'enum';
        variants: [
          {
            name: 'Burning';
          },
          {
            name: 'Locking';
          },
        ];
      };
    },
    {
      name: 'SetEndpointSiblingArgs';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'chainId';
            type: {
              defined: 'ChainId';
            };
          },
          {
            name: 'address';
            type: {
              array: ['u8', 32];
            };
          },
        ];
      };
    },
    {
      name: 'SetInboundLimitArgs';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'limit';
            type: 'u64';
          },
          {
            name: 'chainId';
            type: {
              defined: 'ChainId';
            };
          },
        ];
      };
    },
    {
      name: 'SetOutboundLimitArgs';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'limit';
            type: 'u64';
          },
        ];
      };
    },
    {
      name: 'SetSiblingArgs';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'chainId';
            type: {
              defined: 'ChainId';
            };
          },
          {
            name: 'address';
            type: {
              array: ['u8', 32];
            };
          },
          {
            name: 'limit';
            type: 'u64';
          },
        ];
      };
    },
    {
      name: 'TransferOwnershipArgs';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'newOwner';
            type: 'publicKey';
          },
        ];
      };
    },
    {
      name: 'InitializeArgs';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'chainId';
            type: 'u16';
          },
          {
            name: 'limit';
            type: 'u64';
          },
          {
            name: 'mode';
            type: {
              defined: 'Mode';
            };
          },
        ];
      };
    },
    {
      name: 'RedeemArgs';
      type: {
        kind: 'struct';
        fields: [];
      };
    },
    {
      name: 'ReleaseInboundArgs';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'revertOnDelay';
            type: 'bool';
          },
        ];
      };
    },
    {
      name: 'ReleaseOutboundArgs';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'revertOnDelay';
            type: 'bool';
          },
        ];
      };
    },
    {
      name: 'TransferArgs';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'amount';
            type: 'u64';
          },
          {
            name: 'recipientChain';
            type: {
              defined: 'ChainId';
            };
          },
          {
            name: 'recipientAddress';
            type: {
              array: ['u8', 32];
            };
          },
          {
            name: 'shouldQueue';
            type: 'bool';
          },
        ];
      };
    },
    {
      name: 'EndpointMessageData';
      generics: ['A'];
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'sourceManager';
            type: {
              array: ['u8', 32];
            };
          },
          {
            name: 'managerPayload';
            type: {
              definedWithTypeArgs: {
                name: 'ManagerMessage';
                args: [
                  {
                    type: {
                      generic: 'A';
                    };
                  },
                ];
              };
            };
          },
        ];
      };
    },
    {
      name: 'ManagerMessage';
      generics: ['A'];
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'sequence';
            type: 'u64';
          },
          {
            name: 'sender';
            type: {
              array: ['u8', 32];
            };
          },
          {
            name: 'payload';
            type: {
              generic: 'A';
            };
          },
        ];
      };
    },
    {
      name: 'NormalizedAmount';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'amount';
            type: 'u64';
          },
          {
            name: 'decimals';
            type: 'u8';
          },
        ];
      };
    },
    {
      name: 'ReleaseStatus';
      type: {
        kind: 'enum';
        variants: [
          {
            name: 'NotApproved';
          },
          {
            name: 'ReleaseAfter';
            fields: ['i64'];
          },
          {
            name: 'Released';
          },
        ];
      };
    },
    {
      name: 'RateLimitState';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'limit';
            docs: ['The maximum capacity of the rate limiter.'];
            type: {
              defined: 'NormalizedAmount';
            };
          },
          {
            name: 'capacityAtLastTx';
            docs: [
              'The capacity of the rate limiter at `last_tx_timestamp`.',
              'The actual current capacity is calculated in `capacity_at`, by',
              'accounting for the time that has passed since `last_tx_timestamp` and',
              'the refill rate.',
            ];
            type: {
              defined: 'NormalizedAmount';
            };
          },
          {
            name: 'lastTxTimestamp';
            docs: [
              'The timestamp of the last transaction that counted towards the current',
              'capacity. Transactions that exceeded the capacity do not count, they are',
              'just delayed.',
            ];
            type: 'i64';
          },
        ];
      };
    },
    {
      name: 'BridgeConfig';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'guardianSetExpirationTime';
            docs: [
              'Period for how long a guardian set is valid after it has been replaced by a new one.  This',
              'guarantees that VAAs issued by that set can still be submitted for a certain period.  In',
              'this period we still trust the old guardian set.',
            ];
            type: 'u32';
          },
          {
            name: 'fee';
            docs: [
              'Amount of lamports that needs to be paid to the protocol to post a message',
            ];
            type: 'u64';
          },
        ];
      };
    },
  ];
  errors: [
    {
      code: 6000;
      name: 'CantReleaseYet';
      msg: 'CantReleaseYet';
    },
    {
      code: 6001;
      name: 'InvalidChainId';
      msg: 'InvalidChainId';
    },
    {
      code: 6002;
      name: 'InvalidRecipientAddress';
      msg: 'InvalidRecipientAddress';
    },
    {
      code: 6003;
      name: 'InvalidEndpointSibling';
      msg: 'InvalidEndpointSibling';
    },
    {
      code: 6004;
      name: 'InvalidManagerSibling';
      msg: 'InvalidManagerSibling';
    },
    {
      code: 6005;
      name: 'TransferAlreadyRedeemed';
      msg: 'TransferAlreadyRedeemed';
    },
    {
      code: 6006;
      name: 'TransferNotApproved';
      msg: 'TransferNotApproved';
    },
    {
      code: 6007;
      name: 'MessageAlreadySent';
      msg: 'MessageAlreadySent';
    },
    {
      code: 6008;
      name: 'InvalidMode';
      msg: 'InvalidMode';
    },
    {
      code: 6009;
      name: 'InvalidMintAuthority';
      msg: 'InvalidMintAuthority';
    },
    {
      code: 6010;
      name: 'TransferExceedsRateLimit';
      msg: 'TransferExceedsRateLimit';
    },
    {
      code: 6011;
      name: 'Paused';
      msg: 'Paused';
    },
    {
      code: 6012;
      name: 'DisabledEndpoint';
      msg: 'DisabledEndpoint';
    },
  ];
};

export const IDL: ExampleNativeTokenTransfers = {
  version: '0.1.0',
  name: 'example_native_token_transfers',
  instructions: [
    {
      name: 'initialize',
      accounts: [
        {
          name: 'payer',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'owner',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'config',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'mint',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'seq',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'rateLimit',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'tokenAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'custody',
          isMut: true,
          isSigner: false,
          docs: [
            'The custody account that holds tokens in locking mode.',
            'NOTE: the account is unconditionally initialized, but not used in',
            'burning mode.',
          ],
        },
        {
          name: 'tokenProgram',
          isMut: false,
          isSigner: false,
          docs: ['associated token account for the given mint.'],
        },
        {
          name: 'associatedTokenProgram',
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
            defined: 'InitializeArgs',
          },
        },
      ],
    },
    {
      name: 'transferBurn',
      accounts: [
        {
          name: 'common',
          accounts: [
            {
              name: 'payer',
              isMut: true,
              isSigner: true,
            },
            {
              name: 'config',
              accounts: [
                {
                  name: 'config',
                  isMut: false,
                  isSigner: false,
                },
              ],
            },
            {
              name: 'mint',
              isMut: true,
              isSigner: false,
            },
            {
              name: 'from',
              isMut: true,
              isSigner: false,
            },
            {
              name: 'fromAuthority',
              isMut: false,
              isSigner: true,
              docs: ['authority to burn the tokens (owner)'],
            },
            {
              name: 'tokenProgram',
              isMut: false,
              isSigner: false,
            },
            {
              name: 'seq',
              isMut: true,
              isSigner: false,
            },
            {
              name: 'outboxItem',
              isMut: true,
              isSigner: true,
            },
            {
              name: 'outboxRateLimit',
              isMut: true,
              isSigner: false,
            },
            {
              name: 'systemProgram',
              isMut: false,
              isSigner: false,
            },
          ],
        },
        {
          name: 'inboxRateLimit',
          isMut: true,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'args',
          type: {
            defined: 'TransferArgs',
          },
        },
      ],
    },
    {
      name: 'transferLock',
      accounts: [
        {
          name: 'common',
          accounts: [
            {
              name: 'payer',
              isMut: true,
              isSigner: true,
            },
            {
              name: 'config',
              accounts: [
                {
                  name: 'config',
                  isMut: false,
                  isSigner: false,
                },
              ],
            },
            {
              name: 'mint',
              isMut: true,
              isSigner: false,
            },
            {
              name: 'from',
              isMut: true,
              isSigner: false,
            },
            {
              name: 'fromAuthority',
              isMut: false,
              isSigner: true,
              docs: ['authority to burn the tokens (owner)'],
            },
            {
              name: 'tokenProgram',
              isMut: false,
              isSigner: false,
            },
            {
              name: 'seq',
              isMut: true,
              isSigner: false,
            },
            {
              name: 'outboxItem',
              isMut: true,
              isSigner: true,
            },
            {
              name: 'outboxRateLimit',
              isMut: true,
              isSigner: false,
            },
            {
              name: 'systemProgram',
              isMut: false,
              isSigner: false,
            },
          ],
        },
        {
          name: 'inboxRateLimit',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'tokenAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'custody',
          isMut: true,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'args',
          type: {
            defined: 'TransferArgs',
          },
        },
      ],
    },
    {
      name: 'releaseOutbound',
      accounts: [
        {
          name: 'payer',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'config',
          accounts: [
            {
              name: 'config',
              isMut: false,
              isSigner: false,
            },
          ],
        },
        {
          name: 'outboxItem',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'endpoint',
          accounts: [
            {
              name: 'endpoint',
              isMut: false,
              isSigner: false,
            },
          ],
        },
        {
          name: 'wormholeMessage',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'emitter',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'wormholeBridge',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'wormholeFeeCollector',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'wormholeSequence',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'wormholeProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'systemProgram',
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
          name: 'args',
          type: {
            defined: 'ReleaseOutboundArgs',
          },
        },
      ],
    },
    {
      name: 'redeem',
      accounts: [
        {
          name: 'payer',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'config',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'sibling',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'endpointMessage',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'endpoint',
          accounts: [
            {
              name: 'endpoint',
              isMut: false,
              isSigner: false,
            },
          ],
        },
        {
          name: 'inboxItem',
          isMut: true,
          isSigner: false,
          docs: [
            'NOTE: This account is content-addressed (PDA seeded by the message hash).',
            'This is because in a multi-endpoint configuration, the different',
            'endpoints "vote" on messages (by delivering them). By making the inbox',
            "items content-addressed, we can ensure that disagreeing votes don't",
            'interfere with each other.',
          ],
        },
        {
          name: 'inboxRateLimit',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'outboxRateLimit',
          isMut: true,
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
            defined: 'RedeemArgs',
          },
        },
      ],
    },
    {
      name: 'releaseInboundMint',
      accounts: [
        {
          name: 'common',
          accounts: [
            {
              name: 'payer',
              isMut: true,
              isSigner: true,
            },
            {
              name: 'config',
              accounts: [
                {
                  name: 'config',
                  isMut: false,
                  isSigner: false,
                },
              ],
            },
            {
              name: 'inboxItem',
              isMut: true,
              isSigner: false,
            },
            {
              name: 'recipient',
              isMut: true,
              isSigner: false,
            },
            {
              name: 'tokenAuthority',
              isMut: false,
              isSigner: false,
            },
            {
              name: 'mint',
              isMut: true,
              isSigner: false,
            },
            {
              name: 'tokenProgram',
              isMut: false,
              isSigner: false,
            },
          ],
        },
      ],
      args: [
        {
          name: 'args',
          type: {
            defined: 'ReleaseInboundArgs',
          },
        },
      ],
    },
    {
      name: 'releaseInboundUnlock',
      accounts: [
        {
          name: 'common',
          accounts: [
            {
              name: 'payer',
              isMut: true,
              isSigner: true,
            },
            {
              name: 'config',
              accounts: [
                {
                  name: 'config',
                  isMut: false,
                  isSigner: false,
                },
              ],
            },
            {
              name: 'inboxItem',
              isMut: true,
              isSigner: false,
            },
            {
              name: 'recipient',
              isMut: true,
              isSigner: false,
            },
            {
              name: 'tokenAuthority',
              isMut: false,
              isSigner: false,
            },
            {
              name: 'mint',
              isMut: true,
              isSigner: false,
            },
            {
              name: 'tokenProgram',
              isMut: false,
              isSigner: false,
            },
          ],
        },
        {
          name: 'custody',
          isMut: true,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'args',
          type: {
            defined: 'ReleaseInboundArgs',
          },
        },
      ],
    },
    {
      name: 'transferOwnership',
      accounts: [
        {
          name: 'config',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'owner',
          isMut: false,
          isSigner: true,
        },
      ],
      args: [
        {
          name: 'args',
          type: {
            defined: 'TransferOwnershipArgs',
          },
        },
      ],
    },
    {
      name: 'claimOwnership',
      accounts: [
        {
          name: 'config',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'newOwner',
          isMut: false,
          isSigner: true,
        },
      ],
      args: [],
    },
    {
      name: 'setPaused',
      accounts: [
        {
          name: 'config',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'owner',
          isMut: false,
          isSigner: true,
        },
      ],
      args: [
        {
          name: 'pause',
          type: 'bool',
        },
      ],
    },
    {
      name: 'setSibling',
      accounts: [
        {
          name: 'config',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'owner',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'payer',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'sibling',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'inboxRateLimit',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'mint',
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
            defined: 'SetSiblingArgs',
          },
        },
      ],
    },
    {
      name: 'registerEndpoint',
      accounts: [
        {
          name: 'config',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'owner',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'payer',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'endpoint',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'registeredEndpoint',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: 'setOutboundLimit',
      accounts: [
        {
          name: 'config',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'owner',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'rateLimit',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'mint',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'args',
          type: {
            defined: 'SetOutboundLimitArgs',
          },
        },
      ],
    },
    {
      name: 'setInboundLimit',
      accounts: [
        {
          name: 'config',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'owner',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'rateLimit',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'mint',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'args',
          type: {
            defined: 'SetInboundLimitArgs',
          },
        },
      ],
    },
    {
      name: 'setWormholeSibling',
      accounts: [
        {
          name: 'config',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'owner',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'payer',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'sibling',
          isMut: true,
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
            defined: 'SetEndpointSiblingArgs',
          },
        },
      ],
    },
    {
      name: 'receiveWormholeMessage',
      accounts: [
        {
          name: 'payer',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'config',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'sibling',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'vaa',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'endpointMessage',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: 'config',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'bump',
            type: 'u8',
          },
          {
            name: 'owner',
            docs: ['Owner of the program.'],
            type: 'publicKey',
          },
          {
            name: 'pendingOwner',
            docs: ['Pending next owner (before claiming ownership).'],
            type: {
              option: 'publicKey',
            },
          },
          {
            name: 'mint',
            docs: ['Mint address of the token managed by this program.'],
            type: 'publicKey',
          },
          {
            name: 'tokenProgram',
            docs: [
              'Address of the token program (token or token22). This could always be queried',
              "from the [`mint`] account's owner, but storing it here avoids an indirection",
              'on the client side.',
            ],
            type: 'publicKey',
          },
          {
            name: 'mode',
            docs: [
              'The mode that this program is running in. This is used to determine',
              'whether the program is burning tokens or locking tokens.',
            ],
            type: {
              defined: 'Mode',
            },
          },
          {
            name: 'chainId',
            docs: [
              "The chain id of the chain that this program is running on. We don't",
              'hardcode this so that the program is deployable on any potential SVM',
              'forks.',
            ],
            type: {
              defined: 'ChainId',
            },
          },
          {
            name: 'nextEndpointId',
            docs: ['The next endpoint id to use when registering an endpoint.'],
            type: 'u8',
          },
          {
            name: 'threshold',
            docs: [
              'The number of endpoints that must attest to a transfer before it is',
              'accepted.',
            ],
            type: 'u8',
          },
          {
            name: 'enabledEndpoints',
            docs: ['Bitmap of enabled endpoints'],
            type: {
              defined: 'Bitmap',
            },
          },
          {
            name: 'paused',
            docs: [
              'Pause the program. This is useful for upgrades and other maintenance.',
            ],
            type: 'bool',
          },
        ],
      },
    },
    {
      name: 'endpointSibling',
      docs: [
        'A sibling on another chain. Stored in a PDA seeded by the chain id.',
      ],
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
    {
      name: 'validatedEndpointMessage',
      generics: ['A'],
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'fromChain',
            type: {
              defined: 'ChainId',
            },
          },
          {
            name: 'message',
            type: {
              definedWithTypeArgs: {
                name: 'EndpointMessageData',
                args: [
                  {
                    type: {
                      generic: 'A',
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    },
    {
      name: 'inboxItem',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'init',
            type: 'bool',
          },
          {
            name: 'bump',
            type: 'u8',
          },
          {
            name: 'amount',
            type: {
              defined: 'NormalizedAmount',
            },
          },
          {
            name: 'recipientAddress',
            type: 'publicKey',
          },
          {
            name: 'votes',
            type: {
              defined: 'Bitmap',
            },
          },
          {
            name: 'releaseStatus',
            type: {
              defined: 'ReleaseStatus',
            },
          },
        ],
      },
    },
    {
      name: 'inboxRateLimit',
      docs: [
        'Inbound rate limit per chain.',
        'SECURITY: must check the PDA (since there are multiple PDAs, namely one for each chain.)',
      ],
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'bump',
            type: 'u8',
          },
          {
            name: 'rateLimit',
            type: {
              defined: 'RateLimitState',
            },
          },
        ],
      },
    },
    {
      name: 'outboxItem',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'sequence',
            type: 'u64',
          },
          {
            name: 'amount',
            type: {
              defined: 'NormalizedAmount',
            },
          },
          {
            name: 'sender',
            type: 'publicKey',
          },
          {
            name: 'recipientChain',
            type: {
              defined: 'ChainId',
            },
          },
          {
            name: 'recipientAddress',
            type: {
              array: ['u8', 32],
            },
          },
          {
            name: 'releaseTimestamp',
            type: 'i64',
          },
          {
            name: 'released',
            type: {
              defined: 'Bitmap',
            },
          },
        ],
      },
    },
    {
      name: 'outboxRateLimit',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'rateLimit',
            type: {
              defined: 'RateLimitState',
            },
          },
        ],
      },
    },
    {
      name: 'registeredEndpoint',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'bump',
            type: 'u8',
          },
          {
            name: 'id',
            type: 'u8',
          },
          {
            name: 'endpointAddress',
            type: 'publicKey',
          },
          {
            name: 'enabled',
            docs: [
              'Whether the endpoint is enabled.',
              'NOTE: there is a bitmap in the config account which must be kept in sync',
              'with this. If endpoint disabling is implemented, the bitmap must be updated',
              'in the same transaction as the endpoint account.',
            ],
            type: 'bool',
          },
        ],
      },
    },
    {
      name: 'sequence',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'bump',
            type: 'u8',
          },
          {
            name: 'sequence',
            type: 'u64',
          },
        ],
      },
    },
    {
      name: 'managerSibling',
      docs: [
        'A sibling on another chain. Stored in a PDA seeded by the chain id.',
      ],
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
    {
      name: 'bridgeData',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'guardianSetIndex',
            docs: [
              'The current guardian set index, used to decide which signature sets to accept.',
            ],
            type: 'u32',
          },
          {
            name: 'lastLamports',
            docs: ['Lamports in the collection account'],
            type: 'u64',
          },
          {
            name: 'config',
            docs: [
              'Bridge configuration, which is set once upon initialization.',
            ],
            type: {
              defined: 'BridgeConfig',
            },
          },
        ],
      },
    },
  ],
  types: [
    {
      name: 'Bitmap',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'map',
            type: 'u128',
          },
        ],
      },
    },
    {
      name: 'ChainId',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'id',
            type: 'u16',
          },
        ],
      },
    },
    {
      name: 'Mode',
      type: {
        kind: 'enum',
        variants: [
          {
            name: 'Burning',
          },
          {
            name: 'Locking',
          },
        ],
      },
    },
    {
      name: 'SetEndpointSiblingArgs',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'chainId',
            type: {
              defined: 'ChainId',
            },
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
      name: 'SetInboundLimitArgs',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'limit',
            type: 'u64',
          },
          {
            name: 'chainId',
            type: {
              defined: 'ChainId',
            },
          },
        ],
      },
    },
    {
      name: 'SetOutboundLimitArgs',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'limit',
            type: 'u64',
          },
        ],
      },
    },
    {
      name: 'SetSiblingArgs',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'chainId',
            type: {
              defined: 'ChainId',
            },
          },
          {
            name: 'address',
            type: {
              array: ['u8', 32],
            },
          },
          {
            name: 'limit',
            type: 'u64',
          },
        ],
      },
    },
    {
      name: 'TransferOwnershipArgs',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'newOwner',
            type: 'publicKey',
          },
        ],
      },
    },
    {
      name: 'InitializeArgs',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'chainId',
            type: 'u16',
          },
          {
            name: 'limit',
            type: 'u64',
          },
          {
            name: 'mode',
            type: {
              defined: 'Mode',
            },
          },
        ],
      },
    },
    {
      name: 'RedeemArgs',
      type: {
        kind: 'struct',
        fields: [],
      },
    },
    {
      name: 'ReleaseInboundArgs',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'revertOnDelay',
            type: 'bool',
          },
        ],
      },
    },
    {
      name: 'ReleaseOutboundArgs',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'revertOnDelay',
            type: 'bool',
          },
        ],
      },
    },
    {
      name: 'TransferArgs',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'amount',
            type: 'u64',
          },
          {
            name: 'recipientChain',
            type: {
              defined: 'ChainId',
            },
          },
          {
            name: 'recipientAddress',
            type: {
              array: ['u8', 32],
            },
          },
          {
            name: 'shouldQueue',
            type: 'bool',
          },
        ],
      },
    },
    {
      name: 'EndpointMessageData',
      generics: ['A'],
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'sourceManager',
            type: {
              array: ['u8', 32],
            },
          },
          {
            name: 'managerPayload',
            type: {
              definedWithTypeArgs: {
                name: 'ManagerMessage',
                args: [
                  {
                    type: {
                      generic: 'A',
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    },
    {
      name: 'ManagerMessage',
      generics: ['A'],
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'sequence',
            type: 'u64',
          },
          {
            name: 'sender',
            type: {
              array: ['u8', 32],
            },
          },
          {
            name: 'payload',
            type: {
              generic: 'A',
            },
          },
        ],
      },
    },
    {
      name: 'NormalizedAmount',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'amount',
            type: 'u64',
          },
          {
            name: 'decimals',
            type: 'u8',
          },
        ],
      },
    },
    {
      name: 'ReleaseStatus',
      type: {
        kind: 'enum',
        variants: [
          {
            name: 'NotApproved',
          },
          {
            name: 'ReleaseAfter',
            fields: ['i64'],
          },
          {
            name: 'Released',
          },
        ],
      },
    },
    {
      name: 'RateLimitState',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'limit',
            docs: ['The maximum capacity of the rate limiter.'],
            type: {
              defined: 'NormalizedAmount',
            },
          },
          {
            name: 'capacityAtLastTx',
            docs: [
              'The capacity of the rate limiter at `last_tx_timestamp`.',
              'The actual current capacity is calculated in `capacity_at`, by',
              'accounting for the time that has passed since `last_tx_timestamp` and',
              'the refill rate.',
            ],
            type: {
              defined: 'NormalizedAmount',
            },
          },
          {
            name: 'lastTxTimestamp',
            docs: [
              'The timestamp of the last transaction that counted towards the current',
              'capacity. Transactions that exceeded the capacity do not count, they are',
              'just delayed.',
            ],
            type: 'i64',
          },
        ],
      },
    },
    {
      name: 'BridgeConfig',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'guardianSetExpirationTime',
            docs: [
              'Period for how long a guardian set is valid after it has been replaced by a new one.  This',
              'guarantees that VAAs issued by that set can still be submitted for a certain period.  In',
              'this period we still trust the old guardian set.',
            ],
            type: 'u32',
          },
          {
            name: 'fee',
            docs: [
              'Amount of lamports that needs to be paid to the protocol to post a message',
            ],
            type: 'u64',
          },
        ],
      },
    },
  ],
  errors: [
    {
      code: 6000,
      name: 'CantReleaseYet',
      msg: 'CantReleaseYet',
    },
    {
      code: 6001,
      name: 'InvalidChainId',
      msg: 'InvalidChainId',
    },
    {
      code: 6002,
      name: 'InvalidRecipientAddress',
      msg: 'InvalidRecipientAddress',
    },
    {
      code: 6003,
      name: 'InvalidEndpointSibling',
      msg: 'InvalidEndpointSibling',
    },
    {
      code: 6004,
      name: 'InvalidManagerSibling',
      msg: 'InvalidManagerSibling',
    },
    {
      code: 6005,
      name: 'TransferAlreadyRedeemed',
      msg: 'TransferAlreadyRedeemed',
    },
    {
      code: 6006,
      name: 'TransferNotApproved',
      msg: 'TransferNotApproved',
    },
    {
      code: 6007,
      name: 'MessageAlreadySent',
      msg: 'MessageAlreadySent',
    },
    {
      code: 6008,
      name: 'InvalidMode',
      msg: 'InvalidMode',
    },
    {
      code: 6009,
      name: 'InvalidMintAuthority',
      msg: 'InvalidMintAuthority',
    },
    {
      code: 6010,
      name: 'TransferExceedsRateLimit',
      msg: 'TransferExceedsRateLimit',
    },
    {
      code: 6011,
      name: 'Paused',
      msg: 'Paused',
    },
    {
      code: 6012,
      name: 'DisabledEndpoint',
      msg: 'DisabledEndpoint',
    },
  ],
};
