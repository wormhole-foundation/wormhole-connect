import config from 'config';
import type { TransactionLocal } from 'config/types';
import { isEmptyObject } from 'utils';

const LOCAL_STORAGE_KEY = 'transactions:inprogress';
const LOCAL_STORAGE_MAX = 3;

// Bigint types cannot be serialized to a string
// That's why we need to provide a replacer function to handle it separately
// Please see for details: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/BigInt_not_serializable
const JSONReplacer = (_, value: any) =>
  typeof value === 'bigint' ? value.toString() : value;

// Checks the existance of the props with the given types in a parent object
const validateChildPropTypes = (
  parent: object,
  propTypes: { [key: string]: string },
) => {
  if (isEmptyObject(parent)) {
    return false;
  }

  // Iterate over each property and verify its type in the parent object
  for (const key in propTypes) {
    if (
      parent[key] === null || // Line below is an explicit check for undefined values as well
      typeof parent[key] !== propTypes[key]
    ) {
      return false;
    }
  }
  // Prop type validations passed
  return true;
};

// Validates a single local transaction
const validateSingleTransaction = (
  tx: TransactionLocal,
): tx is TransactionLocal => {
  // Check first level required properties
  if (
    !validateChildPropTypes(tx, {
      receipt: 'object',
      route: 'string',
      timestamp: 'number',
      txDetails: 'object',
      txHash: 'string',
    })
  ) {
    return false;
  }

  // Check second level required properties
  if (
    !validateChildPropTypes(tx.txDetails, {
      amount: 'object',
      eta: 'number',
      fromChain: 'string',
      toChain: 'string',
      token: 'object',
    })
  ) {
    return false;
  }

  // Check third level properties
  if (
    !validateChildPropTypes(tx.txDetails.amount, {
      amount: 'string',
      decimals: 'number',
    })
  ) {
    return false;
  }

  if (
    !validateChildPropTypes(tx.txDetails.token, {
      0: 'string',
      1: 'string',
    })
  ) {
    return false;
  }

  // All validation steps passed
  return true;
};

// Validates a given array of local transactions
const validateTransactions = (
  parsedTxs: Array<TransactionLocal>,
): parsedTxs is Array<TransactionLocal> => {
  if (!Array.isArray(parsedTxs)) {
    return false;
  }

  for (const tx of parsedTxs) {
    if (!validateSingleTransaction(tx)) {
      return false;
    }
  }

  // All transactions are valid
  return true;
};

// Retrieves all in-progress transactions from localStorage
export const getTxsFromLocalStorage = ():
  | Array<TransactionLocal>
  | undefined => {
  const ls = window.localStorage;

  // Find the in-progress transactions list in localStorage
  for (let i = 0; i < ls.length; i++) {
    const itemKey = ls.key(i);
    if (
      itemKey?.toLowerCase() ===
      config.cacheKey(LOCAL_STORAGE_KEY).toLowerCase()
    ) {
      const item = ls.getItem(itemKey);
      if (item) {
        try {
          const parsedTxs = JSON.parse(item);
          if (validateTransactions(parsedTxs)) {
            return parsedTxs;
          } else {
            console.log(
              `Error while parsing localStorage item ${LOCAL_STORAGE_KEY}: Not an array of valid transactions`,
            );
            // Remove invalid transactions entry
            ls.removeItem(config.cacheKey(LOCAL_STORAGE_KEY));
            return;
          }
        } catch (e: any) {
          // We can get a SyntaxError from JSON.parse
          // In that case we should debug log and remove the local storage entry completely,
          // as we can't know which tx within entry causes the problem without parsing it.
          console.log(
            `Error while parsing localStorage item ${LOCAL_STORAGE_KEY}: ${e}`,
          );
          // Remove item
          ls.removeItem(config.cacheKey(LOCAL_STORAGE_KEY));
          return;
        }
      }
    }
  }
};

// Adds a TransactionLocal object to localStorage
export const addTxToLocalStorage = (
  data: TransactionLocal, // Item data
) => {
  const ls = window.localStorage;
  const items = getTxsFromLocalStorage();
  let newList: Array<TransactionLocal>;

  if (!items) {
    // First item in the list
    newList = [data];
  } else if (items.length < LOCAL_STORAGE_MAX) {
    // Haven't reached to the max number of items allowed
    // Concat the new item to the end
    newList = items.concat([data]);
  } else {
    // Reached the max number of items allowed
    // Remove the first element and concat the new one to the end
    items.splice(0, 1);
    newList = items.concat([data]);
  }

  // Update the list
  try {
    ls.setItem(
      config.cacheKey(LOCAL_STORAGE_KEY),
      JSON.stringify(newList, JSONReplacer),
    );
  } catch (e: any) {
    // We can get two different errors:
    // 1- TypeError from JSON.stringify
    // 2- DOMException from localStorage.setItem
    // In each case, we should debug log and fail silently
    console.log(
      `Error while adding item to localStorage ${LOCAL_STORAGE_KEY}: ${e}`,
    );
  }
};

// Removes a transaction from localStorage
export const removeTxFromLocalStorage = (txHash: string) => {
  const ls = window.localStorage;
  const items = getTxsFromLocalStorage();

  if (items && items.length > 0) {
    // Find the item to remove
    const removeIndex = items.findIndex((tx) => tx.txHash === txHash);
    if (removeIndex > -1) {
      // remove the item and update localStorage
      items.splice(removeIndex, 1);
      try {
        ls.setItem(
          config.cacheKey(LOCAL_STORAGE_KEY),
          JSON.stringify(items, JSONReplacer),
        );
      } catch (e: any) {
        // We can get two different errors:
        // 1- TypeError from JSON.stringify
        // 2- DOMException from localStorage.setItem
        // In each case, we should debug log and fail silently
        console.log(
          `Error while removing item from localStorage ${LOCAL_STORAGE_KEY}: ${e}`,
        );
      }
    }
  }
};

// Updates a specified transaction property in localStorage
export const updateTxInLocalStorage = (
  txHash: string,
  key: string,
  value: any,
) => {
  const ls = window.localStorage;
  const items = getTxsFromLocalStorage();

  if (items && items.length > 0) {
    // Find the item to update
    const idx = items.findIndex((tx) => tx.txHash === txHash);
    if (idx > -1) {
      // Update item property and put back in local storage
      items[idx][key] = value;
      try {
        ls.setItem(
          config.cacheKey(LOCAL_STORAGE_KEY),
          JSON.stringify(items, JSONReplacer),
        );
      } catch (e: any) {
        // We can get two different errors:
        // 1- TypeError from JSON.stringify
        // 2- DOMException from localStorage.setItem
        // In each case, we should debug log and fail silently
        console.log(
          `Error while updating item in localStorage ${LOCAL_STORAGE_KEY}: ${e}`,
        );
      }
    }
  }
};
