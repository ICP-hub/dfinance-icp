import React from 'react';

const Popup = ({ position, onClose }) => {
  return (
    <div style={{ position: 'absolute', top: position.top + 100 , left : position.left + 850, zIndex: 10 }}>
      <div className="bg-white rounded-lg p-6 w-60 relative dark:bg-darkOverlayBackground dark:text-darkTextSecondary dark:border-none shadow-lg">
        <button onClick={onClose} className="absolute top-2 right-3 text-[#3e3e40] font-semibold dark:text-darkText">
          ✕
        </button>
        <p className="text-[#2A1F9D] text-sm mb-4 dark:text-darkText">More</p>
        <p>
          <a href="/docs" className="text-[#2A1F9D] text-xl -mb-4 font-bold dark:text-darkText">Doc</a>
        </p>
        <p>
          <a href="/#faq" className="text-[#2A1F9D] text-xl font-bold dark:text-darkText">FAQ's</a>
        </p>
      </div>
    </div>
  );
};

export default Popup;
