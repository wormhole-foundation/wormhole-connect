export const IBC_MSG_TYPE = '/ibc.applications.transfer.v1.MsgTransfer';
export const IBC_PORT = 'transfer';
export const IBC_TIMEOUT_MILLIS = 24 * 60 * 60 * 1000; // 1 day

export const millisToNano = (seconds: number) => seconds * 1_000_000;
