import { useState, useEffect } from "react";
import { useAuth } from "../../utils/useAuthClient";

const useTransferFee = (asset) => {
  const { backendActor } = useAuth();
  const [transferFee, setTransferFee] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransferFee = async () => {
        try {
            const feeResponse = await backendActor.get_transfer_fee(asset);
            const rawFee = feeResponse?.Ok;
            if (typeof rawFee === "bigint") {
                if (rawFee === 0n) {
                    setTransferFee(0); // Set fee as 0 directly
                    return
                  }
                const convertedFee = (Number(rawFee) / 100000000).toFixed(8); 
              setTransferFee(convertedFee);
            } else {
              setError("Invalid fee format received from backend");
            }
          } catch (err) {
            setError(err.message || "Failed to fetch transfer fee");
          } finally {
            setLoading(false);
          }
        };
    
        if (asset) {
          fetchTransferFee();
        }
  }, [asset, backendActor]);

  return { transferFee, loading, error };
};

export default useTransferFee;
