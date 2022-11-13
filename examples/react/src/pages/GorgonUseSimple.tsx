import { useEffect, useState } from 'react';
import useGorgonSimple from '../lib/useGorgonSimple';

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

  const jsonData = useGorgonSimple('todos_simpleexample', getDetails, 10000);

  return <div>
    <h2>Simple Example</h2>
    <div className='example-containers'>
      <div>
        <ul>
          <li>Title: {jsonData && jsonData.title}</li>
          <li>Fetched data at: {jsonData && formatDate(jsonData.fetchedDate)}</li>
          <li>Rendered at: {formatDate(new Date())}</li>
        </ul>
      </div>
      <div>
        <h3>What this Does</h3>
        <p>
          This example will fetch from the API exactly once every <strong>10 seconds.</strong> when rendering.
          You can switch between the other examples to se it in action.
          This version uses the useGorgonSimple hook to simplify fetching data for the user.
        </p>
      </div>
    </div>
  </div>;
};
