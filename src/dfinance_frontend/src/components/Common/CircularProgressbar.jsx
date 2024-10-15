import React from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { useSelector } from "react-redux";

const CircularProgress  = ({ progessValue }) => {
    const theme = useSelector((state) => state.theme.theme);
    const getTextSize = (value) => {
      if (value > 99) return '16px'; 
      if (value > 50) return '17px';
      return '18px'; 
    };
  return (
    <div style={{ width: 78, height: 78, position: 'relative' }}>
      <CircularProgressbar
        value={progessValue}
        text={`${progessValue}%`}
        styles={buildStyles({
          pathColor: 'url(#gradient)',
          textColor: theme === 'dark' ? "#FFFFFF" : "#2A1F9D",
          trailColor: theme === 'dark' ? "#18183d" : "#e6d7eb",
          textSize: getTextSize(progessValue),
        })}
      />
      <svg style={{ height: 0 }}>
      <defs>
        <radialGradient
          id="gradient"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(69.9985 -1.06277) rotate(180) scale(67.6068 135.387)"
        >
          <stop offset="0.15" stop-color="#FCBD78" />
          <stop offset="0.54" stop-color="#D379AB" />
          <stop offset="0.67" stop-color="#C562BD" />
          <stop offset="1" stop-color="#4659CF" />
        </radialGradient>
      </defs>
      </svg>
    </div>
  );
};

export default CircularProgress;
