import { useState } from 'react'
import SimpleExample from './pages/SimpleExample';
import SimpleExample2 from './pages/SimpleExample';
import GorgonUseSimple from './pages/GorgonUseSimple';
import GorgonUse from './pages/GorgonUse';

import './App.css'

function App() {

  const [currentPage, setCurrentPage] = useState(1);

  return <div className="App">
    <h1>Sample React Application with Gorgon 🐍</h1>
    <nav>
      <button onClick={() => { setCurrentPage(1); }}>🔗 Basic Example</button>
      <button onClick={() => { setCurrentPage(2); }}>🔗 Basic Example 2</button>
      <button onClick={() => { setCurrentPage(3); }}>🛠️ Simple useGorgon</button>
      <button onClick={() => { setCurrentPage(4); }}>🐍 useGorgon Full</button>
    </nav>
    {currentPage === 1 && <SimpleExample />}
    {currentPage === 2 && <SimpleExample2 />}
    {currentPage === 3 && <GorgonUseSimple />}
    {currentPage === 4 && <GorgonUse />}
  </div>;
}

export default App
