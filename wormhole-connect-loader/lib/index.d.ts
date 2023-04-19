import React from 'react';
import { WormholeConnectConfig } from './types';
declare class WormholeBridge extends React.Component<{
    config?: WormholeConnectConfig;
}> {
    componentDidMount(): void;
    render(): JSX.Element;
}
export * from './theme';
export * from './types';
export default WormholeBridge;
