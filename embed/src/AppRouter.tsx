import * as React from 'react';
import { makeStyles } from '@mui/styles';
import { useSelector } from 'react-redux';
import { RootState } from './store';
import './App.css';
import Bridge from './views/Bridge/Bridge';
import WalletModal from './views/WalletModal';
import Redeem from './views/Redeem/Redeem';

const useStyles = makeStyles(() => ({
  appContent: {
    textAlign: 'left',
    margin: '40px auto',
    maxWidth: '900px',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    padding: '16px'
  },
}));

// since this will be embedded, we'll have to use pseudo routes instead of relying on the url
function AppRouter() {
  const classes = useStyles();
  // const el = document.getElementById('wormhole-connect');
  // if (!el)
  //   throw new Error('must specify an anchor element with id wormhole-connect');
  // const config = el.getAttribute('config');
  // console.log('CONFIG', config);

  const showWalletModal = useSelector(
    (state: RootState) => state.router.showWalletModal,
  );

  const route = useSelector((state: RootState) => state.router.route);

  return (
    <div className={classes.appContent}>
      {showWalletModal && <WalletModal />}
      {route === 'bridge' && <Bridge />}
      {route === 'redeem' && <Redeem />}
    </div>
  );
}

export default AppRouter;
