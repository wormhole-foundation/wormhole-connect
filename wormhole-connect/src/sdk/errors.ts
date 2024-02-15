export class TokenNotSupportedForRelayError extends Error {
  static MESSAGE = 'Token not supported for relay';
  constructor() {
    super(TokenNotSupportedForRelayError.MESSAGE);
  }
}

export class TokenNotRegisteredError extends Error {
  static MESSAGE = 'Token not registered';
  constructor() {
    super(TokenNotRegisteredError.MESSAGE);
  }
}
