import React from 'react';
import Stack from '@mui/material/Stack';
import { routes } from '@wormhole-foundation/sdk';

import SingleRoute from './SingleRoute';

type Props = {
  routesWithQuotes: string[];
  highlightedRoute?: string;
  quotes: Record<string, routes.QuoteResult<routes.Options> | undefined>;
  fastestRoute: { name: string; eta: number };
  cheapestRoute: { name: string; amountOut: bigint };
  isLoading?: boolean;
  onRouteSelect: (route: string) => void;
  onGasChange: (value: number) => void;
};

const RoutesList = ({
  routesWithQuotes,
  highlightedRoute,
  quotes,
  fastestRoute,
  cheapestRoute,
  isLoading,
  onRouteSelect,
  onGasChange,
}: Props) => {
  return (
    <Stack sx={{ gap: '16px', overflowY: 'auto', maxHeight: '75vh' }}>
      {routesWithQuotes.map((name) => {
        const isSelected = name === highlightedRoute;
        const quoteResult = quotes[name];
        const quote = quoteResult?.success ? quoteResult : undefined;
        const quoteError =
          quoteResult?.success === false
            ? quoteResult?.error?.message ??
              `Error while getting a quote for ${name}.`
            : undefined;
        return (
          <SingleRoute
            key={name}
            route={name}
            error={quoteError}
            isSelected={isSelected && !quoteError}
            isFastest={name === fastestRoute.name}
            isCheapest={name === cheapestRoute.name}
            isOnlyChoice={routesWithQuotes.length === 1}
            onSelect={onRouteSelect}
            onGasChange={onGasChange}
            quote={quote}
            isLoading={isLoading}
          />
        );
      })}
    </Stack>
  );
};

export default React.memo(RoutesList);
