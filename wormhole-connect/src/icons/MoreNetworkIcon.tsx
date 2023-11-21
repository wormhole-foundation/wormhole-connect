import React from 'react';
import { makeStyles } from 'tss-react/mui';
import { CENTER } from 'utils/style';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Tooltip from '@mui/material/Tooltip';

const useStyles = makeStyles<{ size: number }>()((theme: any, { size }) => ({
  container: {
    position: 'relative',
    height: size,
    width: size,
    ...CENTER,
  },
  icon: {
    maxHeight: '100%',
    maxWidth: '100%',
  },
  subIcon: {
    position: 'absolute',
    bottom: `calc(${size}px - ${theme.spacing(1)})`,
    left: `calc(${size}px - ${theme.spacing(1)})`,
    width: theme.spacing(2),
    height: theme.spacing(2),
  },
  tooltip: {
    maxWidth: '270px',
    maxHeight: '104px',
    borderRadius: '4px',
    padding: '16px',
    gap: '10px',
    backgroundColor: theme.palette.card.background,
  },
}));

type Props = {
  icon: string;
  alt?: string;
  height?: number;
  showOpenInNewIcon?: boolean;
  description?: string;
};

function MoreNetworkIcon({
  height,
  alt,
  icon,
  showOpenInNewIcon = true,
  description,
}: Props) {
  const size = height || 32;
  const { classes } = useStyles({ size });
  return (
    <div className={classes.container}>
      <img
        style={{ maxHeight: '100%', maxWidth: '100%' }}
        alt={alt}
        src={icon}
      />
      {showOpenInNewIcon &&
        (description ? (
          <Tooltip
            arrow
            placement="top-end"
            title={description}
            classes={{
              tooltip: classes.tooltip,
              tooltipArrow: classes.tooltip,
            }}
          >
            <OpenInNewIcon className={classes.subIcon} />
          </Tooltip>
        ) : (
          <OpenInNewIcon className={classes.subIcon} />
        ))}
    </div>
  );
}

export default MoreNetworkIcon;
