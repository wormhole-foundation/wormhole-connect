import * as React from 'react';
import { makeStyles } from '@mui/styles';
import { useSelector } from 'react-redux';
import { RootState } from './store';
import './App.css';
import Bridge from './views/Bridge/Bridge';
import WalletModal from './views/WalletModal';

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

  return (
    <div className={classes.appContent}>
      {showWalletModal && <WalletModal />}
      <Bridge />
      {/* if (route === 'bridge') {
          return <Bridge />
        } else if (route === 'milestones') {
          return <Milestones />
        } else if (route === 'redeem') {
          return <Redeem />
        } else if (route === 'terms') {
          return <Terms /> // not sure if we want this embedded or just a link
        }
      */}
    </div>
  );
}

export default AppRouter;
