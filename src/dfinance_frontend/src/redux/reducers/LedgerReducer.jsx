// src/redux/reducers/ledgerReducer.jsx
const initialState = {
    ledgerActors: {
      ckBTC: null,
      ckETH: null,
      ckUSDC: null,
      ICP: null,
    },
  };
  
  const ledgerReducer = (state = initialState, action) => {
    switch (action.type) {
      case 'SET_LEDGER_ACTORS':
        return {
          ...state,
          ledgerActors: action.payload,
        };
      default:
        return state;
    }
  };
  
  export default ledgerReducer;  // Default export
  