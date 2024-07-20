import { Modal } from '@mui/material'
import React from 'react'
import Button from '../Button'

const MySupplyModal = ({isModalOpen, handleModalOpen, children}) => {
  return (
      <Modal open={isModalOpen} onClose={handleModalOpen}>
          <div className='w-[325px] sm:w-[420px] absolute bg-white   shadow-xl  rounded-xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-6 text-[#2A1F9D] dark:bg-darkOverlayBackground dark:text-darkText font-poppins'>
              {children}
          </div>
      </Modal>
  )
}

export default MySupplyModal