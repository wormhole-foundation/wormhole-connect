import React, { useCallback, useContext, useEffect, useState } from 'react';
import { makeStyles } from 'tss-react/mui';
import { useDispatch } from 'react-redux';
import { Select, MenuItem, CircularProgress } from '@mui/material';
import type { ChainName } from 'sdklegacy';

import config, { getWormholeContextV2 } from 'config';
import { isValidTxId } from 'utils';
import RouteOperator from 'routes/operator';
import { setRoute as setRedeemRoute, setIsResumeTx } from 'store/redeem';
import { setRoute as setAppRoute } from 'store/router';
import PageHeader from 'components/PageHeader';
import Search from 'components/Search';
import Button from 'components/Button';
import Spacer from 'components/Spacer';
import AlertBanner from 'components/AlertBanner';
import { setToChain } from 'store/transferInput';
import FooterNavBar from 'components/FooterNavBar';
import { useExternalSearch } from 'hooks/useExternalSearch';
import { getRoute } from 'routes/mappings';
import { RouteContext } from 'contexts/RouteContext';

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
  footerNavBar: {
    width: '100%',
    maxWidth: '700px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: '20px',
  },
}));

const EMPTY = '';

function TxSearch() {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const [state, setState] = useState({
    chain: EMPTY,
    tx: EMPTY,
    autoSearch: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    if (!isValidTxId(state.chain, state.tx)) {
      return setError('Invalid transaction ID');
    }
    try {
      setLoading(true);
      const { route, receipt } = await RouteOperator.getRouteFromTx(
        state.tx,
        config.sdkConverter.toChainV2(state.chain as ChainName),
      );
      const wh = await getWormholeContextV2();
      const sdkRoute = new (getRoute(route).rc)(wh);
      setError('');
      // TODO: these details are a placeholder
      // dispatch(setTxDetails(message));
      //dispatch(
      //  setTxDetails({
      //    sendTx: txId,
      //    sender: sending.address,
      //    amount,
      //    payloadID: sdkRoute.IS_AUTOMATIC ? 1 : 3, // TODO: don't need this
      //    recipient: receiving.address,
      //    toChain: config.sdkConverter.toChainNameV1(receipt.to),
      //    fromChain: config.sdkConverter.toChainNameV1(receipt.from),
      //    tokenAddress: getWrappedToken(sendToken).tokenId!.address,
      //    tokenChain: config.sdkConverter.toChainNameV1(receipt.from),
      //    tokenId: getWrappedTokenId(sendToken),
      //    tokenKey: sendToken.key,
      //    tokenDecimals: getTokenDecimals(
      //      config.wh.toChainId(fromChain!),
      //      getWrappedTokenId(sendToken),
      //    ),
      //    receivedTokenKey: config.tokens[destToken].key!, // TODO: wrong
      //    emitterAddress: undefined,
      //    sequence: undefined,
      //    block: 0,
      //    gasFee: undefined,
      //    payload: undefined,
      //    inputData: undefined,
      //    relayerPayloadId: undefined,
      //    to: undefined,
      //    relayerFee: undefined,
      //    toNativeTokenAmount: undefined,
      //  }),
      //),
      dispatch(setIsResumeTx(true)); // To avoid send transfer.success event in Resume Transaction case
      dispatch(setRedeemRoute(route));
      dispatch(setAppRoute('redeem'));
      dispatch(setToChain(config.sdkConverter.toChainNameV1(receipt.to)));

      routeContext.setRoute(sdkRoute);
      routeContext.setReceipt(receipt);
    } catch (e) {
      console.error(e);
      setError(
        'Bridge transaction not found, check that you have the correct chain and transaction ID',
      );
    } finally {
      setLoading(false);
    }
  }

  const { hasExternalSearch, txHash, chainName, clear } = useExternalSearch();

  // set the txHash and chainName from configs and reset it to undefined
  useEffect(() => {
    const autoSearch = !!(hasExternalSearch && txHash && chainName);
    if (autoSearch) {
      setState({ chain: chainName, tx: txHash, autoSearch });
      clear();
    }
  }, [hasExternalSearch, txHash, chainName, clear]);

  const doSearch = useCallback(() => search(), [state]);

  // search on load if txHash and chainName are set
  useEffect(() => {
    const { chain, tx, autoSearch } = state;
    if (autoSearch && chain !== EMPTY && tx !== EMPTY && !loading) {
      setState((prev) => ({ ...prev, autoSearch: false }));
      doSearch();
    }
  }, [doSearch, state, loading]);

  return (
    <div className={classes.container}>
      <PageHeader
        title="Resume transaction"
        description="Bridging can require a manual redemption process on the designation chain. If you did not complete the redemption during your initial transaction, you may do so here."
        showHamburgerMenu={config.showHamburgerMenu}
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
            {config.chainsArr
              .filter((chain) => chain.key !== 'wormchain')
              .map((chain, i) => {
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
            value={state.tx}
          />
        </div>
      </div>

      <Spacer />

      <AlertBanner show={!!error} content={error} error margin="0 0 16px 0" />

      <Button disabled={!state.chain || !state.tx} elevated onClick={search}>
        {loading ? <CircularProgress size={24} /> : 'Search'}
      </Button>
      {config.showHamburgerMenu ? null : (
        <div className={classes.footerNavBar}>
          <FooterNavBar />
        </div>
      )}
    </div>
  );
}

export default TxSearch;
