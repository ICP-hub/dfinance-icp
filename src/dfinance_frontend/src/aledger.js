import { Actor } from '@dfinity/agent';
import { idlFactory as dTokenIDL } from '../../declarations/debttoken'; 
import { idlFactory as debtTokenIDL } from '../../declarations/dtoken'; 
import { idlFactory as ledgerIDL } from './ledger.did'; 

export const useLedgerActor = (canisterId, agent, tokenType) => {
 
  const idlFactory = tokenType === 'dToken' ? dTokenIDL 
                    : tokenType === 'debtToken' ? debtTokenIDL 
                    : ledgerIDL; 

  return Actor.createActor(idlFactory, {
    agent,
    canisterId,
  });
};
