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
    margin: 'auto',
    maxWidth: '900px',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
  },
}));

// since this will be embedded, we'll have to use pseudo routes instead of relying on the url
function AppRouter() {
  const classes = useStyles();

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
