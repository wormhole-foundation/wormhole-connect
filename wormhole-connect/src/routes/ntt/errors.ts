export class InboundQueuedTransferNotFoundError extends Error {
  static MESSAGE = 'Enqueued transfer not found.';
  constructor() {
    super(InboundQueuedTransferNotFoundError.MESSAGE);
  }
}

export class InboundQueuedTransferStillQueuedError extends Error {
  static MESSAGE = 'This transfer is still enqueued. Please try again later.';
  constructor() {
    super(InboundQueuedTransferStillQueuedError.MESSAGE);
  }
}

export class NotEnoughCapacityError extends Error {
  static MESSAGE =
    'The transfer limit is currently exceeded for this token. Please try again later.';
  constructor() {
    super(NotEnoughCapacityError.MESSAGE);
  }
}

export class ContractIsPausedError extends Error {
  static MESSAGE =
    'NTT for this token is currently paused on the source chain.';
  constructor() {
    super(ContractIsPausedError.MESSAGE);
  }
}

export class DestinationContractIsPausedError extends Error {
  static MESSAGE =
    'NTT for this token is currently paused on the destination chain.';
  constructor() {
    super(DestinationContractIsPausedError.MESSAGE);
  }
}

export class UnsupportedContractAbiVersion extends Error {
  static MESSAGE = 'Unsupported contract ABI version';
  constructor() {
    super(UnsupportedContractAbiVersion.MESSAGE);
  }
}
