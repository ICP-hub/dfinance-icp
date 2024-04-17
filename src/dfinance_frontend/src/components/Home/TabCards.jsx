import React from 'react'
import { TAB_CARD_DESCRIPTION_LENGTH } from '../../utils/constants'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const TabCards = ({ data }) => {
  return (
    <div className='min-h-[260px] text-white rotate_card cursor-pointer bg-transparent'>
      <div id="main_face" className='main_face relative transition-transform duration-500 w-full h-full rounded-md'>
        <div id="front_face" className='tab_cards_gradient absolute w-full h-full z-10 p-4 rounded-md shadow'>
          <div className="w-full flex items-center gap-3">
            <img src={data.image} alt={data.title} className='rounded-full w-10 h-10 object-cover object-center' />
            <h1 className='font-semibold text-lg'>{data.title}</h1>
          </div>
          <p className='text-sm mt-3'>
            {data.description.length > TAB_CARD_DESCRIPTION_LENGTH ? `${data.description.slice(0, TAB_CARD_DESCRIPTION_LENGTH)}...` : data.description}
          </p>
        </div>
        <div id="back_face" className='bg-[#4659CF] back_face absolute w-full h-full rounded-md p-4 flex flex-col justify-between'>
          <div className="w-full">
          <div className="w-full flex items-center gap-3">
            <h1 className='font-semibold text-lg'>{data.title}</h1>
          </div>
          <p className='text-sm mt-2'>
            {data.description.length > TAB_CARD_DESCRIPTION_LENGTH ? `${data.description.slice(0, TAB_CARD_DESCRIPTION_LENGTH)}...` : data.description}
          </p>
          </div>
          <Link to={`/dashboard/main`} state={data} className='flex mt-2 items-center gap-2 text-sm'>Go to market <ArrowRight/></Link>
        </div>
      </div>
    </div>
  )
}

export default TabCards