import { useState } from 'react';
import { dfinance_backend } from 'declarations/dfinance_backend';

function App() {
  const [greeting, setGreeting] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    const name = event.target.elements.name.value;
    dfinance_backend.greet(name).then((greeting) => {
      setGreeting(greeting);
    });
    return false;
  }

  return (
    <main>
      <h1 className='text-3xl font-bold underline'> hello</h1>
    </main>
  );
}

export default App;
