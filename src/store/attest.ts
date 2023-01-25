import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const LAST_STEP = 3;

type Steps = 0 | 1 | 2 | 3;

export interface AttestState {
  activeStep: Steps;
}

const initialState: AttestState = {
  activeStep: 0,
};

export const attestSlice = createSlice({
  name: 'attest',
  initialState,
  reducers: {
    incrementStep: (state: AttestState) => {
      if (state.activeStep < LAST_STEP) state.activeStep++;
    },
    decrementStep: (state: AttestState) => {
      if (state.activeStep > 0) state.activeStep--;
    },
    setStep: (state: AttestState, action: PayloadAction<Steps>) => {
      state.activeStep = action.payload;
    },
  },
});

export const { incrementStep, decrementStep, setStep } = attestSlice.actions;

export default attestSlice.reducer;
