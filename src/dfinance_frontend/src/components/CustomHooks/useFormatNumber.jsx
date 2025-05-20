import { TRILION } from "../../utils/constants";
import { BILION } from "../../utils/constants";
import { MILION } from "../../utils/constants";
import { Thousand } from "../../utils/constants";
const useFormatNumber = () => {
  const formatNumber = (num) => {
    const parsedNum = parseFloat(num);

    if (isNaN(parsedNum) || parsedNum === null || parsedNum === undefined) {
      return "0";
    }
    if (parsedNum >= TRILION) {
      return (parsedNum / TRILION).toFixed(1).replace(/\.0$/, "") + "T";
    }
    if (parsedNum >= BILION) {
      return (parsedNum / BILION).toFixed(1).replace(/\.0$/, "") + "B";
    }
    if (parsedNum >= MILION) {
      return (parsedNum / MILION).toFixed(1).replace(/\.0$/, "") + "M";
    }
    if (parsedNum >= Thousand) {
      return (parsedNum / Thousand).toFixed(1).replace(/\.0$/, "") + "K";
    }
    return parsedNum.toFixed(2).toString();
  };

  return formatNumber;
};

export default useFormatNumber;
