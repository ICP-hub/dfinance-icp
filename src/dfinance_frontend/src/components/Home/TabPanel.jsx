import React from 'react'
import TabCards from './TabCards'
import { TAB_CARD_DATA } from '../../utils/constants'
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/grid';
import 'swiper/css/pagination';
import 'swiper/css/autoplay';
import { Pagination, Autoplay  } from 'swiper/modules';

const TabPanel = () => {

    return (
        <div className='w-full'>
            <Swiper
                 breakpoints={{
                    640: {
                        slidesPerView: 1, // Mobile screens
                    },
                    768: {
                        slidesPerView: 2, // Tablets
                    },
                    1024: {
                        slidesPerView: 4, // Desktops
                    },
                }}
                spaceBetween={30}
                pagination={{
                    clickable: true,
                }}
                autoplay={{
                    delay: 2000,
                    disableOnInteraction: true,
                    pauseOnMouseEnter: true,
                    resumeOnMouseLeave: true,
                }}
                modules={[Pagination, Autoplay]}
                className=""
            >
                {TAB_CARD_DATA.map((item, index) =>
                    <SwiperSlide>
                        <TabCards key={index} data={item} />
                    </SwiperSlide>
                )}
            </Swiper>
        </div>
    )
}

export default TabPanel