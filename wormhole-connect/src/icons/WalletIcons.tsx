import React from 'react';
import { makeStyles } from 'tss-react/mui';
import { CENTER } from 'utils/style';

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
  name?: string;
  icon?: string;
  height?: number;
};

function WalletIcon(props: Props) {
  const size = props.height || 32;
  const { classes } = useStyles({ size });

  const { icon, name } = props;

  return (
    <div className={classes.container}>
      {icon && <img className={classes.icon} src={icon} alt={name} />}
    </div>
  );
}

export default WalletIcon;
