import React from 'react'
import Ellipse from './components/utility/Ellipse'

const App:React.FC= () => {
  return (
    <div className='w-full flex justify-end'>
      <Ellipse width='500' height='500' fill='none' position="top-right"/>
    </div>
  )
}

export default App