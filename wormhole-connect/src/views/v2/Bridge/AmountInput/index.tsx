import React from 'react';
import { useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { setAmount } from 'store/transferInput';

const useStyles = makeStyles()((theme) => ({
  amountContainer: {
    width: '100%',
    maxWidth: '420px',
  },
  amountCardContent: {
    display: 'flex',
    alignItems: 'center',
  },
  amountTitle: {
    color: theme.palette.text.secondary,
    display: 'flex',
    minHeight: '40px',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
}));

/**
 * Renders the input control to set the transaction amount
 */
const AmountInput = () => {
  const { classes } = useStyles();
  const dispatch = useDispatch();

  return (
    <div className={classes.amountContainer}>
      <div className={classes.amountTitle}>
        <Typography variant="body2">Amount:</Typography>
      </div>
      <Card variant="elevation">
        <CardContent className={classes.amountCardContent}>
          <TextField
            fullWidth
            inputProps={{
              style: {
                fontSize: 24,
                height: '40px',
                padding: '4px',
              },
            }}
            placeholder="0"
            variant="standard"
            onChange={(e) => dispatch(setAmount(e.target.value))}
            InputProps={{
              disableUnderline: true,
              endAdornment: (
                <InputAdornment position="end">
                  <div>
                    <Button sx={{ padding: 0 }} size="small" variant="outlined">
                      <Typography fontSize={14} textTransform="none">
                        Max
                      </Typography>
                    </Button>
                    <Typography fontSize={14} textAlign="right">
                      Balance:{' '}
                    </Typography>
                  </div>
                </InputAdornment>
              ),
              type: 'number',
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AmountInput;
