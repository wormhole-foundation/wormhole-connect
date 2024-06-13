import config from 'config';
import { PorticoBridge } from './porticoBridge';
import { Route } from 'config/types';

export class ETHBridge extends PorticoBridge {
  readonly TYPE: Route = Route.ETHBridge;
  static readonly SUPPORTED_TOKENS: string[] = [
    'ETH',
    'WETH',
    'WETHpolygon',
    'WETHavax',
    'ETHarbitrum',
    'WETHarbitrum',
    'ETHoptimism',
    'WETHoptimism',
    'WETHbsc',
    'ETHbase',
    'WETHbase',
  ];

  constructor() {
    super(ETHBridge.SUPPORTED_TOKENS, config.ethBridgeMaxAmount);
  }
}
