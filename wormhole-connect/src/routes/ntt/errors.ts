export class InboundQueuedTransferNotFoundError extends Error {
  static MESSAGE = 'Inbound queued transfer not found';
  constructor() {
    super(InboundQueuedTransferNotFoundError.MESSAGE);
  }
}

export class InboundQueuedTransferStillQueuedError extends Error {
  static MESSAGE = 'Inbound queued transfer still queued';
  constructor() {
    super(InboundQueuedTransferStillQueuedError.MESSAGE);
  }
}

export class NotEnoughCapacityError extends Error {
  static MESSAGE = 'Not enough capacity';
  constructor() {
    super(NotEnoughCapacityError.MESSAGE);
  }
}

export class ContractIsPausedError extends Error {
  static MESSAGE = 'Contract is paused';
  constructor() {
    super(ContractIsPausedError.MESSAGE);
  }
}

export class DestinationContractIsPausedError extends Error {
  static MESSAGE = 'Destination contract is paused';
  constructor() {
    super(DestinationContractIsPausedError.MESSAGE);
  }
}
