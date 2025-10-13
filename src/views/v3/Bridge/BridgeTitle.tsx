import React, { useMemo } from 'react';
import { useTheme, useMediaQuery } from '@mui/material';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import Header from 'components/Header';
import ConfigurablePageHeader from 'components/ConfigurablePageHeader';
import HistoryIcon from 'icons/History';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import TxHistoryWidget from 'views/v3/TxHistory/Widget';
import config from 'config';
import { OPACITY } from 'utils/style';
import BridgeIcon from 'icons/Bridge';

interface BridgeTitleProps {
  showHistory: boolean;
  isTransactionInProgress: boolean;
  isWalletConnected: boolean;
  onToggleHistory: () => void;
}

const BridgeTitle: React.FC<BridgeTitleProps> = ({
  showHistory,
  isTransactionInProgress,
  isWalletConnected,
  onToggleHistory,
}) => {
  const theme: any = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('sm'));

  const styles = useMemo(
    () => ({
      titleContent: {
        maxWidth: mobile ? '420px' : '452px',
      },
      bridgeHeader: {
        width: '100%',
        minHeight: '28px',
        display: 'flex',
        alignItems: 'center',
      },
    }),
    [mobile],
  );

  const isTxHistoryDisabled = !isWalletConnected || isTransactionInProgress;

  const iconTooltip =
    (!isWalletConnected && 'No connected wallets found') ||
    (showHistory ? 'Show bridge' : 'Show history');

  return (
    <Box sx={styles.titleContent}>
      <ConfigurablePageHeader />
      {config.ui.showInProgressWidget && (
        <TxHistoryWidget disabled={isTransactionInProgress} />
      )}
      <Box sx={styles.bridgeHeader}>
        <BridgeIcon style={{ marginRight: '4px' }} />
        <Header
          align="left"
          text={config.ui.title ?? 'Bridge'}
          size={24}
          weight={600}
        />
        <Tooltip title={iconTooltip}>
          <span>
            <IconButton
              data-testid="history-button"
              aria-label={showHistory ? 'Show bridge' : 'Show history'}
              sx={{
                backgroundColor: theme.palette.background.form + OPACITY[20],
                padding: '12px',
                width: '40px',
                height: '40px',
                border: `1px solid ${theme.palette.input.border}`,
                borderRadius: '40px',
              }}
              disabled={isTxHistoryDisabled}
              onClick={onToggleHistory}
            >
              {showHistory ? (
                <SwapHorizIcon sx={{ fontSize: '16px' }} />
              ) : (
                <HistoryIcon sx={{ fontSize: '16px' }} />
              )}
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default React.memo(BridgeTitle);
