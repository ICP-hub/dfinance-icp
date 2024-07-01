import { Modal } from '@mui/material'
import React from 'react'
import Button from '../Button'

const MySupplyModal = ({isModalOpen, handleModalOpen, children}) => {
  return (
      <Modal open={isModalOpen} onClose={handleModalOpen}>
          <div className='w-[350px] absolute bg-white   shadow-xl  rounded-lg top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 text-[#2A1F9D] font-poppins dark:bg-darkOverlayBackground'>
              {children}
          </div>
      </Modal>
  )
}

export default MySupplyModal