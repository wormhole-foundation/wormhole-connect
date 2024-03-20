export type MessageTransmitter = {
  version: '0.1.0';
  name: 'message_transmitter';
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
          name: 'upgradeAuthority';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'messageTransmitter';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'messageTransmitterProgramData';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'messageTransmitterProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'eventAuthority';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'program';
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: 'params';
          type: {
            defined: 'InitializeParams';
          };
        },
      ];
    },
    {
      name: 'transferOwnership';
      accounts: [
        {
          name: 'owner';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'messageTransmitter';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'eventAuthority';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'program';
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: 'params';
          type: {
            defined: 'TransferOwnershipParams';
          };
        },
      ];
    },
    {
      name: 'acceptOwnership';
      accounts: [
        {
          name: 'pendingOwner';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'messageTransmitter';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'eventAuthority';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'program';
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: 'params';
          type: {
            defined: 'AcceptOwnershipParams';
          };
        },
      ];
    },
    {
      name: 'updatePauser';
      accounts: [
        {
          name: 'owner';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'messageTransmitter';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'eventAuthority';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'program';
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: 'params';
          type: {
            defined: 'UpdatePauserParams';
          };
        },
      ];
    },
    {
      name: 'updateAttesterManager';
      accounts: [
        {
          name: 'owner';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'messageTransmitter';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'eventAuthority';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'program';
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: 'params';
          type: {
            defined: 'UpdateAttesterManagerParams';
          };
        },
      ];
    },
    {
      name: 'pause';
      accounts: [
        {
          name: 'pauser';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'messageTransmitter';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'eventAuthority';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'program';
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: 'params';
          type: {
            defined: 'PauseParams';
          };
        },
      ];
    },
    {
      name: 'unpause';
      accounts: [
        {
          name: 'pauser';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'messageTransmitter';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'eventAuthority';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'program';
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: 'params';
          type: {
            defined: 'UnpauseParams';
          };
        },
      ];
    },
    {
      name: 'setMaxMessageBodySize';
      accounts: [
        {
          name: 'owner';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'messageTransmitter';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'eventAuthority';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'program';
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: 'params';
          type: {
            defined: 'SetMaxMessageBodySizeParams';
          };
        },
      ];
    },
    {
      name: 'enableAttester';
      accounts: [
        {
          name: 'payer';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'attesterManager';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'messageTransmitter';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'eventAuthority';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'program';
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: 'params';
          type: {
            defined: 'EnableAttesterParams';
          };
        },
      ];
    },
    {
      name: 'disableAttester';
      accounts: [
        {
          name: 'payer';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'attesterManager';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'messageTransmitter';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'eventAuthority';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'program';
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: 'params';
          type: {
            defined: 'DisableAttesterParams';
          };
        },
      ];
    },
    {
      name: 'setSignatureThreshold';
      accounts: [
        {
          name: 'attesterManager';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'messageTransmitter';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'eventAuthority';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'program';
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: 'params';
          type: {
            defined: 'SetSignatureThresholdParams';
          };
        },
      ];
    },
    {
      name: 'sendMessage';
      accounts: [
        {
          name: 'eventRentPayer';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'senderAuthorityPda';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'messageTransmitter';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'messageSentEventData';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'senderProgram';
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
          name: 'params';
          type: {
            defined: 'SendMessageParams';
          };
        },
      ];
      returns: 'u64';
    },
    {
      name: 'sendMessageWithCaller';
      accounts: [
        {
          name: 'eventRentPayer';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'senderAuthorityPda';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'messageTransmitter';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'messageSentEventData';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'senderProgram';
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
          name: 'params';
          type: {
            defined: 'SendMessageWithCallerParams';
          };
        },
      ];
      returns: 'u64';
    },
    {
      name: 'replaceMessage';
      accounts: [
        {
          name: 'eventRentPayer';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'senderAuthorityPda';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'messageTransmitter';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'messageSentEventData';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'senderProgram';
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
          name: 'params';
          type: {
            defined: 'ReplaceMessageParams';
          };
        },
      ];
      returns: 'u64';
    },
    {
      name: 'receiveMessage';
      accounts: [
        {
          name: 'payer';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'caller';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'authorityPda';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'messageTransmitter';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'usedNonces';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'receiver';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'eventAuthority';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'program';
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: 'params';
          type: {
            defined: 'ReceiveMessageParams';
          };
        },
      ];
    },
    {
      name: 'reclaimEventAccount';
      accounts: [
        {
          name: 'payee';
          isMut: true;
          isSigner: true;
          docs: ['rent SOL receiver, should match original rent payer'];
        },
        {
          name: 'messageTransmitter';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'messageSentEventData';
          isMut: true;
          isSigner: false;
        },
      ];
      args: [
        {
          name: 'params';
          type: {
            defined: 'ReclaimEventAccountParams';
          };
        },
      ];
    },
    {
      name: 'getNoncePda';
      accounts: [
        {
          name: 'messageTransmitter';
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: 'params';
          type: {
            defined: 'GetNoncePDAParams';
          };
        },
      ];
      returns: 'publicKey';
    },
    {
      name: 'isNonceUsed';
      accounts: [
        {
          name: 'usedNonces';
          isMut: false;
          isSigner: false;
          docs: [
            "Account will be explicitly loaded to avoid error when it's not initialized",
          ];
        },
      ];
      args: [
        {
          name: 'params';
          type: {
            defined: 'IsNonceUsedParams';
          };
        },
      ];
      returns: 'bool';
    },
  ];
  accounts: [
    {
      name: 'messageSent';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'rentPayer';
            type: 'publicKey';
          },
          {
            name: 'message';
            type: 'bytes';
          },
        ];
      };
    },
    {
      name: 'messageTransmitter';
      docs: ['Main state of the MessageTransmitter program'];
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'owner';
            type: 'publicKey';
          },
          {
            name: 'pendingOwner';
            type: 'publicKey';
          },
          {
            name: 'attesterManager';
            type: 'publicKey';
          },
          {
            name: 'pauser';
            type: 'publicKey';
          },
          {
            name: 'paused';
            type: 'bool';
          },
          {
            name: 'localDomain';
            type: 'u32';
          },
          {
            name: 'version';
            type: 'u32';
          },
          {
            name: 'signatureThreshold';
            type: 'u32';
          },
          {
            name: 'enabledAttesters';
            type: {
              vec: 'publicKey';
            };
          },
          {
            name: 'maxMessageBodySize';
            type: 'u64';
          },
          {
            name: 'nextAvailableNonce';
            type: 'u64';
          },
        ];
      };
    },
    {
      name: 'usedNonces';
      docs: [
        'UsedNonces account holds an array of bits that indicate which nonces were already used',
        "so they can't be resused to receive new messages. Array starts with the first_nonce and",
        'holds flags for UsedNonces::MAX_NONCES. Nonces are recorded separately for each remote_domain.',
      ];
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'remoteDomain';
            type: 'u32';
          },
          {
            name: 'firstNonce';
            type: 'u64';
          },
          {
            name: 'usedNonces';
            type: {
              array: ['u64', 100];
            };
          },
        ];
      };
    },
  ];
  types: [
    {
      name: 'AcceptOwnershipParams';
      type: {
        kind: 'struct';
        fields: [];
      };
    },
    {
      name: 'DisableAttesterParams';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'attester';
            type: 'publicKey';
          },
        ];
      };
    },
    {
      name: 'EnableAttesterParams';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'newAttester';
            type: 'publicKey';
          },
        ];
      };
    },
    {
      name: 'GetNoncePDAParams';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'nonce';
            type: 'u64';
          },
          {
            name: 'sourceDomain';
            type: 'u32';
          },
        ];
      };
    },
    {
      name: 'InitializeParams';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'localDomain';
            type: 'u32';
          },
          {
            name: 'attester';
            type: 'publicKey';
          },
          {
            name: 'maxMessageBodySize';
            type: 'u64';
          },
          {
            name: 'version';
            type: 'u32';
          },
        ];
      };
    },
    {
      name: 'IsNonceUsedParams';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'nonce';
            type: 'u64';
          },
        ];
      };
    },
    {
      name: 'PauseParams';
      type: {
        kind: 'struct';
        fields: [];
      };
    },
    {
      name: 'ReceiveMessageParams';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'message';
            type: 'bytes';
          },
          {
            name: 'attestation';
            type: 'bytes';
          },
        ];
      };
    },
    {
      name: 'HandleReceiveMessageParams';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'remoteDomain';
            type: 'u32';
          },
          {
            name: 'sender';
            type: 'publicKey';
          },
          {
            name: 'messageBody';
            type: 'bytes';
          },
          {
            name: 'authorityBump';
            type: 'u8';
          },
        ];
      };
    },
    {
      name: 'ReclaimEventAccountParams';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'attestation';
            type: 'bytes';
          },
        ];
      };
    },
    {
      name: 'ReplaceMessageParams';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'originalMessage';
            type: 'bytes';
          },
          {
            name: 'originalAttestation';
            type: 'bytes';
          },
          {
            name: 'newMessageBody';
            type: 'bytes';
          },
          {
            name: 'newDestinationCaller';
            type: 'publicKey';
          },
        ];
      };
    },
    {
      name: 'SendMessageWithCallerParams';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'destinationDomain';
            type: 'u32';
          },
          {
            name: 'recipient';
            type: 'publicKey';
          },
          {
            name: 'messageBody';
            type: 'bytes';
          },
          {
            name: 'destinationCaller';
            type: 'publicKey';
          },
        ];
      };
    },
    {
      name: 'SendMessageParams';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'destinationDomain';
            type: 'u32';
          },
          {
            name: 'recipient';
            type: 'publicKey';
          },
          {
            name: 'messageBody';
            type: 'bytes';
          },
        ];
      };
    },
    {
      name: 'SetMaxMessageBodySizeParams';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'newMaxMessageBodySize';
            type: 'u64';
          },
        ];
      };
    },
    {
      name: 'SetSignatureThresholdParams';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'newSignatureThreshold';
            type: 'u32';
          },
        ];
      };
    },
    {
      name: 'TransferOwnershipParams';
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
      name: 'UnpauseParams';
      type: {
        kind: 'struct';
        fields: [];
      };
    },
    {
      name: 'UpdateAttesterManagerParams';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'newAttesterManager';
            type: 'publicKey';
          },
        ];
      };
    },
    {
      name: 'UpdatePauserParams';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'newPauser';
            type: 'publicKey';
          },
        ];
      };
    },
    {
      name: 'MathError';
      type: {
        kind: 'enum';
        variants: [
          {
            name: 'MathOverflow';
          },
          {
            name: 'MathUnderflow';
          },
          {
            name: 'ErrorInDivision';
          },
        ];
      };
    },
  ];
  events: [
    {
      name: 'OwnershipTransferStarted';
      fields: [
        {
          name: 'previousOwner';
          type: 'publicKey';
          index: false;
        },
        {
          name: 'newOwner';
          type: 'publicKey';
          index: false;
        },
      ];
    },
    {
      name: 'OwnershipTransferred';
      fields: [
        {
          name: 'previousOwner';
          type: 'publicKey';
          index: false;
        },
        {
          name: 'newOwner';
          type: 'publicKey';
          index: false;
        },
      ];
    },
    {
      name: 'PauserChanged';
      fields: [
        {
          name: 'newAddress';
          type: 'publicKey';
          index: false;
        },
      ];
    },
    {
      name: 'AttesterManagerUpdated';
      fields: [
        {
          name: 'previousAttesterManager';
          type: 'publicKey';
          index: false;
        },
        {
          name: 'newAttesterManager';
          type: 'publicKey';
          index: false;
        },
      ];
    },
    {
      name: 'MessageReceived';
      fields: [
        {
          name: 'caller';
          type: 'publicKey';
          index: false;
        },
        {
          name: 'sourceDomain';
          type: 'u32';
          index: false;
        },
        {
          name: 'nonce';
          type: 'u64';
          index: false;
        },
        {
          name: 'sender';
          type: 'publicKey';
          index: false;
        },
        {
          name: 'messageBody';
          type: 'bytes';
          index: false;
        },
      ];
    },
    {
      name: 'SignatureThresholdUpdated';
      fields: [
        {
          name: 'oldSignatureThreshold';
          type: 'u32';
          index: false;
        },
        {
          name: 'newSignatureThreshold';
          type: 'u32';
          index: false;
        },
      ];
    },
    {
      name: 'AttesterEnabled';
      fields: [
        {
          name: 'attester';
          type: 'publicKey';
          index: false;
        },
      ];
    },
    {
      name: 'AttesterDisabled';
      fields: [
        {
          name: 'attester';
          type: 'publicKey';
          index: false;
        },
      ];
    },
    {
      name: 'MaxMessageBodySizeUpdated';
      fields: [
        {
          name: 'newMaxMessageBodySize';
          type: 'u64';
          index: false;
        },
      ];
    },
    {
      name: 'Pause';
      fields: [];
    },
    {
      name: 'Unpause';
      fields: [];
    },
  ];
  errors: [
    {
      code: 6000;
      name: 'InvalidAuthority';
      msg: 'Invalid authority';
    },
    {
      code: 6001;
      name: 'ProgramPaused';
      msg: 'Instruction is not allowed at this time';
    },
    {
      code: 6002;
      name: 'InvalidMessageTransmitterState';
      msg: 'Invalid message transmitter state';
    },
    {
      code: 6003;
      name: 'InvalidSignatureThreshold';
      msg: 'Invalid signature threshold';
    },
    {
      code: 6004;
      name: 'SignatureThresholdAlreadySet';
      msg: 'Signature threshold already set';
    },
    {
      code: 6005;
      name: 'InvalidOwner';
      msg: 'Invalid owner';
    },
    {
      code: 6006;
      name: 'InvalidPauser';
      msg: 'Invalid pauser';
    },
    {
      code: 6007;
      name: 'InvalidAttesterManager';
      msg: 'Invalid attester manager';
    },
    {
      code: 6008;
      name: 'InvalidAttester';
      msg: 'Invalid attester';
    },
    {
      code: 6009;
      name: 'AttesterAlreadyEnabled';
      msg: 'Attester already enabled';
    },
    {
      code: 6010;
      name: 'TooFewEnabledAttesters';
      msg: 'Too few enabled attesters';
    },
    {
      code: 6011;
      name: 'SignatureThresholdTooLow';
      msg: 'Signature threshold is too low';
    },
    {
      code: 6012;
      name: 'AttesterAlreadyDisabled';
      msg: 'Attester already disabled';
    },
    {
      code: 6013;
      name: 'MessageBodyLimitExceeded';
      msg: 'Message body exceeds max size';
    },
    {
      code: 6014;
      name: 'InvalidDestinationCaller';
      msg: 'Invalid destination caller';
    },
    {
      code: 6015;
      name: 'InvalidRecipient';
      msg: 'Invalid message recipient';
    },
    {
      code: 6016;
      name: 'SenderNotPermitted';
      msg: 'Sender is not permitted';
    },
    {
      code: 6017;
      name: 'InvalidSourceDomain';
      msg: 'Invalid source domain';
    },
    {
      code: 6018;
      name: 'InvalidDestinationDomain';
      msg: 'Invalid destination domain';
    },
    {
      code: 6019;
      name: 'InvalidMessageVersion';
      msg: 'Invalid message version';
    },
    {
      code: 6020;
      name: 'InvalidUsedNoncesAccount';
      msg: 'Invalid used nonces account';
    },
    {
      code: 6021;
      name: 'InvalidRecipientProgram';
      msg: 'Invalid recipient program';
    },
    {
      code: 6022;
      name: 'InvalidNonce';
      msg: 'Invalid nonce';
    },
    {
      code: 6023;
      name: 'NonceAlreadyUsed';
      msg: 'Nonce already used';
    },
    {
      code: 6024;
      name: 'MessageTooShort';
      msg: 'Message is too short';
    },
    {
      code: 6025;
      name: 'MalformedMessage';
      msg: 'Malformed message';
    },
    {
      code: 6026;
      name: 'InvalidSignatureOrderOrDupe';
      msg: 'Invalid signature order or dupe';
    },
    {
      code: 6027;
      name: 'InvalidAttesterSignature';
      msg: 'Invalid attester signature';
    },
    {
      code: 6028;
      name: 'InvalidAttestationLength';
      msg: 'Invalid attestation length';
    },
    {
      code: 6029;
      name: 'InvalidSignatureRecoveryId';
      msg: 'Invalid signature recovery ID';
    },
    {
      code: 6030;
      name: 'InvalidSignatureSValue';
      msg: 'Invalid signature S value';
    },
    {
      code: 6031;
      name: 'InvalidMessageHash';
      msg: 'Invalid message hash';
    },
  ];
};

export const IDL: MessageTransmitter = {
  version: '0.1.0',
  name: 'message_transmitter',
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
          name: 'upgradeAuthority',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'messageTransmitter',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'messageTransmitterProgramData',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'messageTransmitterProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'eventAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'program',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'params',
          type: {
            defined: 'InitializeParams',
          },
        },
      ],
    },
    {
      name: 'transferOwnership',
      accounts: [
        {
          name: 'owner',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'messageTransmitter',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'eventAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'program',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'params',
          type: {
            defined: 'TransferOwnershipParams',
          },
        },
      ],
    },
    {
      name: 'acceptOwnership',
      accounts: [
        {
          name: 'pendingOwner',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'messageTransmitter',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'eventAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'program',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'params',
          type: {
            defined: 'AcceptOwnershipParams',
          },
        },
      ],
    },
    {
      name: 'updatePauser',
      accounts: [
        {
          name: 'owner',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'messageTransmitter',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'eventAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'program',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'params',
          type: {
            defined: 'UpdatePauserParams',
          },
        },
      ],
    },
    {
      name: 'updateAttesterManager',
      accounts: [
        {
          name: 'owner',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'messageTransmitter',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'eventAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'program',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'params',
          type: {
            defined: 'UpdateAttesterManagerParams',
          },
        },
      ],
    },
    {
      name: 'pause',
      accounts: [
        {
          name: 'pauser',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'messageTransmitter',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'eventAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'program',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'params',
          type: {
            defined: 'PauseParams',
          },
        },
      ],
    },
    {
      name: 'unpause',
      accounts: [
        {
          name: 'pauser',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'messageTransmitter',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'eventAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'program',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'params',
          type: {
            defined: 'UnpauseParams',
          },
        },
      ],
    },
    {
      name: 'setMaxMessageBodySize',
      accounts: [
        {
          name: 'owner',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'messageTransmitter',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'eventAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'program',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'params',
          type: {
            defined: 'SetMaxMessageBodySizeParams',
          },
        },
      ],
    },
    {
      name: 'enableAttester',
      accounts: [
        {
          name: 'payer',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'attesterManager',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'messageTransmitter',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'eventAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'program',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'params',
          type: {
            defined: 'EnableAttesterParams',
          },
        },
      ],
    },
    {
      name: 'disableAttester',
      accounts: [
        {
          name: 'payer',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'attesterManager',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'messageTransmitter',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'eventAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'program',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'params',
          type: {
            defined: 'DisableAttesterParams',
          },
        },
      ],
    },
    {
      name: 'setSignatureThreshold',
      accounts: [
        {
          name: 'attesterManager',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'messageTransmitter',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'eventAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'program',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'params',
          type: {
            defined: 'SetSignatureThresholdParams',
          },
        },
      ],
    },
    {
      name: 'sendMessage',
      accounts: [
        {
          name: 'eventRentPayer',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'senderAuthorityPda',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'messageTransmitter',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'messageSentEventData',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'senderProgram',
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
          name: 'params',
          type: {
            defined: 'SendMessageParams',
          },
        },
      ],
      returns: 'u64',
    },
    {
      name: 'sendMessageWithCaller',
      accounts: [
        {
          name: 'eventRentPayer',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'senderAuthorityPda',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'messageTransmitter',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'messageSentEventData',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'senderProgram',
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
          name: 'params',
          type: {
            defined: 'SendMessageWithCallerParams',
          },
        },
      ],
      returns: 'u64',
    },
    {
      name: 'replaceMessage',
      accounts: [
        {
          name: 'eventRentPayer',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'senderAuthorityPda',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'messageTransmitter',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'messageSentEventData',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'senderProgram',
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
          name: 'params',
          type: {
            defined: 'ReplaceMessageParams',
          },
        },
      ],
      returns: 'u64',
    },
    {
      name: 'receiveMessage',
      accounts: [
        {
          name: 'payer',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'caller',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'authorityPda',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'messageTransmitter',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'usedNonces',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'receiver',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'eventAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'program',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'params',
          type: {
            defined: 'ReceiveMessageParams',
          },
        },
      ],
    },
    {
      name: 'reclaimEventAccount',
      accounts: [
        {
          name: 'payee',
          isMut: true,
          isSigner: true,
          docs: ['rent SOL receiver, should match original rent payer'],
        },
        {
          name: 'messageTransmitter',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'messageSentEventData',
          isMut: true,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'params',
          type: {
            defined: 'ReclaimEventAccountParams',
          },
        },
      ],
    },
    {
      name: 'getNoncePda',
      accounts: [
        {
          name: 'messageTransmitter',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'params',
          type: {
            defined: 'GetNoncePDAParams',
          },
        },
      ],
      returns: 'publicKey',
    },
    {
      name: 'isNonceUsed',
      accounts: [
        {
          name: 'usedNonces',
          isMut: false,
          isSigner: false,
          docs: [
            "Account will be explicitly loaded to avoid error when it's not initialized",
          ],
        },
      ],
      args: [
        {
          name: 'params',
          type: {
            defined: 'IsNonceUsedParams',
          },
        },
      ],
      returns: 'bool',
    },
  ],
  accounts: [
    {
      name: 'messageSent',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'rentPayer',
            type: 'publicKey',
          },
          {
            name: 'message',
            type: 'bytes',
          },
        ],
      },
    },
    {
      name: 'messageTransmitter',
      docs: ['Main state of the MessageTransmitter program'],
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'owner',
            type: 'publicKey',
          },
          {
            name: 'pendingOwner',
            type: 'publicKey',
          },
          {
            name: 'attesterManager',
            type: 'publicKey',
          },
          {
            name: 'pauser',
            type: 'publicKey',
          },
          {
            name: 'paused',
            type: 'bool',
          },
          {
            name: 'localDomain',
            type: 'u32',
          },
          {
            name: 'version',
            type: 'u32',
          },
          {
            name: 'signatureThreshold',
            type: 'u32',
          },
          {
            name: 'enabledAttesters',
            type: {
              vec: 'publicKey',
            },
          },
          {
            name: 'maxMessageBodySize',
            type: 'u64',
          },
          {
            name: 'nextAvailableNonce',
            type: 'u64',
          },
        ],
      },
    },
    {
      name: 'usedNonces',
      docs: [
        'UsedNonces account holds an array of bits that indicate which nonces were already used',
        "so they can't be resused to receive new messages. Array starts with the first_nonce and",
        'holds flags for UsedNonces::MAX_NONCES. Nonces are recorded separately for each remote_domain.',
      ],
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'remoteDomain',
            type: 'u32',
          },
          {
            name: 'firstNonce',
            type: 'u64',
          },
          {
            name: 'usedNonces',
            type: {
              array: ['u64', 100],
            },
          },
        ],
      },
    },
  ],
  types: [
    {
      name: 'AcceptOwnershipParams',
      type: {
        kind: 'struct',
        fields: [],
      },
    },
    {
      name: 'DisableAttesterParams',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'attester',
            type: 'publicKey',
          },
        ],
      },
    },
    {
      name: 'EnableAttesterParams',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'newAttester',
            type: 'publicKey',
          },
        ],
      },
    },
    {
      name: 'GetNoncePDAParams',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'nonce',
            type: 'u64',
          },
          {
            name: 'sourceDomain',
            type: 'u32',
          },
        ],
      },
    },
    {
      name: 'InitializeParams',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'localDomain',
            type: 'u32',
          },
          {
            name: 'attester',
            type: 'publicKey',
          },
          {
            name: 'maxMessageBodySize',
            type: 'u64',
          },
          {
            name: 'version',
            type: 'u32',
          },
        ],
      },
    },
    {
      name: 'IsNonceUsedParams',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'nonce',
            type: 'u64',
          },
        ],
      },
    },
    {
      name: 'PauseParams',
      type: {
        kind: 'struct',
        fields: [],
      },
    },
    {
      name: 'ReceiveMessageParams',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'message',
            type: 'bytes',
          },
          {
            name: 'attestation',
            type: 'bytes',
          },
        ],
      },
    },
    {
      name: 'HandleReceiveMessageParams',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'remoteDomain',
            type: 'u32',
          },
          {
            name: 'sender',
            type: 'publicKey',
          },
          {
            name: 'messageBody',
            type: 'bytes',
          },
          {
            name: 'authorityBump',
            type: 'u8',
          },
        ],
      },
    },
    {
      name: 'ReclaimEventAccountParams',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'attestation',
            type: 'bytes',
          },
        ],
      },
    },
    {
      name: 'ReplaceMessageParams',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'originalMessage',
            type: 'bytes',
          },
          {
            name: 'originalAttestation',
            type: 'bytes',
          },
          {
            name: 'newMessageBody',
            type: 'bytes',
          },
          {
            name: 'newDestinationCaller',
            type: 'publicKey',
          },
        ],
      },
    },
    {
      name: 'SendMessageWithCallerParams',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'destinationDomain',
            type: 'u32',
          },
          {
            name: 'recipient',
            type: 'publicKey',
          },
          {
            name: 'messageBody',
            type: 'bytes',
          },
          {
            name: 'destinationCaller',
            type: 'publicKey',
          },
        ],
      },
    },
    {
      name: 'SendMessageParams',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'destinationDomain',
            type: 'u32',
          },
          {
            name: 'recipient',
            type: 'publicKey',
          },
          {
            name: 'messageBody',
            type: 'bytes',
          },
        ],
      },
    },
    {
      name: 'SetMaxMessageBodySizeParams',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'newMaxMessageBodySize',
            type: 'u64',
          },
        ],
      },
    },
    {
      name: 'SetSignatureThresholdParams',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'newSignatureThreshold',
            type: 'u32',
          },
        ],
      },
    },
    {
      name: 'TransferOwnershipParams',
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
      name: 'UnpauseParams',
      type: {
        kind: 'struct',
        fields: [],
      },
    },
    {
      name: 'UpdateAttesterManagerParams',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'newAttesterManager',
            type: 'publicKey',
          },
        ],
      },
    },
    {
      name: 'UpdatePauserParams',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'newPauser',
            type: 'publicKey',
          },
        ],
      },
    },
    {
      name: 'MathError',
      type: {
        kind: 'enum',
        variants: [
          {
            name: 'MathOverflow',
          },
          {
            name: 'MathUnderflow',
          },
          {
            name: 'ErrorInDivision',
          },
        ],
      },
    },
  ],
  events: [
    {
      name: 'OwnershipTransferStarted',
      fields: [
        {
          name: 'previousOwner',
          type: 'publicKey',
          index: false,
        },
        {
          name: 'newOwner',
          type: 'publicKey',
          index: false,
        },
      ],
    },
    {
      name: 'OwnershipTransferred',
      fields: [
        {
          name: 'previousOwner',
          type: 'publicKey',
          index: false,
        },
        {
          name: 'newOwner',
          type: 'publicKey',
          index: false,
        },
      ],
    },
    {
      name: 'PauserChanged',
      fields: [
        {
          name: 'newAddress',
          type: 'publicKey',
          index: false,
        },
      ],
    },
    {
      name: 'AttesterManagerUpdated',
      fields: [
        {
          name: 'previousAttesterManager',
          type: 'publicKey',
          index: false,
        },
        {
          name: 'newAttesterManager',
          type: 'publicKey',
          index: false,
        },
      ],
    },
    {
      name: 'MessageReceived',
      fields: [
        {
          name: 'caller',
          type: 'publicKey',
          index: false,
        },
        {
          name: 'sourceDomain',
          type: 'u32',
          index: false,
        },
        {
          name: 'nonce',
          type: 'u64',
          index: false,
        },
        {
          name: 'sender',
          type: 'publicKey',
          index: false,
        },
        {
          name: 'messageBody',
          type: 'bytes',
          index: false,
        },
      ],
    },
    {
      name: 'SignatureThresholdUpdated',
      fields: [
        {
          name: 'oldSignatureThreshold',
          type: 'u32',
          index: false,
        },
        {
          name: 'newSignatureThreshold',
          type: 'u32',
          index: false,
        },
      ],
    },
    {
      name: 'AttesterEnabled',
      fields: [
        {
          name: 'attester',
          type: 'publicKey',
          index: false,
        },
      ],
    },
    {
      name: 'AttesterDisabled',
      fields: [
        {
          name: 'attester',
          type: 'publicKey',
          index: false,
        },
      ],
    },
    {
      name: 'MaxMessageBodySizeUpdated',
      fields: [
        {
          name: 'newMaxMessageBodySize',
          type: 'u64',
          index: false,
        },
      ],
    },
    {
      name: 'Pause',
      fields: [],
    },
    {
      name: 'Unpause',
      fields: [],
    },
  ],
  errors: [
    {
      code: 6000,
      name: 'InvalidAuthority',
      msg: 'Invalid authority',
    },
    {
      code: 6001,
      name: 'ProgramPaused',
      msg: 'Instruction is not allowed at this time',
    },
    {
      code: 6002,
      name: 'InvalidMessageTransmitterState',
      msg: 'Invalid message transmitter state',
    },
    {
      code: 6003,
      name: 'InvalidSignatureThreshold',
      msg: 'Invalid signature threshold',
    },
    {
      code: 6004,
      name: 'SignatureThresholdAlreadySet',
      msg: 'Signature threshold already set',
    },
    {
      code: 6005,
      name: 'InvalidOwner',
      msg: 'Invalid owner',
    },
    {
      code: 6006,
      name: 'InvalidPauser',
      msg: 'Invalid pauser',
    },
    {
      code: 6007,
      name: 'InvalidAttesterManager',
      msg: 'Invalid attester manager',
    },
    {
      code: 6008,
      name: 'InvalidAttester',
      msg: 'Invalid attester',
    },
    {
      code: 6009,
      name: 'AttesterAlreadyEnabled',
      msg: 'Attester already enabled',
    },
    {
      code: 6010,
      name: 'TooFewEnabledAttesters',
      msg: 'Too few enabled attesters',
    },
    {
      code: 6011,
      name: 'SignatureThresholdTooLow',
      msg: 'Signature threshold is too low',
    },
    {
      code: 6012,
      name: 'AttesterAlreadyDisabled',
      msg: 'Attester already disabled',
    },
    {
      code: 6013,
      name: 'MessageBodyLimitExceeded',
      msg: 'Message body exceeds max size',
    },
    {
      code: 6014,
      name: 'InvalidDestinationCaller',
      msg: 'Invalid destination caller',
    },
    {
      code: 6015,
      name: 'InvalidRecipient',
      msg: 'Invalid message recipient',
    },
    {
      code: 6016,
      name: 'SenderNotPermitted',
      msg: 'Sender is not permitted',
    },
    {
      code: 6017,
      name: 'InvalidSourceDomain',
      msg: 'Invalid source domain',
    },
    {
      code: 6018,
      name: 'InvalidDestinationDomain',
      msg: 'Invalid destination domain',
    },
    {
      code: 6019,
      name: 'InvalidMessageVersion',
      msg: 'Invalid message version',
    },
    {
      code: 6020,
      name: 'InvalidUsedNoncesAccount',
      msg: 'Invalid used nonces account',
    },
    {
      code: 6021,
      name: 'InvalidRecipientProgram',
      msg: 'Invalid recipient program',
    },
    {
      code: 6022,
      name: 'InvalidNonce',
      msg: 'Invalid nonce',
    },
    {
      code: 6023,
      name: 'NonceAlreadyUsed',
      msg: 'Nonce already used',
    },
    {
      code: 6024,
      name: 'MessageTooShort',
      msg: 'Message is too short',
    },
    {
      code: 6025,
      name: 'MalformedMessage',
      msg: 'Malformed message',
    },
    {
      code: 6026,
      name: 'InvalidSignatureOrderOrDupe',
      msg: 'Invalid signature order or dupe',
    },
    {
      code: 6027,
      name: 'InvalidAttesterSignature',
      msg: 'Invalid attester signature',
    },
    {
      code: 6028,
      name: 'InvalidAttestationLength',
      msg: 'Invalid attestation length',
    },
    {
      code: 6029,
      name: 'InvalidSignatureRecoveryId',
      msg: 'Invalid signature recovery ID',
    },
    {
      code: 6030,
      name: 'InvalidSignatureSValue',
      msg: 'Invalid signature S value',
    },
    {
      code: 6031,
      name: 'InvalidMessageHash',
      msg: 'Invalid message hash',
    },
  ],
};
