import { JsonRpcProvider } from '@mysten/sui.js';

export async function getObjectFields(
  provider: JsonRpcProvider,
  objectId: string,
) {
  const result = await provider.getObject({
    id: objectId,
    options: { showContent: true },
  });

  if (
    typeof result.data!.content !== 'string' &&
    'fields' in result.data!.content!
  ) {
    return result.data!.content.fields;
  } else {
    return null;
  }
}

export async function getWormholeFee(
  provider: JsonRpcProvider,
  coreStateObjectId: string,
) {
  const fields = await getObjectFields(provider, coreStateObjectId);
  if (fields === null) {
    throw new Error('core state object fields not found');
  }
  return fields.fee_collector.fields.fee_amount;
}
