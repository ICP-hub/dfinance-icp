import React from 'react';

const MenuIcon = () => {
  return (
    <div
    className="w-10 h-[38px] border-b-[1px] bg-gradient-to-tr from-[#EB8863]/60 to-[#81198E]/60 dark:from-[#EB8863]/90 dark:to-[#81198E]/90 flex items-center justify-center rounded-lg shadow-[#00000040] shadow-sm cursor-pointer"
      
    >
      <div className="space-y-1.5">
        <div className="w-5 h-0.5 bg-white rounded"></div>
        <div className="w-5 h-0.5 bg-white rounded"></div>
        <div className="w-5 h-0.5 bg-white rounded"></div>
      </div>
    </div>
  );
};

export default MenuIcon;
