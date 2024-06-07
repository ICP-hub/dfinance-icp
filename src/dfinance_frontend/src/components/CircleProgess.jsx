import React, { useEffect, useRef } from "react"

const CircleProgess = ({ progessValue }) => {
  const progressText = useRef(null)
  const progressIndicator = useRef(null)

  useEffect(() => {
    if (progressText.current && progressIndicator.current) {
      console.log(progressText.current, progressIndicator.current)
      //   const circumference = Math.PI * 2 * 80
      const progressRadius = progressIndicator.current.r.baseVal.value
      const circumference = Math.PI * 2 * progressRadius

      const offset = circumference - (progessValue / 100) * circumference

      console.log({ progressRadius, circumference, offset })

      progressIndicator.current.style.strokeDashoffset = offset
      progressIndicator.current.style.strokeDasharray = `${circumference} ${circumference}`
      progressText.current.textContent = progessValue + "%"
    }
  }, [])
  return (
      <svg className="block my-0 mx-auto w-[90px] h-[90px]">
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
      <circle
        cx={40}
        cy={40}
        r={35}
        fill="transparent"
        stroke="transparent"
        strokeWidth={4}
      />
      <circle
        ref={progressIndicator}
        cx={40}
        cy={40}
        r={35}
        fill="transparent"
        stroke="url(#gradient)"
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={"0"}
      />
      <text
        ref={progressText}
        x="50%"
        y="50%"
        textAnchor="middle"
        alignmentBaseline="middle"
        fontSize={12}
        fill="#2A1F9D"
        fontWeight={500}
      >
        0%
      </text>
    </svg>
  )
}

export default CircleProgess
