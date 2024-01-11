import { ethBridgeMaxAmount } from 'config';
import { PorticoBridge } from './porticoBridge';
import { Route } from 'config/types';

export class ETHBridge extends PorticoBridge {
  readonly TYPE: Route = Route.ETHBridge;
  static readonly SUPPORTED_TOKENS: string[] = ['ETH', 'WETH'];

  constructor() {
    super(ETHBridge.SUPPORTED_TOKENS, ethBridgeMaxAmount);
  }
}
