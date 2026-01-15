import type { Network } from '@wormhole-foundation/sdk-base';
import type { routes } from '@wormhole-foundation/sdk-connect';
import { MayanRouteBase } from './MayanRouteBase';
import type { TransferParams, ValidationResult } from './types';

export abstract class MayanRouteCrossChain<
  N extends Network,
> extends MayanRouteBase<N> {
  override async validate(
    request: routes.RouteTransferRequest<N>,
    params: TransferParams,
  ): Promise<ValidationResult> {
    if (request.fromChain?.chain === request.toChain?.chain) {
      return {
        valid: false,
        params,
        error: new Error(
          'This route does not support same-chain swaps. Use MONO_CHAIN route for same-chain swaps.',
        ),
      };
    }

    return super.validate(request, params);
  }
}
