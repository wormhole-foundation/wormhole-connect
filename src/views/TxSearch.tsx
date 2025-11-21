import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Select,
  MenuItem,
  CircularProgress,
  Box,
  Typography,
} from '@mui/material';

import config, { getWormholeContextV2 } from 'config';
import { isValidTxId } from 'utils';
import {
  setRoute as setRedeemRoute,
  setIsResumeTx,
  setTxDetails,
} from 'store/redeem';
import { setRoute as setAppRoute } from 'store/router';
import Search from 'components/Search';
import Button from 'components/v3/Button';
import AlertBanner from 'components/AlertBanner';
import { setToChain } from 'store/transferInput';
import FooterNavBar from 'components/FooterNavBar';
import { RouteContext } from 'contexts/RouteContext';

import { parseReceipt } from 'utils/sdkv2';
import type { AttestedTransferReceipt, Chain } from '@wormhole-foundation/sdk';
import { TransferState } from '@wormhole-foundation/sdk';
import ChainIconComponent from 'icons/ChainIcons';
import type { RootState } from 'store';
import { clearSearch } from 'store/search';
import { useTokens } from 'contexts/TokensContext';
import { FormContent } from 'components/v3/FormContent';
import Header from 'components/Header';
import { BackButton } from 'components/v3/BackButton';

const EMPTY = '';

function TxSearch() {
  const dispatch = useDispatch();
  const [state, setState] = useState({
    chain: EMPTY,
    tx: EMPTY,
    autoSearch: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const externalSearch = useSelector((state: RootState) => state.search);

  const routeContext = useContext(RouteContext);
  const { getOrFetchToken } = useTokens();

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
    if (!isValidTxId(state.chain as Chain, state.tx)) {
      return setError('Invalid transaction ID');
    }

    setLoading(true);

    const resumeResult = await config.routes.resumeFromTx({
      chain: state.chain as Chain,
      txid: state.tx,
    });

    if (resumeResult === null) {
      setError(
        'Transfer not found, check that you have the correct chain and transaction ID',
      );
      setLoading(false);
      return;
    }

    const { route } = resumeResult;
    let { receipt } = resumeResult;
    const wh = await getWormholeContextV2();
    const sdkRoute = new (config.routes.get(route).rc)(wh);
    setError('');

    // Track until we have an attestation
    if (receipt.state < TransferState.Attested) {
      for await (receipt of sdkRoute.track(receipt)) {
        if (receipt.state >= TransferState.Attested) {
          break;
        }
      }
    }

    const txDetails = await parseReceipt(
      route,
      receipt as AttestedTransferReceipt<any>,
      getOrFetchToken,
    );

    if (txDetails) {
      dispatch(setTxDetails(txDetails));

      dispatch(setIsResumeTx(true)); // To avoid send transfer.success event in Resume Transaction case
      dispatch(setRedeemRoute(route));
      dispatch(setAppRoute('redeem'));
      dispatch(setToChain(receipt.to));

      routeContext.setRoute(sdkRoute);
      routeContext.setReceipt(receipt);
    } else {
      console.error('Failed to parse receipt', receipt);
    }

    setLoading(false);
  }

  useEffect(() => {
    if (externalSearch.chain && externalSearch.txHash) {
      setState({
        chain: externalSearch.chain,
        tx: externalSearch.txHash,
        autoSearch: true,
      });
      dispatch(clearSearch());
    }
  }, [dispatch, externalSearch]);

  const doSearch = useCallback(() => search(), [state]);

  // search on load if txHash and chainName are set
  useEffect(() => {
    const { chain, tx, autoSearch } = state;
    if (autoSearch && chain !== EMPTY && tx !== EMPTY && !loading) {
      setState((prev) => ({ ...prev, autoSearch: false }));
      doSearch();
    }
  }, [doSearch, state, loading]);

  const sortedChains = useMemo(() => {
    return [...config.chainsArr].sort((a, b) => {
      if (a.displayName < b.displayName) {
        return -1;
      }
      if (a.displayName > b.displayName) {
        return 1;
      }
      return 0;
    });
  }, [config.chainsArr]);

  return (
    <Box
      sx={(theme) => ({
        maxWidth: '650px',
      })}
    >
      <FormContent>
        <Box display="flex" alignItems="center">
          <BackButton route="history" />
          <Header
            align="left"
            text={'Resume transaction'}
            size={24}
            weight={600}
          />
        </Box>
        <Typography variant="subtitle2">
          Bridging can require a manual redemption process on the designation
          chain. If you did not complete the redemption during your initial
          transaction, you may do so here.
        </Typography>

        <Box
          sx={(theme) => ({
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          })}
        >
          <Select
            fullWidth
            value={state.chain}
            displayEmpty
            onChange={(e) => setChain(e)}
          >
            <MenuItem disabled value="" key={0}>
              <em>Select Network</em>
            </MenuItem>
            {sortedChains.map((chain) => {
              return (
                <MenuItem value={chain.sdkName} key={chain.sdkName}>
                  <Box
                    sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <ChainIconComponent icon={chain.sdkName} height={24} />
                    {chain.displayName}
                  </Box>
                </MenuItem>
              );
            })}
          </Select>
          <Search
            placeholder="Source chain transaction hash"
            onChange={setTx}
            onSearch={search}
            value={state.tx}
          />
        </Box>

        <AlertBanner show={!!error} content={error} error margin="0 0 0 0" />

        <Button
          disabled={!state.chain || !state.tx}
          variant="primary"
          onClick={search}
        >
          <Typography
            display="flex"
            alignItems="center"
            gap={1}
            textTransform="none"
          >
            {loading ? (
              <CircularProgress color="inherit" size={16} thickness={4} />
            ) : null}
            Search
          </Typography>
        </Button>
      </FormContent>
      {config.ui.showFooter && <FooterNavBar />}
    </Box>
  );
}

export default TxSearch;
