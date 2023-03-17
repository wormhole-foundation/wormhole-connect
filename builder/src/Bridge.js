import React from 'react';
// import config from './wormhole-config.json';
// import * as theme from './theme';

class WormholeBridge extends React.Component {
  componentDidMount() {
    const script = document.createElement("script");
    script.src = "https://wormhole-foundation.github.io/wormhole-connect/main.js";
    script.async = true;

    const link = document.createElement("link");
    link.src = "https://wormhole-foundation.github.io/wormhole-connect/main.css";
    link.async = true;

    document.body.appendChild(script);
    document.body.appendChild(link);
  }

  render() {
    return (
      // <div id="wormhole-connect" config={JSON.stringify(config)}></div>
      <div id="wormhole-connect"></div>
    );
  }
}

export default WormholeBridge;
