import React, { useCallback } from 'react';
import { Network, routes } from '@wormhole-foundation/sdk';

interface RouteContextType {
  route: routes.Route<Network> | null;
  receipt: routes.Receipt | null;
  setRoute: (route: routes.Route<Network>) => void;
  setReceipt: (receipt: routes.Receipt) => void;
  clear: () => void;
}

export const RouteContext = React.createContext<RouteContextType>({
  route: null,
  receipt: null,
  setRoute: () => {
    // Keep the empty function for initial context value
  },
  setReceipt: () => {
    // Keep the empty function for initial context value
  },
  clear: () => {
    // Keep the empty function for initial context value
  },
});

export const RouteProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [route, setRoute] = React.useState<routes.Route<Network> | null>(null);
  const [receipt, setReceipt] = React.useState<routes.Receipt | null>(null);

  const clear = useCallback(() => {
    setRoute(null);
    setReceipt(null);
  }, []);

  return (
    <RouteContext.Provider
      value={{ route, receipt, setRoute, setReceipt, clear }}
    >
      {children}
    </RouteContext.Provider>
  );
};
