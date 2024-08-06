import React, { useState } from 'react';
import { ContentPaste } from '@mui/icons-material';
import {
  FormGroup,
  Box,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
  IconButton,
  Button,
} from '@mui/material';
import QRScanner from './QRScanner';

interface ManualAddressInputProps {
  handleManualConnect: (address: string) => void;
}

export const ManualAddressInput = (props: ManualAddressInputProps) => {
  const [address, setAddress] = useState('');

  const handlePaste = async () =>
    setAddress(await navigator.clipboard.readText());

  const handleSetAddress = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(event.target.value);
  };

  const handleManualConnect = () => {
    let formattedAddress = address;
    // This regex is used to check if the address is in the format of chainName:0x...
    // example: bnb:0x8C...7aa
    const regex = /(.*):0x/;
    if (regex.test(formattedAddress)) {
      formattedAddress = formattedAddress.replace(regex, '0x');
    }
    props.handleManualConnect(formattedAddress);
  };

  return (
    <FormGroup>
      <Box display="flex" flexDirection="column" gap={1}>
        <FormControl variant="outlined">
          <InputLabel htmlFor="outlined-adornment-password">
            Wallet Address
          </InputLabel>
          <OutlinedInput
            id="outlined-adornment-password"
            fullWidth
            placeholder="0x..."
            onChange={handleSetAddress}
            value={address}
            endAdornment={
              <InputAdornment position="end">
                <QRScanner onScan={setAddress} />
                <IconButton>
                  <ContentPaste onClick={handlePaste} />
                </IconButton>
              </InputAdornment>
            }
            label="Wallet Address"
          />
        </FormControl>
        <Button
          color="primary"
          variant="contained"
          disabled={!address}
          onClick={handleManualConnect}
        >
          CONNECT
        </Button>
      </Box>
    </FormGroup>
  );
};
