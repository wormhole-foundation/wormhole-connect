import React, { useState } from 'react';
import { makeStyles } from 'tss-react/mui';
import { useDispatch } from 'react-redux';
import { Select, MenuItem } from '@mui/material';
import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { CHAINS_ARR } from '../sdk/config';
import { parseMessageFromTx } from '../sdk/sdk';
import { setTxDetails } from '../store/redeem';
import { setRoute } from '../store/router';
import PageHeader from '../components/PageHeader';
import Search from '../components/Search';
import Button from '../components/Button';
import Spacer from '../components/Spacer';
import { isValidTxId } from '../utils';

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

  function setChain(e: any) {
    setState({ ...state, chain: e.target.value });
  }

  function setTx(e: any) {
    if (isValidTxId(e.target.value)) {
      setState({ ...state, tx: e.target.value });
    }
  }

  async function search() {
    if (!state.tx || !state.chain) return;
    const message = await parseMessageFromTx(
      state.tx,
      state.chain as ChainName,
    );
    dispatch(setTxDetails(message));
    dispatch(setRoute('redeem'));
  }

  return (
    <div className={classes.container}>
      <PageHeader
        title="Resume transfer"
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

      <Button disabled={!state.chain || !state.tx} elevated onClick={search}>
        Search
      </Button>
    </div>
  );
}

export default TxSearch;
