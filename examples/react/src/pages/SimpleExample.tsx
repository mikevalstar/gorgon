import { useEffect, useState } from 'react';
import Gorgon from '@gorgonjs/gorgon';

// This is your function you want to cache
const getDetails = async ():Promise<{title: string, fetchedDate: Date}> => {
  // wait 3 seconds to simulate a slow request
  await new Promise(resolve => setTimeout(resolve, 3000));
  // this function fetched the API data, we dont want to spam this API
  const response = await fetch('https://jsonplaceholder.typicode.com/todos/1');
  const data = await response.json();
  data.fetchedDate = new Date();
  // Helper for debugging purposes
  console.info('Fetched from API');
  return data;
};

// Date formatter for the example
const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  fractionalSecondDigits: 2,
  hour12: false,
});

const formatDate = (date: Date | null | undefined) => {
  if(!date) return '';
  return dateFormatter.format(date);
};

// A simple component that fetches data from an API and displays it
export default function SimpleExample() {

  const [jsonData, setJsonData] = useState<any>(false);

  useEffect( () => {
    let isStillMounted = true;

    Gorgon.get('todos_simpleexample', getDetails, 10000)
      .then(async (data) => {
        if(isStillMounted){
          console.log('Gorgon returned the json data', data);
          setJsonData(await data);
        }
      });

    return () => {
      isStillMounted = false;
    }
  }, []);

  return <div>
    <h2>Simple Example</h2>
    <div className='example-containers'>
      <div>
      <ul>
          <li>🕮 Title: {jsonData && jsonData.title || 'loading...'}</li>
          <li>🕰️ Fetched data at: {jsonData && formatDate(jsonData.fetchedDate)}</li>
          <li>⏲️ Rendered at: {formatDate(new Date())}</li>
        </ul>
      </div>
      <div>
        <h3>What this Does</h3>
        <p>
          https://jsonplaceholder.typicode.com/todos/1
          will be queried with a 3 second timeout to simulate a slow request.
        </p>
        <p>
          We use Gorgon to cache this response for 10 seconds, so if this component it reloaded within 10 seconds,
          the cached data will be used.
        </p>
        <p>
          If you switch between this and the Basic example 2, they both use this component and the same cache key,
          this means they will end up sharing the result of this cache.
        </p>
      </div>
    </div>
  </div>;
};
