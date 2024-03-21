export type NttQuoter = {
  version: '0.1.0';
  name: 'ntt_quoter';
  instructions: [
    {
      name: 'requestRelay';
      accounts: [
        {
          name: 'payer';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'instance';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'registeredChain';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'outboxItem';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'relayRequest';
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
            defined: 'RequestRelayArgs';
          };
        },
      ];
    },
    {
      name: 'closeRelay';
      accounts: [
        {
          name: 'authority';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'instance';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'feeRecipient';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'relayRequest';
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
      name: 'initialize';
      accounts: [
        {
          name: 'owner';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'instance';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'feeRecipient';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'programData';
          isMut: true;
          isSigner: false;
          docs: [
            'We use the program data to make sure this owner is the upgrade authority (the true owner,',
            'who deployed this program).',
          ];
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
      name: 'setAssistant';
      accounts: [
        {
          name: 'owner';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'instance';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'assistant';
          isMut: false;
          isSigner: false;
          isOptional: true;
        },
      ];
      args: [];
    },
    {
      name: 'setFeeRecipient';
      accounts: [
        {
          name: 'owner';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'instance';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'feeRecipient';
          isMut: false;
          isSigner: false;
        },
      ];
      args: [];
    },
    {
      name: 'registerChain';
      accounts: [
        {
          name: 'authority';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'instance';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'registeredChain';
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
            defined: 'RegisterChainArgs';
          };
        },
      ];
    },
    {
      name: 'updateSolPrice';
      accounts: [
        {
          name: 'authority';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'instance';
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: 'args';
          type: {
            defined: 'UpdateSolPriceArgs';
          };
        },
      ];
    },
    {
      name: 'updateChainPrices';
      accounts: [
        {
          name: 'authority';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'instance';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'registeredChain';
          isMut: true;
          isSigner: false;
        },
      ];
      args: [
        {
          name: 'args';
          type: {
            defined: 'UpdateChainPricesArgs';
          };
        },
      ];
    },
    {
      name: 'updateChainParams';
      accounts: [
        {
          name: 'authority';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'instance';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'registeredChain';
          isMut: true;
          isSigner: false;
        },
      ];
      args: [
        {
          name: 'args';
          type: {
            defined: 'UpdateChainParamsArgs';
          };
        },
      ];
    },
  ];
  accounts: [
    {
      name: 'instance';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'owner';
            type: 'publicKey';
          },
          {
            name: 'assistant';
            type: 'publicKey';
          },
          {
            name: 'feeRecipient';
            type: 'publicKey';
          },
          {
            name: 'solPrice';
            type: 'u64';
          },
        ];
      };
    },
    {
      name: 'registeredChain';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'bump';
            type: 'u8';
          },
          {
            name: 'maxGasDropoff';
            type: 'u64';
          },
          {
            name: 'basePrice';
            type: 'u64';
          },
          {
            name: 'nativePrice';
            type: 'u64';
          },
          {
            name: 'gasPrice';
            type: 'u64';
          },
        ];
      };
    },
    {
      name: 'relayRequest';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'requestedGasDropoff';
            type: 'u64';
          },
        ];
      };
    },
  ];
  types: [
    {
      name: 'RegisterChainArgs';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'chainId';
            type: 'u16';
          },
        ];
      };
    },
    {
      name: 'RequestRelayArgs';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'gasDropoff';
            type: 'u64';
          },
          {
            name: 'maxFee';
            type: 'u64';
          },
        ];
      };
    },
    {
      name: 'UpdateSolPriceArgs';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'solPrice';
            type: 'u64';
          },
        ];
      };
    },
    {
      name: 'UpdateChainPricesArgs';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'nativePrice';
            type: 'u64';
          },
          {
            name: 'gasPrice';
            type: 'u64';
          },
        ];
      };
    },
    {
      name: 'UpdateChainParamsArgs';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'maxGasDropoff';
            type: 'u64';
          },
          {
            name: 'basePrice';
            type: 'u64';
          },
        ];
      };
    },
  ];
  errors: [
    {
      code: 6001;
      name: 'ExceedsUserMaxFee';
      msg: 'Relay fees exceeds specified max';
    },
    {
      code: 6002;
      name: 'ExceedsMaxGasDropoff';
      msg: 'Requested gas dropoff exceeds max allowed for chain';
    },
    {
      code: 6003;
      name: 'InvalidFeeRecipient';
      msg: 'The specified fee recipient does not match the address in the instance accound';
    },
    {
      code: 6004;
      name: 'RelayingToChainDisabled';
      msg: 'Relaying to the specified chain is disabled';
    },
    {
      code: 6257;
      name: 'FeeRecipientCannotBeDefault';
      msg: 'The fee recipient cannot be the default address (0x0)';
    },
    {
      code: 6258;
      name: 'NotAuthorized';
      msg: 'Must be owner or assistant';
    },
  ];
};

export const IDL: NttQuoter = {
  version: '0.1.0',
  name: 'ntt_quoter',
  instructions: [
    {
      name: 'requestRelay',
      accounts: [
        {
          name: 'payer',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'instance',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'registeredChain',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'outboxItem',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'relayRequest',
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
            defined: 'RequestRelayArgs',
          },
        },
      ],
    },
    {
      name: 'closeRelay',
      accounts: [
        {
          name: 'authority',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'instance',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'feeRecipient',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'relayRequest',
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
      name: 'initialize',
      accounts: [
        {
          name: 'owner',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'instance',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'feeRecipient',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'programData',
          isMut: true,
          isSigner: false,
          docs: [
            'We use the program data to make sure this owner is the upgrade authority (the true owner,',
            'who deployed this program).',
          ],
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
      name: 'setAssistant',
      accounts: [
        {
          name: 'owner',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'instance',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'assistant',
          isMut: false,
          isSigner: false,
          isOptional: true,
        },
      ],
      args: [],
    },
    {
      name: 'setFeeRecipient',
      accounts: [
        {
          name: 'owner',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'instance',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'feeRecipient',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: 'registerChain',
      accounts: [
        {
          name: 'authority',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'instance',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'registeredChain',
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
            defined: 'RegisterChainArgs',
          },
        },
      ],
    },
    {
      name: 'updateSolPrice',
      accounts: [
        {
          name: 'authority',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'instance',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'args',
          type: {
            defined: 'UpdateSolPriceArgs',
          },
        },
      ],
    },
    {
      name: 'updateChainPrices',
      accounts: [
        {
          name: 'authority',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'instance',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'registeredChain',
          isMut: true,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'args',
          type: {
            defined: 'UpdateChainPricesArgs',
          },
        },
      ],
    },
    {
      name: 'updateChainParams',
      accounts: [
        {
          name: 'authority',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'instance',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'registeredChain',
          isMut: true,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'args',
          type: {
            defined: 'UpdateChainParamsArgs',
          },
        },
      ],
    },
  ],
  accounts: [
    {
      name: 'instance',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'owner',
            type: 'publicKey',
          },
          {
            name: 'assistant',
            type: 'publicKey',
          },
          {
            name: 'feeRecipient',
            type: 'publicKey',
          },
          {
            name: 'solPrice',
            type: 'u64',
          },
        ],
      },
    },
    {
      name: 'registeredChain',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'bump',
            type: 'u8',
          },
          {
            name: 'maxGasDropoff',
            type: 'u64',
          },
          {
            name: 'basePrice',
            type: 'u64',
          },
          {
            name: 'nativePrice',
            type: 'u64',
          },
          {
            name: 'gasPrice',
            type: 'u64',
          },
        ],
      },
    },
    {
      name: 'relayRequest',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'requestedGasDropoff',
            type: 'u64',
          },
        ],
      },
    },
  ],
  types: [
    {
      name: 'RegisterChainArgs',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'chainId',
            type: 'u16',
          },
        ],
      },
    },
    {
      name: 'RequestRelayArgs',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'gasDropoff',
            type: 'u64',
          },
          {
            name: 'maxFee',
            type: 'u64',
          },
        ],
      },
    },
    {
      name: 'UpdateSolPriceArgs',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'solPrice',
            type: 'u64',
          },
        ],
      },
    },
    {
      name: 'UpdateChainPricesArgs',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'nativePrice',
            type: 'u64',
          },
          {
            name: 'gasPrice',
            type: 'u64',
          },
        ],
      },
    },
    {
      name: 'UpdateChainParamsArgs',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'maxGasDropoff',
            type: 'u64',
          },
          {
            name: 'basePrice',
            type: 'u64',
          },
        ],
      },
    },
  ],
  errors: [
    {
      code: 6001,
      name: 'ExceedsUserMaxFee',
      msg: 'Relay fees exceeds specified max',
    },
    {
      code: 6002,
      name: 'ExceedsMaxGasDropoff',
      msg: 'Requested gas dropoff exceeds max allowed for chain',
    },
    {
      code: 6003,
      name: 'InvalidFeeRecipient',
      msg: 'The specified fee recipient does not match the address in the instance accound',
    },
    {
      code: 6004,
      name: 'RelayingToChainDisabled',
      msg: 'Relaying to the specified chain is disabled',
    },
    {
      code: 6257,
      name: 'FeeRecipientCannotBeDefault',
      msg: 'The fee recipient cannot be the default address (0x0)',
    },
    {
      code: 6258,
      name: 'NotAuthorized',
      msg: 'Must be owner or assistant',
    },
  ],
};
