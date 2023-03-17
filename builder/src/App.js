import React from 'react';
import { copyTextToClipboard } from './utils';
import WormholeBridge from './Bridge.js';
import Background from './Background';
import { makeStyles } from 'tss-react/mui';

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
    <script src="https://wormhole-foundation.github.io/wormhole-connect/main.js"></script>
    <link src="https://wormhole-foundation.github.io/wormhole-connect/main.css"/>
  `
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

          <WormholeBridge />
        </div>
      </Background>
    </div>
  );
}

export default App;
