import React, { useMemo } from 'react';
import { Box } from '@mui/material';
import { CENTER } from 'utils/style';

type Props = {
  name?: string;
  icon?: string;
  size?: number;
};

function WalletIcon(props: Props) {
  const size = props.size || 32;

  const { icon, name } = props;

  const styles = useMemo(
    () => ({
      container: {
        height: size,
        width: size,
        ...CENTER,
      },
      icon: {
        maxHeight: '100%',
        maxWidth: '100%',
      },
    }),
    [size],
  );

  return (
    <Box sx={styles.container}>
      {icon && <img style={styles.icon} src={icon} alt={name} />}
    </Box>
  );
}

export default WalletIcon;
