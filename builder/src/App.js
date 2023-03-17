import React from 'react';
import { copyTextToClipboard } from './utils';
import WormholeBridge from './Bridge.js';
import Background from './Background';
// import config from './wormhole-config.json';
// import * as theme from './theme';

function App() {
  const script = `
    <div id="wormhole-connect"></div>
    <script src="https://wormhole-foundation.github.io/wormhole-connect/main.js"></script>
    <link src="https://wormhole-foundation.github.io/wormhole-connect/main.css"/>
  `
  // config.customTheme = theme.dark;
  return (
    <div className="App">
      <Background>
        <div style={{paddingBottom: '60px'}}>
          <div style={{marginTop: '60px', textAlign: 'center', marginBottom: '16px'}}>My application</div>
          <div
            style={{padding: '16px', backgroundColor: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.3', borderRadius: '8px', maxWidth: '150px', margin: 'auto', cursor: 'pointer', display: 'flex', justifyContent: 'center'}}
            onClick={() => copyTextToClipboard(script)}
          >
            Copy script
          </div>

          <WormholeBridge />
        </div>
      </Background>
    </div>
  );
}

export default App;
