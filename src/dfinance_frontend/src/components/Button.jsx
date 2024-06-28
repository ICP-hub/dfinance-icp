import React from 'react';

const Button = ({ title, onClickHandler, className }) => {
  return (
    <button
      type="button"
      className={className ? className : 'my-2 bg-gradient-to-tr from-[#4C5FD8] via-[#D379AB] to-[#FCBD78] text-white rounded-xl p-[11px] px-8 shadow-2xl shadow-gray-500/50 font-semibold text-sm sxs3:px-6'}
      onClick={onClickHandler}
    >
      {title}
    </button>
  );
};

export default Button;
