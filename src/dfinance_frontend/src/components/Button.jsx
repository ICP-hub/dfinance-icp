import React from 'react'

const Button = ({ title, onClickHandler, className }) => {

  return (
      <button
          type="button"
          className={className ? className : 'my-2 bg-gradient-to-r text-white from-[#4659CF] via-[#D379AB] to-[#FCBD78] rounded-xl p-3 px-8 shadow-lg font-semibold text-sm'}
          onClick={onClickHandler}
      >
          {title}
      </button>
  )
}

export default Button