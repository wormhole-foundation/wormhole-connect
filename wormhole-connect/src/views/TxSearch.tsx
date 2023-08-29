import React, { useState } from 'react';
import { makeStyles } from 'tss-react/mui';
import { useDispatch } from 'react-redux';
import { Select, MenuItem, CircularProgress } from '@mui/material';
import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { CHAINS_ARR } from '../config';
import Operator from '../utils/routes';
import { setTxDetails, setRoute as setRedeemRoute } from '../store/redeem';
import { setRoute as setAppRoute } from '../store/router';
import PageHeader from '../components/PageHeader';
import Search from '../components/Search';
import Button from '../components/Button';
import Spacer from '../components/Spacer';
import { isValidTxId } from '../utils';
import AlertBanner from '../components/AlertBanner';
import { setToNetwork } from '../store/transferInput';

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
  const [loading, setLoading] = useState(false);

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
      setLoading(true);
      const operator = new Operator();
      const route = await operator.getRouteFromTx(
        state.tx,
        state.chain as ChainName,
      );
      const messageInfo = await operator.getMessageInfo(
        route,
        state.tx,
        state.chain as ChainName,
        true, // don't need to get the signed attestation
      );
      const message = await operator.parseMessage(route, messageInfo!);
      setError('');
      dispatch(setTxDetails(message));
      dispatch(setRedeemRoute(route));
      dispatch(setAppRoute('redeem'));
      dispatch(setToNetwork(message.toChain));
    } catch (e) {
      console.error(e);
      setError(
        'Bridge transaction not found, check that you have the correct chain and transaction ID',
      );
    } finally {
      setLoading(false);
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
            {CHAINS_ARR.filter((chain) => chain.key !== 'wormchain').map(
              (chain, i) => {
                return (
                  <MenuItem value={chain.key} key={i + 1}>
                    {chain.displayName}
                  </MenuItem>
                );
              },
            )}
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
        {loading ? <CircularProgress size={24} /> : 'Search'}
      </Button>
    </div>
  );
}

export default TxSearch;
