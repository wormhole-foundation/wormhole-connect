import React from 'react';
import { makeStyles } from 'tss-react/mui';
import TokenIcon from 'icons/TokenIcons';
import { ERROR_BORDER, joinClass } from 'utils/style';
import { ChainConfig } from 'config/types';

const useStyles = makeStyles()((theme: any) => ({
  chainTile: {
    backgroundColor: theme.palette.card.secondary,
    borderRadius: '8px',
    padding: theme.spacing(1.5),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    cursor: 'pointer',
    textAlign: 'center',
    gap: theme.spacing(1.5),
  },
  chainIcon: {
    width: '56px',
    height: '56px',
  },
  chainHeader: {
    fontSize: '16px',
    opacity: '60%',
  },
  chainName: {
    fontSize: '16px',
  },
  error: ERROR_BORDER(theme),
}));

type Props = {
  chain?: ChainConfig;
  onClick: React.MouseEventHandler<HTMLDivElement>;
  error?: boolean;
  disabled?: boolean;
};

function ChainTile(props: Props) {
  const { disabled = false } = props;
  const { classes } = useStyles();

  const onClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (disabled) return;
    props.onClick(e);
  };

  return (
    <div
      className={joinClass([classes.chainTile, !!props.error && classes.error])}
      onClick={onClick}
    >
      {props.chain ? <div className={classes.chainHeader}>Network</div> : null}
      <TokenIcon icon={props.chain?.icon} height={56} />
      <div className={classes.chainName}>
        {props.chain?.displayName || 'Select network'}
      </div>
    </div>
  );
}

export default ChainTile;
