import React from 'react';
import { copyTextToClipboard } from './utils';
import Background from './Background';
import { makeStyles } from 'tss-react/mui';
import WormholeBridge, { defaultTheme } from '@wormhole-foundation/wormhole-connect';

const useStyles = makeStyles()((theme) => ({
  appContent: {
    paddingBottom: '60px',
  },
  title: {
    marginTop: '60px',
    textAlign: 'center',
    marginBottom: '16px',
    color: 'white',
  },
  copy: {
    padding: '16px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '8px',
    maxWidth: '150px',
    margin: 'auto',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    color: 'white',
  }
}))

function App() {
  const { classes } = useStyles();
  const script = `
    <div id="wormhole-connect"></div>
    <script src="https://www.unpkg.com/@wormhole-foundation/wormhole-connect@0.0.1-beta.3/dist/main.js"></script>
    <link src="https://www.unpkg.com/@wormhole-foundation/wormhole-connect@0.0.1-beta.3/dist/main.css"/>
  `
  const customized = defaultTheme;
  customized.background.default = 'transparent';
  const config = {
    mode: 'dark',
    customTheme: customized
  }
  return (
    <div className="App">
      <Background>
        <div className={classes.appContent}>
          <div className={classes.title}>My application</div>
          <div
            className={classes.copy}
            onClick={() => copyTextToClipboard(script)}
          >
            Copy script
          </div>

          <WormholeBridge config={config} />
        </div>
      </Background>
    </div>
  );
}

export default App;
