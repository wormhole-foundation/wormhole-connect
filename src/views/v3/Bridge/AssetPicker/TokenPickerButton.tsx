import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import { useConfig } from 'contexts/ConfigContext';
import type { ChainConfig } from 'config/types';
import type { Token } from 'config/tokens';
import AssetBadge from 'components/AssetBadge';
import TokenPickerButtonContent from './TokenPickerButtonContent';
import { getTokenDisplaySymbolByTokenAddress } from 'utils';
import React from 'react';
import type { bindTrigger } from 'material-ui-popup-state/hooks';

interface TokenPickerButtonProps {
  chainConfig: ChainConfig | undefined;
  dataTestId?: string;
  isSource: boolean;
  isTransactionInProgress: boolean;
  openDrawer: () => void;
  token: Token | undefined;
  triggerProps: ReturnType<typeof bindTrigger>;
}

function TokenPickerButton({
  chainConfig,
  dataTestId,
  isSource,
  isTransactionInProgress,
  openDrawer,
  token,
  triggerProps,
}: TokenPickerButtonProps) {
  const config = useConfig();
  const isEnabled = isSource
    ? !config.ui.disableSourceTokenPicker
    : !config.ui.disableDestinationTokenPicker;

  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('sm'));
  const symbol = token ? getTokenDisplaySymbolByTokenAddress(token) : '';
  const label = isSource ? 'Select source asset' : 'Select destination asset';
  const isInteractable = isEnabled && !isTransactionInProgress;
  const eventHandlers = mobile ? { onClick: openDrawer } : triggerProps;
  const triggers = isInteractable ? eventHandlers : undefined;
  const role = isInteractable ? 'button' : undefined;
  const ariaLabel = isInteractable ? label : undefined;

  const styles = React.useMemo(
    () => ({
      selector: {
        cursor: isInteractable ? 'pointer' : 'default',
        borderRadius: '48px',
        border: `1px solid ${theme.palette.input.border}`,
        background: theme.palette.input.background,
        minWidth: '120px',
        height: '48px',
        '&:hover': {
          borderColor: isInteractable
            ? theme.palette.primary.main
            : theme.palette.input.border,
        },
      },
      disabled: {
        opacity: '0.6',
        cursor: 'default',
        pointerEvents: 'none',
      },
      cardContent: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: '8px',
        paddingRight: '12px',
        paddingTop: '6px',
        paddingBottom: '6px',
        ':last-child': {
          paddingLeft: '8px',
          paddingRight: '12px',
          paddingTop: '6px',
          paddingBottom: '6px',
        },
      },
      chainSelector: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      },
    }),
    [theme, isInteractable],
  );

  return (
    <Card
      sx={[styles.selector, !isInteractable && styles.disabled]}
      data-testid={dataTestId}
      role={role}
      aria-label={ariaLabel}
      variant="elevation"
      {...triggers}
    >
      <CardContent sx={styles.cardContent}>
        <Typography sx={styles.chainSelector} component="div" gap={1}>
          <AssetBadge chainConfig={chainConfig} token={token} />
          <TokenPickerButtonContent
            symbol={symbol}
            isSelectable={isInteractable}
          />
        </Typography>
      </CardContent>
    </Card>
  );
}

export default React.memo(TokenPickerButton);
