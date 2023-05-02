import React from 'react';
import { makeStyles } from 'tss-react/mui';
import { CENTER } from '../utils/style';
import { Wallet } from '@xlabs-libs/wallet-aggregator-core';

const useStyles = makeStyles<{ size: number }>()((theme, { size }) => ({
  container: {
    height: size,
    width: size,
    ...CENTER,
  },
  icon: {
    maxHeight: '100%',
    maxWidth: '100%',
  },
}));

type Props = {
  wallet?: Wallet;
  height?: number;
};

function WalletIcon(props: Props) {
  const size = props.height || 32;
  const { classes } = useStyles({ size });

  const { wallet } = props;

  return (
    <div className={classes.container}>
      {wallet && <img className={classes.icon} src={wallet.getIcon()} alt={wallet.getName()} />}
    </div>
  );
}

export default WalletIcon;
