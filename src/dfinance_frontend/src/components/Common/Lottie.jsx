import React from "react";
import { useSelector } from "react-redux";
import { useLottie } from "lottie-react";
import emptyAnimationDark from "../../../public/animations/empty-animation2.json";
import emptyAnimationLight from "../../../public/animations/empty-animation1.json";

const style = {
  height: 110,
};

function Lottie() {
  const theme = useSelector((state) => state.theme.theme);
  const options = {
    animationData: theme === "dark" ? emptyAnimationDark : emptyAnimationLight,
    autoplay: true,
    loop: true,
  };
  const { View } = useLottie(options, style);
  return <div>{View}</div>;
}

export default Lottie;
