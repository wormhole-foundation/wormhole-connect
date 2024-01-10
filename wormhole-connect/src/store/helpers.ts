export type DataWrapper<T> = {
  data: T | null;
  error: any | null;
};

export function getEmptyDataWrapper() {
  return {
    data: null,
    error: null,
  };
}

export function receiveDataWrapper<T>(data: T): DataWrapper<T> {
  return {
    data,
    error: null,
  };
}

export function errorDataWrapper<T>(error: string): DataWrapper<T> {
  return {
    data: null,
    error,
  };
}

export function fetchDataWrapper() {
  return {
    data: null,
    error: null,
  };
}
