// Custom hook to format numbers without useCallback
const useFormatNumber = () => {
    const formatNumber = (num) => {
        const parsedNum = parseFloat(num);

        if (isNaN(parsedNum) || parsedNum === null || parsedNum === undefined) {
            return "0";
        }
        if (parsedNum >= 1000000000000) { 
            return (parsedNum / 1000000000000).toFixed(1).replace(/\.0$/, "") + "T";
        }
        if (parsedNum >= 1000000000) {
            return (parsedNum / 1000000000).toFixed(1).replace(/\.0$/, "") + "B";
        }
        if (parsedNum >= 1000000) {
            return (parsedNum / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
        }
        if (parsedNum >= 1000) {
            return (parsedNum / 1000).toFixed(1).replace(/\.0$/, "") + "K";
        }
        return parsedNum.toFixed(2).toString();
    };

    return formatNumber;
};

export default useFormatNumber;
