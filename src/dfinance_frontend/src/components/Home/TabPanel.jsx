import React from 'react'
import TabCards from './TabCards'
import { TAB_CARD_DATA } from '../../utils/constants'

const TabPanel = ({ currentTab }) => {
    const renderCard = () => {
        switch (currentTab) {
            case 0:
                return TAB_CARD_DATA.map((item, index) => <TabCards key={index} data={item}/>)

            case 1:
                return TAB_CARD_DATA.map((item, index) => <TabCards key={index} data={item} />)
                
            case 2:
                return TAB_CARD_DATA.map((item, index) => <TabCards key={index} data={item} />)
                
            default:
                return TAB_CARD_DATA.map((item, index) => <TabCards key={index} data={item} />)
        }
    }

    return (
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 lgx:grid-cols-4 gap-4">
            {
                renderCard()
            }
        </div>
    )
}

export default TabPanel