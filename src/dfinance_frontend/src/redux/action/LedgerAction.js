// actions/ledgerActions.js

export const SET_LEDGER_ACTORS = 'SET_LEDGER_ACTORS';

export const setLedgerActors = (ledgerActors) => ({
  type: SET_LEDGER_ACTORS,
  payload: ledgerActors,
});
