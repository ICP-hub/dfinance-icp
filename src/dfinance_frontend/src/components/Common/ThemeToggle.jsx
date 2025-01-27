import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toggleTheme } from "../../redux/reducers/themeReducer";
import Sun from "../../../public/theme/Sun.svg"
import Moon from "../../../public/theme/Moon.svg"

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
      className="flex items-center p-1 rounded-md button1"
    >
    
        <div className="flex items-center justify-center p-[2px] rounded-lg w-[45px] h-[45px]">
          {theme === 'dark' ? (
            <img src={Sun} alt="Sun Icon" className="w-full h-full" />
          ) : (
            <img src={Moon} alt="Moon Icon" className="w-full h-full" />
          )}
        </div>
    </button>
  );
};

export default ThemeToggle;
