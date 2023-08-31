import React from 'react';
import { WormholeConnectConfig } from './types';

class WormholeBridge extends React.Component<
  { config?: WormholeConnectConfig; }
> {
  componentDidMount() {
    const script = document.createElement("script");
    script.src = "https://www.unpkg.com/@wormhole-foundation/wormhole-connect@0.0.11/dist/main.js";
    script.async = true;

    const link = document.createElement("link");
    link.href = "https://www.unpkg.com/@wormhole-foundation/wormhole-connect@0.0.11/dist/main.css";

    document.body.appendChild(script);
    document.body.appendChild(link);
  }

  render() {
    return (
      // @ts-ignore
      <div id="wormhole-connect" config={this.props.config ? JSON.stringify(this.props.config) : null}></div>
    );
  }
}

export * from './theme';
export * from './types';
export default WormholeBridge;
