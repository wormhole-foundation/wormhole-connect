import React from 'react';
import { makeStyles } from 'tss-react/mui';
import Tooltip from '@mui/material/Tooltip';
import Switch from 'components/Switch';
import InfoIcon from 'icons/Info';

const useStyles = makeStyles()((theme: any) => ({
  flex: {
    display: 'flex',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  icon: {
    height: '14px',
    cursor: 'pointer',
  },
}));

function SwitchToManualClaim({
  checked,
  onChange,
  disabled,
  title,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled: boolean;
  title: string;
}) {
  const { classes } = useStyles();
  return (
    <div className={classes.flex}>
      {!checked && <span>Waiting for relayer. . .</span>}
      <div className={classes.flex}>
        <span>Switch to manual claim</span>
        <Tooltip title={title} arrow>
          <InfoIcon className={classes.icon} />
        </Tooltip>
        <Switch
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

export default SwitchToManualClaim;
