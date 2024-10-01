import React from 'react';
import { useSelector } from 'react-redux';

const Buton = ({ className, title, style }) => {
  const theme = useSelector((state) => state.theme.theme);

  const gradientStyles = {
    light: 'radial-gradient(98.86% 198.27% at 102.51% -1.56%, #FCBD78 15%, #4659CF 100%',
    dark: 'radial-gradient(98.86% 198.27% at 102.51% -1.56%, #FF941F 15%, #1A39F5 100%)'
  };

  const backgroundStyle = {
    background: gradientStyles[theme] || gradientStyles.light,
  };

  return (
    <button
      className={`rounded-xl p-3 px-8 shadow-md shadow-[#00000040] font-semibold text-sm ${className}`}
      style={{ ...backgroundStyle, ...style }}
    >
      {title}
    </button>
  );
};

export default Buton;
