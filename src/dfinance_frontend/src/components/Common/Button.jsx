import React from "react";

const Button = ({ title, onClickHandler, className }) => {
  return (
    <button
      type="button"
      className={
        className
          ? className
          : "my-2 bg-gradient-to-tr from-[#4C5FD8] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white rounded-xl p-[11px] px-8 shadow-sm shadow-[#00000040] font-medium text-sm sxs3:px-8 h-auto z-10 opacity-100"
      }
      onClick={onClickHandler}
    >
      {title}
    </button>
  );
};

export default Button;
