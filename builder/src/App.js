import React from 'react';
import { copyTextToClipboard } from './utils';
import config from './wormhole-config.json';
import * as theme from './theme';

class App extends React.Component {
  componentDidMount() {
    const link = document.createElement("link");
    link.src = "https://wormhole-foundation.github.io/wormhole-connect/main.css";
    link.async = true;

    const script1 = document.createElement("script");
    script1.src = "https://wormhole-foundation.github.io/wormhole-connect/718.06852233.chunk.js";
    script1.async = true;

    const script2 = document.createElement("script");
    script2.src = "https://wormhole-foundation.github.io/wormhole-connect/main.js";
    script2.async = true;


    document.body.appendChild(link);
    document.body.appendChild(script1);
    document.body.appendChild(script2);
  }

  render() {
    const script = `
      <div id="wormhole-connect"></div>
      <script src="https://wormhole-foundation.github.io/wormhole-connect/main.js"></script>
      <script src="https://wormhole-foundation.github.io/wormhole-connect/718.06852233.chunk.js"></script>
      <link rel="https://wormhole-foundation.github.io/wormhole-connect/main.css" />
    `
    config.customTheme = theme.dark;
    return (
      <div className="App" style={{marginBottom: '60px'}}>
        <div style={{marginTop: '60px', textAlign: 'center', marginBottom: '16px'}}>My application</div>
        <div
          style={{padding: '16px', backgroundColor: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.3', borderRadius: '8px', maxWidth: '150px', margin: 'auto', cursor: 'pointer', display: 'flex', justifyContent: 'center'}}
          onClick={() => copyTextToClipboard(script)}
        >
          Copy script
        </div>
        <div id="wormhole-connect" config={JSON.stringify(config)}></div>
      </div>
    );
  }
}

export default App;
