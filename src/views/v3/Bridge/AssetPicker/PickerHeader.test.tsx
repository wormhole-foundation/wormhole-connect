import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';

import PickerHeader from './PickerHeader';
import { dark } from 'theme';

const theme = createTheme({
  palette: dark as any,
});

const defaultProps = {
  onClose: vi.fn(),
  showSearch: false,
  onBack: vi.fn(),
};

const AppWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

describe('PickerHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with title and close button', () => {
    render(<PickerHeader {...defaultProps} />, { wrapper: AppWrapper });

    expect(screen.getByText('Select token')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    expect(screen.getByLabelText('Close routes')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<PickerHeader {...defaultProps} />, { wrapper: AppWrapper });

    const closeButton = screen.getByLabelText('Close routes');
    fireEvent.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('shows back button when showSearch is true', () => {
    const props = { ...defaultProps, showSearch: true };
    render(<PickerHeader {...props} />, { wrapper: AppWrapper });

    expect(screen.getByLabelText('Go back')).toBeInTheDocument();
    expect(screen.getByTestId('back-button')).toBeInTheDocument();
  });

  it('does not show back button when showSearch is false', () => {
    render(<PickerHeader {...defaultProps} />, { wrapper: AppWrapper });

    expect(screen.queryByLabelText('Go back')).not.toBeInTheDocument();
    expect(screen.queryByTestId('back-button')).not.toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    const props = { ...defaultProps, showSearch: true };
    render(<PickerHeader {...props} />, { wrapper: AppWrapper });

    const backButton = screen.getByLabelText('Go back');
    fireEvent.click(backButton);

    expect(defaultProps.onBack).toHaveBeenCalledTimes(1);
  });

  it('does not show back button when onBack is not provided', () => {
    const props = { ...defaultProps, showSearch: true, onBack: undefined };
    render(<PickerHeader {...props} />, { wrapper: AppWrapper });

    expect(screen.queryByLabelText('Go back')).not.toBeInTheDocument();
  });
});
