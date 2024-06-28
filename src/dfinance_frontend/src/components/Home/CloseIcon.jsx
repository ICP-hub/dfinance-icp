import React from 'react';
import { X } from 'lucide-react';

const CloseIcon = () => {
  return (
    <div
      className="w-11 h-11 bg-gradient-to-r from-[#81198E] to-[#EB8863] flex items-center justify-center rounded-lg shadow-lg cursor-pointer"
    >
      <X className="text-white w-6 h-6" />
    </div>
  );
};

export default CloseIcon;
