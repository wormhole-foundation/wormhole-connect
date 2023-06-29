import React, { useState } from 'react';
import { makeStyles } from 'tss-react/mui';
import { useDispatch } from 'react-redux';
import { Select, MenuItem } from '@mui/material';
import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { CHAINS_ARR } from '../config';
import { getVaa } from '../utils/sdk';
import { ROUTES, getRouteForVaa } from '../utils/routes';
import { setTxDetails, setRoute as setTransferRoute } from '../store/redeem';
import { setRoute } from '../store/router';
import PageHeader from '../components/PageHeader';
import Search from '../components/Search';
import Button from '../components/Button';
import Spacer from '../components/Spacer';
import { isValidTxId } from '../utils';
import AlertBanner from '../components/AlertBanner';

const useStyles = makeStyles()((theme) => ({
  container: {
    maxWidth: '650px',
  },
  chain: {
    width: '175px',
    [theme.breakpoints.down('sm')]: {
      width: '100%',
    },
  },
  inputs: {
    display: 'flex',
    flexDirection: 'row',
    gap: '16px',
    [theme.breakpoints.down('sm')]: {
      flexDirection: 'column',
    },
  },
  search: {
    flexGrow: 1,
  },
}));

function TxSearch() {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const [state, setState] = useState({
    chain: '',
    tx: '',
  });
  const [error, setError] = useState('');

  function setChain(e: any) {
    setState((prevState) => ({ ...prevState, chain: e.target.value }));
  }

  function setTx(e: any) {
    setState((prevState) => ({ ...prevState, tx: e.target.value }));
  }

  async function search() {
    if (!state.tx || !state.chain) {
      return setError('Enter the source chain and transaction ID');
    }
    if (!isValidTxId(state.chain, state.tx)) {
      return setError('Invalid transaction ID');
    }
    try {
      const vaaInfo = await getVaa(state.tx, state.chain as ChainName);
      const route = getRouteForVaa(vaaInfo.vaa);
      const message = await ROUTES[route].parseMessage(vaaInfo);
      setError('');
      dispatch(setTxDetails(message));
      dispatch(setTransferRoute(route));
      dispatch(setRoute('redeem'));
    } catch (e) {
      console.error(e);
      setError(
        'Bridge transaction not found, check that you have the correct chain and transaction ID',
      );
    }
  }

  return (
    <div className={classes.container}>
      <PageHeader
        title="Resume transaction"
        description="Bridging can require a manual redemption process on the designation chain. If you did not complete the redemption during your initial transaction, you may do so here."
        back
      />

      <div className={classes.inputs}>
        <div className={classes.chain}>
          <Select
            sx={{ width: '100%', height: '100%', minHeight: '64.5px' }}
            value={state.chain}
            displayEmpty
            placeholder="Select network"
            onChange={(e) => setChain(e)}
          >
            <MenuItem disabled value="" key={0}>
              Select network
            </MenuItem>
            {CHAINS_ARR.map((chain, i) => {
              return (
                <MenuItem value={chain.key} key={i + 1}>
                  {chain.displayName}
                </MenuItem>
              );
            })}
          </Select>
        </div>
        <div className={classes.search}>
          <Search
            placeholder="Source chain transaction hash"
            onChange={setTx}
            onSearch={search}
          />
        </div>
      </div>

      <Spacer />

      <AlertBanner show={!!error} content={error} error margin="0 0 16px 0" />

      <Button disabled={!state.chain || !state.tx} elevated onClick={search}>
        Search
      </Button>
    </div>
  );
}

export default TxSearch;
