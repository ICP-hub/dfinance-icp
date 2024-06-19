import { Modal } from '@mui/material'
import React from 'react'
import Button from '../Button'

const MySupplyModal = ({isModalOpen, handleModalOpen, children}) => {
  return (
      <Modal open={isModalOpen} onClose={handleModalOpen}>
          <div className='w-[350px] absolute bg-gradient-to-r from-[#242151] via-[#262353] to-[#2F2D61] bg-opacity-75 shadow-xl filter backdrop-blur-lg rounded-lg top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 text-white'>
              {children}
          </div>
      </Modal>
  )
}

export default MySupplyModal