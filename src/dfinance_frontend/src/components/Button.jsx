import React from 'react';

const Button = ({ title, onClickHandler, className }) => {
  return (
    <button
      type="button"
      className={className ? className : 'my-2 bg-gradient-to-tr from-[#4C5FD8] via-[#D379AB] to-[#FCBD78] text-white rounded-2xl p-3 px-8 shadow-2xl shadow-gray-500/50 font-semibold text-sm'}
      onClick={onClickHandler}
    >
      {title}
    </button>
  );
};

export default Button;
