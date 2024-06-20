import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toggleTheme } from "../redux/reducers/themeReducer";
import { LiaToggleOnSolid } from "react-icons/lia";
import { LiaToggleOffSolid } from "react-icons/lia";
import { LuSunMoon } from "react-icons/lu";
import { LuMoonStar } from "react-icons/lu";

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

  return (
    <button
      onClick={handleToggle}
      className="flex items-center p-2 rounded-md text-gray-900 dark:text-gray-100"
    >
      {theme === 'dark' ? (
        <LuSunMoon size={26} />
      ) : (
        <LuMoonStar size={26} className="text-gray-500"/>
      )}
    </button>
  );
};

export default ThemeToggle;
