import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import Faucet from './Faucet'; // adjust the import path as needed
import * as utilityReducer from '../../redux/reducers/utilityReducer';

// Mock the required dependencies
jest.mock('../../utils/useAuthClient', () => ({
  useAuth: jest.fn()
}));

jest.mock('../../components/Common/Button', () => {
  return ({ title, onClickHandler }) => (
    <button onClick={onClickHandler} data-testid="mock-button">{title}</button>
  );
});

jest.mock('../../components/Dashboard/WalletModal', () => {
  return () => <div data-testid="wallet-modal">Wallet Modal</div>;
});

jest.mock('../../components/Faucet/FaucetDetails', () => {
  return () => <div data-testid="faucet-details">Faucet Details</div>;
});

// Mock the SVG import
jest.mock('../../../public/element/Elements.svg', () => 'mock-element-path');

// Setup mock store
const mockStore = configureStore([]);

describe('Faucet Component', () => {
  let store;
  
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Mock the utility reducer action
    jest.spyOn(utilityReducer, 'setWalletModalOpen').mockImplementation(
      (payload) => ({ type: 'utility/setWalletModalOpen', payload })
    );
  });

  const renderComponent = (isAuthenticated = false, isWalletModalOpen = false, isSwitchingWallet = false) => {
    // Create store with initial state
    store = mockStore({
      utility: {
        isWalletModalOpen,
        isSwitchingWallet
      }
    });

    // Mock the useAuth hook
    require('../../utils/useAuthClient').useAuth.mockReturnValue({
      isAuthenticated
    });

    return render(
      <Provider store={store}>
        <Faucet />
      </Provider>
    );
  };

  test('renders the faucet information text', () => {
    renderComponent();
    expect(screen.getByText(/With our testnet Faucet you can receive free assets/i)).toBeInTheDocument();
  });

  test('displays connect wallet message when not authenticated', () => {
    renderComponent(false);
    expect(screen.getByText(/Please, connect your wallet/i)).toBeInTheDocument();
    expect(screen.getByText(/Please connect your wallet to get free testnet assets/i)).toBeInTheDocument();
    expect(screen.getByTestId('mock-button')).toHaveTextContent('Connect Wallet');
  });

  test('renders FaucetDetails when user is authenticated', () => {
    renderComponent(true);
    expect(screen.getByTestId('faucet-details')).toBeInTheDocument();
    expect(screen.queryByText(/Please, connect your wallet/i)).not.toBeInTheDocument();
  });

  test('wallet modal is shown when wallet is not connected', () => {
    renderComponent(false, true);
    expect(screen.getByTestId('wallet-modal')).toBeInTheDocument();
  });

  test('wallet modal is shown when switching wallets', () => {
    renderComponent(true, false, true);
    expect(screen.getByTestId('wallet-modal')).toBeInTheDocument();
  });

  test('clicking connect wallet button dispatches setWalletModalOpen', () => {
    renderComponent(false, false);
    
    fireEvent.click(screen.getByTestId('mock-button'));
    
    expect(utilityReducer.setWalletModalOpen).toHaveBeenCalledWith({
      isOpen: true,
      isSwitching: false
    });
    
    // Check the action was dispatched
    const actions = store.getActions();
    expect(actions).toEqual([
      { type: 'utility/setWalletModalOpen', payload: { isOpen: true, isSwitching: false } }
    ]);
  });

  test('renders nothing when isTestnetMode is false', () => {
    renderComponent(false);
    
    // Get the component instance to manipulate state
    const setIsTestnetMode = React.useState(true)[1];
    
    // Update the state to false
    React.useState = jest.fn().mockReturnValue([false, setIsTestnetMode]);
    
    // Re-render with new state
    const { container } = renderComponent(false);
    
    // Check that the component is empty
    expect(container.firstChild).toBeNull();
  });

  test('displays loader while FaucetDetails is loading', async () => {
    // Mock Suspense to show the fallback
    jest.mock('react', () => {
      const originalReact = jest.requireActual('react');
      return {
        ...originalReact,
        Suspense: ({ fallback }) => fallback
      };
    });
    
    renderComponent(true);
    expect(screen.getByTestId('mini-loader')).toBeInTheDocument();
  });
});