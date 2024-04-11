import React from 'react'
import { TAB_CARD_DESCRIPTION_LENGTH } from '../../utils/constants'

const TabCards = ({ data }) => {
  return (
      <div className='min-h-[250px] tab_cards_gradient p-4 rounded-md text-white shadow hover:shadow-md hover:scale-105 ease-in-out cursor-pointer duration-500'>
        <div className="w-full flex items-center gap-3">
            <img src={data.image} alt={data.title} className='rounded-full w-10 h-10 object-cover object-center'/>
              <h1 className='font-semibold text-lg'>{data.title}</h1>
        </div>
        <p className='text-sm mt-3'>
              {data.description.length > TAB_CARD_DESCRIPTION_LENGTH ? `${data.description.slice(0, TAB_CARD_DESCRIPTION_LENGTH)}...` : data.description}
        </p>
    </div>
  )
}

export default TabCards