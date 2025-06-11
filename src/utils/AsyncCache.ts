interface CacheEntry<T> {
  value: T;
  timestamp: number;
  isError?: boolean;
}

export class AsyncCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private pendingRequests = new Map<string, Promise<T>>();

  constructor(private TTLms: number) {}

  // TODO: Make TTL configurable per request
  async requestWithCache(
    cacheKey: string,
    fetchFn: () => Promise<T>,
  ): Promise<T> {
    const now = Date.now();
    const cached = this.cache.get(cacheKey);

    if (cached && now - cached.timestamp < this.TTLms) {
      console.debug('[Cache Debug] Cache HIT - using cached value');
      if (cached.isError) {
        throw cached.value;
      }
      return cached.value;
    }

    let pendingRequest = this.pendingRequests.get(cacheKey);
    if (!pendingRequest) {
      console.debug('[Cache Debug] Cache MISS - initiating new request');
      pendingRequest = fetchFn()
        .then((result) => {
          this.cache.set(cacheKey, {
            value: result,
            timestamp: Date.now(),
            isError: false,
          });
          this.pendingRequests.delete(cacheKey);
          return result;
        })
        .catch((error) => {
          console.debug('[Cache Debug] Cache ERROR - storing error');
          this.cache.set(cacheKey, {
            value: error,
            timestamp: Date.now(),
            isError: true,
          });
          this.pendingRequests.delete(cacheKey);
          throw error;
        });
      this.pendingRequests.set(cacheKey, pendingRequest);
    } else {
      console.debug('[Cache Debug] Cache MISS - using pending request');
    }

    return pendingRequest;
  }
}
