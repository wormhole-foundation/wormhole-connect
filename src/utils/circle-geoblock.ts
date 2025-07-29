export const checkCircleGeoblock = async (): Promise<boolean> => {
  try {
    const response = await fetch('https://api.circle.com/ping');

    // If the user is geoblocked, Circle returns a 403 or specific error
    if (!response.ok && (response.status === 403 || response.status === 451)) {
      return true;
    }

    return false;
  } catch (error) {
    // In case of network errors, we should allow the transaction to proceed to avoid blocking legitimate users with connectivity issues
    console.warn('Failed to check Circle geoblocking status:', error);
    return false;
  }
};

export const CIRCLE_GEOBLOCK_ERROR_MESSAGE =
  'You are attempting a transfer from a location that is restricted by Circle.';
