export class InboundQueuedTransferNotFoundError extends Error {
  static MESSAGE = 'InboundQueuedTransferNotFound';
  constructor() {
    super(InboundQueuedTransferNotFoundError.MESSAGE);
  }
}

export class InboundQueuedTransferStillQueuedError extends Error {
  static MESSAGE = 'InboundQueuedTransferStillQueued';
  constructor() {
    super(InboundQueuedTransferStillQueuedError.MESSAGE);
  }
}

export class NotEnoughCapacityError extends Error {
  static MESSAGE = 'NotEnoughCapacity';
  constructor() {
    super(NotEnoughCapacityError.MESSAGE);
  }
}

export class RequireContractIsNotPausedError extends Error {
  static MESSAGE = 'RequireContractIsNotPaused';
  constructor() {
    super(RequireContractIsNotPausedError.MESSAGE);
  }
}

export class DestContractIsPausedError extends Error {
  static MESSAGE = 'DestContractIsPaused';
  constructor() {
    super(DestContractIsPausedError.MESSAGE);
  }
}
