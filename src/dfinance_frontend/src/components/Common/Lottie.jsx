import React from "react";
import { useSelector } from "react-redux";
import { useLottie } from "lottie-react";
import emptyAnimationDark from "../../../public/animations/Animation - 1737441133283.json";
import emptyAnimationLight from "../../../public/animations/Animation - 1737440788189.json";

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
