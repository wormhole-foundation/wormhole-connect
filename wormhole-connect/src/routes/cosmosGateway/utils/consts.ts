export const IBC_MSG_TYPE = '/ibc.applications.transfer.v1.MsgTransfer';
export const IBC_PORT = 'transfer';
export const IBC_TIMEOUT_MILLIS = 10 * 60 * 1000; // 10 minutes

export const millisToNano = (seconds: number) => seconds * 1_000_000;
