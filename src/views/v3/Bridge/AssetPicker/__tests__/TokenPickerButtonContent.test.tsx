import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';

import TokenPickerButtonContent from '../TokenPickerButtonContent';
import { dark } from 'theme';

const theme = createTheme({
  palette: dark,
});

const AppWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

describe('TokenPickerButtonContent', () => {
  it('renders symbol when provided', () => {
    render(<TokenPickerButtonContent symbol="USDC" isSelectable={true} />, {
      wrapper: AppWrapper,
    });

    expect(screen.getByText('USDC')).toBeInTheDocument();
  });

  it('renders "Select" when symbol is empty', () => {
    render(<TokenPickerButtonContent symbol="" isSelectable={true} />, {
      wrapper: AppWrapper,
    });

    expect(screen.getByText('Select')).toBeInTheDocument();
  });

  it('shows tooltip when selectable', () => {
    render(<TokenPickerButtonContent symbol="USDC" isSelectable={true} />, {
      wrapper: AppWrapper,
    });

    const typography = screen.getByText('USDC');
    expect(typography).toBeInTheDocument();
    // Tooltip is present in DOM even if not visible
    expect(typography.parentElement?.getAttribute('aria-label')).toBeNull();
  });

  it('does not show tooltip when not selectable', () => {
    render(<TokenPickerButtonContent symbol="USDC" isSelectable={false} />, {
      wrapper: AppWrapper,
    });

    const typography = screen.getByText('USDC');
    expect(typography).toBeInTheDocument();
    // When not selectable, content is directly rendered without Tooltip wrapper
    expect(typography.closest('[role="tooltip"]')).toBeNull();
  });

  it('shows "Select a token" in tooltip when no symbol provided', () => {
    render(<TokenPickerButtonContent symbol="" isSelectable={true} />, {
      wrapper: AppWrapper,
    });

    expect(screen.getByText('Select')).toBeInTheDocument();
  });

  it('applies correct typography styles', () => {
    render(<TokenPickerButtonContent symbol="USDC" isSelectable={true} />, {
      wrapper: AppWrapper,
    });

    const typography = screen.getByText('USDC');
    expect(typography).toHaveStyle({ fontSize: '16px', fontWeight: 500 });
  });
});
