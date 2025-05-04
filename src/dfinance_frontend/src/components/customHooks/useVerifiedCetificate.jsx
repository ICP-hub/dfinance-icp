import { useState, useEffect, useRef } from 'react';
import { Certificate, Cbor, reconstruct } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";

const buffersEqual = (buf1, buf2) => {
  if (!buf1 || !buf2 || buf1.byteLength !== buf2.byteLength) return false;
  const view1 = new Uint8Array(buf1);
  const view2 = new Uint8Array(buf2);
  for (let i = 0; i < view1.length; i++) {
    if (view1[i] !== view2[i]) return false;
  }
  return true;
};

const useCertificateVerification = (certObj, rootKey, canisterId, blsVerify) => {
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState(null);
  const hasVerified = useRef(false); 

  useEffect(() => {
    if (!certObj || !rootKey || !canisterId || hasVerified.current) return;

    const verifyCertificate = async () => {
      try {
        hasVerified.current = true; 

        const cert = new Certificate(certObj.certificate, rootKey, canisterId, blsVerify);
        await cert.verify();

        const te = new TextEncoder();
        const canisterPrincipal = Principal.fromText(canisterId);
        const pathData = [
          te.encode("canister"),
          canisterPrincipal.toUint8Array(),
          te.encode("certified_data"),
        ];

        const certifiedData = cert.lookup(pathData);
        const witnessTree = Cbor.decode(certObj.witness);
        const witnessRootHash = await reconstruct(witnessTree);

        if (certifiedData && buffersEqual(certifiedData, witnessRootHash)) {
          setIsVerified(true);
        } else {
          console.error("❌ Certified data mismatch!");
          setIsVerified(false);
        }
      } catch (err) {
        console.error("Error during certificate verification:", err);
        setError(err.message || err);
        setIsVerified(false);
      }
    };

    verifyCertificate();
  }, [certObj, rootKey, canisterId, blsVerify]);

  return { isVerified, error };
};

export default useCertificateVerification;