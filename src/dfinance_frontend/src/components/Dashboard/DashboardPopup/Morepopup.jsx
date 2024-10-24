import React from 'react';

const Popup = ({ position, onClose }) => {
  return (
    <div style={{ position: 'absolute', top: position.top + 100 , left : position.left + 875, zIndex: 10 }}>
      <div className="bg-white rounded-[12px] p-5 w-[200px] relative dark:bg-darkOverlayBackground dark:text-darkTextSecondary dark:border-none shadow-lg select-none">
        {/* <button onClick={onClose} className="absolute top-2 right-3 text-[#3e3e40] font-semibold dark:text-darkText button1">
          ✕
        </button> */}
        <p className="text-[#2A1F9D] text-sm mb-4 dark:text-darkText">more</p>
        <div className="flex justify-center flex-col gap-2">
        <p className="button1">
          <a href="https://dfinance.notion.site/bbe01eaf7d414148bc4b9843675a532f?v=8b792ba254da44ecab1c0c016331c8af&pvs=4" target='blank' className="text-[#2A1F9D] text-xl font-bold dark:text-darkText">Doc</a>
        </p>
        <div className="border-t border-gray-400/50 opacity-80"></div>
        <p className="button1">
          <a href="/#faq" className="text-[#2A1F9D] text-xl font-bold dark:text-darkText">FAQ's</a>
        </p>
        </div>
      </div>
    </div>
  );
};

export default Popup;
