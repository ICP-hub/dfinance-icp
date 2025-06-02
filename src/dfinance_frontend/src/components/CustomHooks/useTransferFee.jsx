import { useState, useEffect } from "react";
import { useAuth } from "../../utils/useAuthClient";
import { SCALING_FACTOR } from '../../utils/constants';
const useTransferFee = (asset) => {
  const { backendActor } = useAuth();
  const [transferFee, setTransferFee] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransferFee = async () => {
      try {
        const feeResponse = await backendActor.get_transfer_fee(asset);
        const rawData = feeResponse.Ok?.[0];
        const cert = feeResponse.Ok?.[1];

        if (cert) {
          try {
            const verified = await verifyCertificate(cert);
            if (!verified) {
              console.error("Certificate verification failed for transfer fee");
              return;
            }
          } catch (verificationError) {
            console.error(
              "Error verifying transfer fee certificate:",
              verificationError
            );
            return;
          }
        }

        const rawFee = rawData;
        if (typeof rawFee === "bigint") {
          if (rawFee === 0n) {
            setTransferFee(0);
            return;
          }
          const convertedFee = (Number(rawFee) / SCALING_FACTOR).toFixed(8);
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
