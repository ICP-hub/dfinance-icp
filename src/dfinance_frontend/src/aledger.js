// src/hooks/useLedgerActor.js
import { Actor } from '@dfinity/agent';
import { idlFactory as ledgerIDL } from './ledger.did'; // Adjust the path to your ledger IDL

export const useLedgerActor = (canisterId,agent) => {
  const ledgerActor = Actor.createActor(ledgerIDL, {
    agent,
    canisterId,
  });

  return ledgerActor;
};