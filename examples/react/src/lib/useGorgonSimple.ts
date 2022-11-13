import { useState, useEffect } from "react";
import Gorgon, {GorgonPolicyInput} from '@gorgonjs/gorgon';

export default function useGorgon <R>(key: string, asyncFunc: () => Promise<R>, policy?: GorgonPolicyInput ): R | null {
  const [jsonData, setJsonData] = useState<null | R>(null);

  useEffect( () => {
    let isStillMounted = true;

    Gorgon.get(key, asyncFunc, policy)
      .then(async (data) => {
        if(isStillMounted){
          console.info('Gorgon returned the json data', data);
          setJsonData(await data);
        }
      }).catch(
        (err) => {
          console.error('Gorgon error', err);
        }
      );

    return () => {
      isStillMounted = false;
    }
  }, [key]);

  return jsonData;
}
