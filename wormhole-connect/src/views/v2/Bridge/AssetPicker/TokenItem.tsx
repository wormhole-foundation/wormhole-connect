import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import CircularProgress from '@mui/material/CircularProgress';
import React, { memo } from 'react';
import { makeStyles } from 'tss-react/mui';
import TokenIcon from 'icons/TokenIcons';
import Typography from '@mui/material/Typography';
import { TokenConfig } from 'config/types';
import config from 'config';
import { useTheme } from '@mui/material';

const useStyles = makeStyles()(() => ({
  tokenListItem: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingLeft: 8,
    borderRadius: 8,
  },
  tokenDetails: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
}));

type TokenItemProps = {
  token: TokenConfig;
  disabled?: boolean;
  onClick: () => void;
  balance?: string;
  isFetchingBalance?: boolean;
};

function TokenItem(props: TokenItemProps) {
  const { classes } = useStyles();
  const theme = useTheme();

  const nativeChainConfig = config.chains[props.token.nativeChain];
  const nativeChain = nativeChainConfig?.displayName || '';

  return (
    <ListItemButton
      className={classes.tokenListItem}
      dense
      disabled={props.disabled}
      onClick={props.onClick}
    >
      <div className={classes.tokenDetails}>
        <ListItemIcon>
          <TokenIcon icon={props.token.icon} height={32} />
        </ListItemIcon>
        <div>
          <Typography fontSize={16}>{props.token.symbol}</Typography>
          <Typography fontSize={10} color={theme.palette.text.secondary}>
            {nativeChain}
          </Typography>
        </div>
      </div>
      <Typography fontSize={14}>
        {props.isFetchingBalance ? (
          <CircularProgress size={24} />
        ) : (
          props.balance
        )}
      </Typography>
    </ListItemButton>
  );
}

export default memo(TokenItem);
