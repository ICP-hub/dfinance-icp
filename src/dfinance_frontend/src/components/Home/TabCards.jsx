import React, { useEffect, useState } from 'react';
import { TAB_CARD_DESCRIPTION_LENGTH } from '../../utils/constants';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import "./TabCards.css";

const TabCards = ({ data }) => {
  const [gradientPosition, setGradientPosition] = useState('');
  
  useEffect(() => {
    const positions = [
      'circle at top left',
      'circle at top right',
      'circle at bottom left',
      'circle at bottom right'
    ];

    
    const randomPosition = positions[Math.floor(Math.random() * positions.length)];

    setGradientPosition(randomPosition);
  }, []);

  return (
    <div className='h-[301px] flip-card mb-[50px] pt-[15px] text-white cursor-pointer bg-transparent'>
      <div
        className='flip-card-inner relative transition-transform duration-500 w-full h-full rounded-2xl '>
        
          <div
            className='flip-card-front absolute rounded-2xl w-full h-full z-10 p-4 shadow'
            style={{ background: `radial-gradient(${gradientPosition}, #83d8e6 15%, #4659CF 100%)` }}
          >
            <div className="w-full flex items-center gap-3">
              <img src={data.image} alt={data.title} className='rounded-full w-10 h-10 object-cover object-center' />
              <h1 className='font-semibold text-lg dark:text-darkBackground'>{data.title}</h1>
            </div>
            <p className='text-sm mt-3 dark:text-darkBackground'>
              {data.description.length > TAB_CARD_DESCRIPTION_LENGTH ? `${data.description.slice(0, TAB_CARD_DESCRIPTION_LENGTH)}...` : data.description}
            </p>
          </div>
          
          <div
            className='bg-[#475AD0] flip-card-back absolute rounded-2xl w-full h-full p-4 flex flex-col justify-between'>
            <div className="w-full">
              <div className="w-full flex items-center gap-3">
                <h1 className='font-semibold text-lg'>{data.title}</h1>
              </div>
              <p className='text-sm mt-2'>
                {data.description.length > TAB_CARD_DESCRIPTION_LENGTH ? `${data.description.slice(0, TAB_CARD_DESCRIPTION_LENGTH)}...` : data.description}
              </p>
            </div>
            <Link to={`/market`} state={data} className='flex mt-2 items-center gap-2 text-sm'>
              Go to market <ArrowRight />
            </Link>
          </div>
      </div>
    
    </div>
  );
};

export default TabCards;
