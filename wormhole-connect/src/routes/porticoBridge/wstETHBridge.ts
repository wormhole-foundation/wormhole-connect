import { wstETHBridgeMaxAmount } from 'config';
import { PorticoBridge } from './porticoBridge';
import { Route } from 'config/types';

export class wstETHBridge extends PorticoBridge {
  readonly TYPE: Route = Route.wstETHBridge;
  static readonly SUPPORTED_TOKENS: string[] = ['wstETH'];

  constructor() {
    super(wstETHBridge.SUPPORTED_TOKENS, wstETHBridgeMaxAmount);
  }
}
