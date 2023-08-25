import { styled } from '@mui/material';
import MuiSwitch from '@mui/material/Switch';

// Based on an example from material ui docs
// https://github.com/mui/material-ui/blob/05127cf65b4250f836897428cd15829669ab8d6c/docs/data/material/components/switches/CustomizedSwitches.tsx#L140
const Switch = styled(MuiSwitch)(({ theme }: any) => ({
  width: 40,
  height: 20,
  padding: 0,
  '& .MuiSwitch-switchBase': {
    padding: 2,
    '&.Mui-checked': {
      color: '#fff',
      '& + .MuiSwitch-track': {
        opacity: 1,
        backgroundColor: theme.palette.success[400],
      },
    },
  },
  '& .MuiSwitch-thumb': {
    boxShadow: '0px 0px 3px rgba(0, 0, 0, 0.75)',
    width: 16,
    height: 16,
  },
  '& .MuiSwitch-track': {
    borderRadius: 10,
    opacity: 1,
    backgroundColor: theme.palette.button.primary,
    boxSizing: 'border-box',
  },
}));

export default Switch;
