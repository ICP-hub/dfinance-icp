import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toggleTheme } from "../redux/reducers/themeReducer";
import { AiOutlineMoon } from "react-icons/ai";
import { GrSun } from "react-icons/gr";

const ThemeToggle = () => {
  const theme = useSelector((state) => state.theme.theme);
  const dispatch = useDispatch();

  const handleToggle = () => {
    dispatch(toggleTheme());
  };

  React.useEffect(() => {
    const htmlElement = document.documentElement;
    const bodyElement = document.body;
    if (theme === 'dark') {
      htmlElement.classList.add('dark');
      bodyElement.classList.add('dark');
      bodyElement.style.backgroundColor = '#070a18';
    } else {
      htmlElement.classList.remove('dark');
      bodyElement.classList.remove('dark');
      bodyElement.style.backgroundColor = '';
    }
  }, [theme]);

  const gradientStyle = {
    background: 'linear-gradient(90deg, #EC4899, #F43F5E, #F59E0B)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  };

  return (
    <button
      onClick={handleToggle}
      className="flex items-center p-1 rounded-md text-gray-900 dark:text-gray-100"
    >
      <div className="bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 p-1 rounded-lg">
        <div className="flex items-center justify-center bg-white dark:bg-darkFAQBackground p-1 rounded-lg w-9 h-9">
          {theme === 'dark' ? (
            <GrSun size={26} style={gradientStyle} />
          ) : (
            <AiOutlineMoon size={26} style={gradientStyle} />
          )}
        </div>
      </div>
    </button>
  );
};

export default ThemeToggle;
