import { Modal, Box, Fade, Backdrop, Slide, Grow, Zoom } from '@mui/material';
import React from 'react';


const MySupplyModal = ({ isModalOpen, isLoading, setIsModalOpen, children }) => {

  const handleModalOpen = () => {
    setIsModalOpen(!isModalOpen);
  };

  const handleCloseModal = (event) => {
    if (!isLoading) {
      setIsModalOpen(false);
    }
  };
  return (
    <Modal
      open={isModalOpen}
      onClose={isLoading ? null : handleCloseModal}
      disableScrollLock={isLoading}
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
      className="flex items-center justify-center"
    >
      <Grow in={isModalOpen} style={{ transformOrigin: 'center center' }} timeout={400}>
        <Fade in={isModalOpen}>
          <div className={`relative w-[325px] lg1:w-[420px] bg-white shadow-xl rounded-xl p-6 text-[#2A1F9D] dark:bg-darkOverlayBackground dark:text-darkText font-poppins ${isLoading ? 'pointer-events-none opacity-50' : ''}`}>
            {children}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50 z-50">
                <div className="loader"></div>
              </div>
            )}
          </div>
        </Fade>
      </Grow>
    </Modal>
  );
};

export default MySupplyModal;