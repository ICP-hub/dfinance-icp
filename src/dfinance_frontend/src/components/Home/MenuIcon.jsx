import React from 'react';
import { Menu } from 'lucide-react';

const MenuIcon = () => {
  return (
    <div
      className="w-10 h-10 border-b-[1px] dark:border-gray-600 bg-gradient-to-tr from-[#EB8863]/60 to-[#81198E]/60 dark:from-[#EB8863]/90 dark:to-[#81198E]/90 flex items-center justify-center rounded-lg shadow-[#00000040] shadow-sm cursor-pointer" >
      <Menu color='white' />
    </div>
  );
}

export default MenuIcon;
