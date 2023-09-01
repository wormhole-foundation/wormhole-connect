import React from 'react';
import { makeStyles } from 'tss-react/mui';
import TokenIcon from 'icons/TokenIcons';
import { ERROR_BORDER, joinClass } from 'utils/style';
import { NetworkConfig } from 'config/types';

const useStyles = makeStyles()((theme: any) => ({
  networkTile: {
    backgroundColor: theme.palette.card.secondary,
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: '100%',
    cursor: 'pointer',
    marginRight: '8px',
    textAlign: 'center',
  },
  networkNone: {
    justifyContent: 'center',
    gap: '16px',
  },
  networkIcon: {
    width: '56px',
    height: '56px',
  },
  networkHeader: {
    fontSize: '16px',
    opacity: '60%',
  },
  networkName: {
    fontSize: '16px',
  },
  error: ERROR_BORDER(theme),
}));

type Props = {
  network?: NetworkConfig;
  onClick: React.MouseEventHandler<HTMLDivElement>;
  error?: boolean;
  disabled?: boolean;
};

function NetworkTile(props: Props) {
  const { disabled = false } = props;
  const { classes } = useStyles();

  const onClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (disabled) return;
    props.onClick(e);
  };

  return props.network ? (
    <div
      className={joinClass([
        classes.networkTile,
        !!props.error && classes.error,
      ])}
      onClick={onClick}
    >
      <div className={classes.networkHeader}>Network</div>
      <TokenIcon name={props.network.icon} height={56} />
      <div className={classes.networkName}>{props.network.displayName}</div>
    </div>
  ) : (
    <div
      className={joinClass([
        classes.networkTile,
        classes.networkNone,
        !!props.error && classes.error,
      ])}
      onClick={onClick}
    >
      <TokenIcon height={56} />
      <div className={classes.networkName}>Select network</div>
    </div>
  );
}

export default NetworkTile;
