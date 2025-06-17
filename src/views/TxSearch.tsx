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
  useTheme,
  Box,
} from '@mui/material';

import config, { getWormholeContextV2 } from 'config';
import { isValidTxId } from 'utils';
import {
  setRoute as setRedeemRoute,
  setIsResumeTx,
  setTxDetails,
} from 'store/redeem';
import { setRoute as setAppRoute } from 'store/router';
import PageHeader from 'components/PageHeader';
import Search from 'components/Search';
import Button from 'components/Button';
import Spacer from 'components/Spacer';
import AlertBanner from 'components/AlertBanner';
import { setToChain } from 'store/transferInput';
import FooterNavBar from 'components/FooterNavBar';
import { RouteContext } from 'contexts/RouteContext';

import { parseReceipt } from 'utils/sdkv2';
import {
  TransferState,
  AttestedTransferReceipt,
  Chain,
} from '@wormhole-foundation/sdk';
import ChainIconComponent from 'icons/ChainIcons';
import { RootState } from 'store';
import { clearSearch } from 'store/search';

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

  const theme = useTheme();

  const routeContext = useContext(RouteContext);

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
      <PageHeader
        title="Resume transaction"
        description="Bridging can require a manual redemption process on the designation chain. If you did not complete the redemption during your initial transaction, you may do so here."
        back
      />

      <Box
        sx={(theme) => ({
          display: 'flex',
          flexDirection: 'row',
          gap: '16px',
          [theme.breakpoints.down('sm')]: {
            flexDirection: 'column',
          },
        })}
      >
        <Box
          sx={(theme) => ({
            width: '175px',
            [theme.breakpoints.down('sm')]: {
              width: '100%',
            },
          })}
        >
          <Select
            sx={{ width: '100%', height: '100%', minHeight: '64.5px' }}
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
        </Box>
        <Box
          sx={{
            flexGrow: 1,
          }}
        >
          <Search
            placeholder="Source chain transaction hash"
            onChange={setTx}
            onSearch={search}
            value={state.tx}
          />
        </Box>
      </Box>

      <Spacer />

      <AlertBanner show={!!error} content={error} error margin="0 0 16px 0" />

      <Button disabled={!state.chain || !state.tx} elevated onClick={search}>
        {loading ? (
          <CircularProgress
            size={24}
            sx={{
              color: theme.palette.primary.contrastText,
            }}
          />
        ) : (
          'Search'
        )}
      </Button>
      <Box
        sx={{
          width: '100%',
          maxWidth: '700px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginTop: '20px',
        }}
      >
        <FooterNavBar />
      </Box>
    </Box>
  );
}

export default TxSearch;
