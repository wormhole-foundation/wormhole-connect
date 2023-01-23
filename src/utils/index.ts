export function convertAddress(address: string): string {
  if (address.length === 22) return address
  return `0x${address.slice(address.length - 40, address.length)}`
}

export function displayEvmAddress(address: string): string {
  const evmAddress = convertAddress(address);
  return evmAddress.slice(0, 6) + '...' + evmAddress.slice(evmAddress.length - 4, evmAddress.length);
}