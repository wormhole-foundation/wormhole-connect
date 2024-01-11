export type DataWrapper<T> = {
  data: T | null;
  error: any | null;
  isFetching: boolean;
};

export function getEmptyDataWrapper() {
  return {
    data: null,
    error: null,
    isFetching: false,
  };
}

export function receiveDataWrapper<T>(data: T): DataWrapper<T> {
  return {
    data,
    error: null,
    isFetching: false,
  };
}

export function errorDataWrapper<T>(error: string): DataWrapper<T> {
  return {
    data: null,
    error,
    isFetching: false,
  };
}

export function fetchDataWrapper() {
  return {
    data: null,
    error: null,
    isFetching: true,
  };
}
