import { useState, useEffect } from "react";
import Gorgon, {GorgonPolicyInput} from '@gorgonjs/gorgon';

export type UseGorgonOptions = {
  debug?: boolean;
};

const defaultOptions = {
  debug: false
} as UseGorgonOptions;

// Wraps the Gorgon get method with a React hook
export const useGorgon = <R>(key: string, asyncFunc: () => Promise<R>, policy?: GorgonPolicyInput, options?:UseGorgonOptions) => {
  const [data, setData] = useState<null | R>(null);
  const [error, setError] = useState<null | Error>(null);
  const [loading, setLoading] = useState(false);
  const [refetchCount, setRefetchCount] = useState(0);

  const opts = Object.assign({}, defaultOptions, options);

  useEffect(() => {
    let isStillMounted = true;
    setLoading(true);

    Gorgon.get(key, asyncFunc, policy)
      .then(async (returnedData) => {
        if(isStillMounted){
          if(opts.debug) console.info('Gorgon returned the data from the function', returnedData);
          setData(await returnedData);
          setError(null);
          setLoading(false);
        }
      }).catch(
        (err) => {
          if(opts.debug) console.error('Gorgon error', err);
          if(isStillMounted){
            setError(err);
            setData(null);
            setLoading(false);
          }
        }
      );

    return () => {
      isStillMounted = false;
    }
  }, [key, refetchCount]);

  const refetch = ({clearKey}:{clearKey?: string} = {}) => {
    Gorgon.clear(clearKey || key);
    setRefetchCount(refetchCount + 1);
  }

  return {data, error, loading, refetch};
}

// helper function to clear the cache
export const clearGorgon = (key?: string) => {
  Gorgon.clear(key);
}

export { Gorgon };
