import { useEffect, useState } from 'react';
import useGorgon from '../lib/useGorgon';

// This is your function you want to cache
const getDetails = async (url: string):Promise<{title: string, fetchedDate: Date}> => {
  // wait 3 seconds to simulate a slow request
  await new Promise(resolve => setTimeout(resolve, 3000));
  // this function fetched the API data, we dont want to spam this API
  const response = await fetch(url || 'https://jsonplaceholder.typicode.com/todos/1');
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

  const [fetchUrl , setFetchUrl] = useState<string>('https://jsonplaceholder.typicode.com/todos/1');

  const {data: jsonData, error, loading, refetch} = useGorgon(
    'todos_useGorgon' + fetchUrl,
    () => { return getDetails(fetchUrl); },
    10000,
    {debug: true}
  );

  if(loading) return <div>Loading...</div>;

  return <div>
    <h2>Fully built useGorgon Example</h2>
    <div className='example-containers'>
      <div>
        {error && <div>Error: {error.message}</div>}
        <ul>
          <li>🕮 Title: {jsonData && jsonData.title || 'loading...'}</li>
          <li>🕰️ Fetched data at: {jsonData && formatDate(jsonData.fetchedDate)}</li>
          <li>⏲️ Rendered at: {formatDate(new Date())}</li>
        </ul>
        <button onClick={() => {setFetchUrl('http://badurl.cccccc')}}>Force error state</button>
        <button onClick={() => {setFetchUrl('https://jsonplaceholder.typicode.com/todos/1')}}>Good Url</button>
        <button onClick={() => { refetch(); } }>Force refetch</button>
      </div>
      <div>
        <h3>What this Does</h3>
        <p>
          https://jsonplaceholder.typicode.com/todos/1
          will be queried with a 3 second timeout to simulate a slow request.
        </p>
        <p>
          We use Gorgon to cache this response for 10 seconds,
          this example uses the fully built useGorgon hook from the lib/useGorgon.ts file.
          This is the base hook that you can use to build your own custom hook and is the basis of the @gorgon/react version of useGorgon.
        </p>
        <p>
          If you swicth between this and the otehr examples,
          you can see that this will not reload if you switch back within 10 seconds.
        </p>
      </div>
    </div>
  </div>;
};
