export const isNttRoute = (route?: string) => {
  // TODO SDKV2 REMOVE NEED FOR THIS PLEASE
  return route === 'AutomaticNtt' || route === 'ManualNtt';
};
