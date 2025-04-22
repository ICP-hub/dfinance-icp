import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import WalletModal from '../../components/Dashboard/WalletModal'; // Component to test
import { useDispatch, useSelector } from 'react-redux'; // Redux hooks
import { useNavigate } from 'react-router-dom'; // To mock navigation
import { useAuth } from '../../utils/useAuthClient'; // To mock authentication logic

// Mocking necessary imports for the test environment
jest.mock('react-redux', () => ({
  useDispatch: jest.fn(), // Mock useDispatch hook
  useSelector: jest.fn() // Mock useSelector hook
}));

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn() // Mock useNavigate hook
}));

jest.mock('../../utils/useAuthClient', () => ({
  useAuth: jest.fn() // Mock useAuth hook
}));

// Mocking MUI Modal component for testing
jest.mock('@mui/material', () => ({
  Modal: ({ children, open, onClose }) => (
    open ? <div data-testid="modal" onClick={onClose}>{children}</div> : null
  )
}));

// Mock wallet images for testing
jest.mock('../../../public/wallet/icp.png', () => 'icp-image-mock');
jest.mock('../../../public/wallet/nfid.png', () => 'nfid-image-mock');

// Mocking Redux actions for utilityReducer
jest.mock('../../redux/reducers/utilityReducer', () => ({
  setIsWalletConnected: jest.fn(() => ({ type: 'utility/setIsWalletConnected' })),
  setWalletModalOpen: jest.fn(() => ({ type: 'utility/setWalletModalOpen' })),
  setConnectedWallet: jest.fn((wallet) => ({ type: 'utility/setConnectedWallet', payload: wallet }))
}));

describe('WalletModal Component', () => {
  const mockDispatch = jest.fn();
  const mockNavigate = jest.fn();
  const mockLogin = jest.fn();
  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks(); // Clear mocks before each test

    useDispatch.mockReturnValue(mockDispatch); // Mock dispatch function
    useNavigate.mockReturnValue(mockNavigate); // Mock navigate function

    useAuth.mockReturnValue({
      login: mockLogin, // Mock login function
      logout: mockLogout, // Mock logout function
      isAuthenticated: false // Mock authentication status
    });

    // Mock localStorage methods
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn()
      },
      writable: true
    });
  });

  // Test case 1: Ensure modal displays 'Connect a wallet' when no wallet is connected
  test('renders connect wallet modal when no wallet is connected', () => {
    useSelector.mockReturnValue({
      isWalletModalOpen: true, // Modal should be open
      isSwitchingWallet: false, // Not in switching mode
      connectedWallet: null, // No wallet connected
      isWalletCreated: false // No wallet created
    });

    render(<WalletModal />);

    // Check if modal is displayed with relevant text
    expect(screen.getByText('Connect a wallet')).toBeInTheDocument();
    expect(screen.getByText('Internet Identity')).toBeInTheDocument();
    expect(screen.getByText('NFID')).toBeInTheDocument();
  });

  // Test case 2: Ensure modal displays 'Switch wallet' when a wallet is connected
  test('renders switch wallet modal when a wallet is connected', () => {
    useSelector.mockReturnValue({
      isWalletModalOpen: true,
      isSwitchingWallet: false,
      connectedWallet: 'ii', // 'ii' wallet is connected
      isWalletCreated: false
    });

    render(<WalletModal />);

    // Verify the modal has the correct text when a wallet is connected
    expect(screen.getByText('Switch wallet')).toBeInTheDocument();
    expect(screen.getByText('Internet Identity')).toBeInTheDocument();
    expect(screen.getByText('is connected')).toBeInTheDocument();

    // Ensure that 'Internet Identity' option is not clickable
    const divElements = document.querySelectorAll('div.cursor-pointer');
    const iiOptionExists = Array.from(divElements).some(div =>
      div.textContent.includes('Internet Identity')
    );
    expect(iiOptionExists).toBe(false);

    expect(screen.getByText('NFID')).toBeInTheDocument();
  });

  // Test case 3: Ensure modal does not render when closed
  test('does not render when modal is closed', () => {
    useSelector.mockReturnValue({
      isWalletModalOpen: false, // Modal should be closed
      isSwitchingWallet: false,
      connectedWallet: null,
      isWalletCreated: false
    });

    render(<WalletModal />);

    // Verify that modal is not rendered
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  // Test case 4: Test if the wallet switch handler is called when switching mode
  test('calls switch wallet handler when in switching mode', async () => {
    useSelector.mockReturnValue({
      isWalletModalOpen: true,
      isSwitchingWallet: true, // Switching wallet is enabled
      connectedWallet: 'nfid',
      isWalletCreated: false
    });

    mockLogout.mockResolvedValue(undefined);
    mockLogin.mockResolvedValue(undefined);

    const { container } = render(<WalletModal />);

    const divElements = container.querySelectorAll('div.cursor-pointer');
    const iiOption = Array.from(divElements).find(el =>
      el.textContent.includes('Internet Identity')
    );

    // Verify that 'Internet Identity' option exists and click on it
    expect(iiOption).toBeTruthy();
    fireEvent.click(iiOption);

    await Promise.resolve();

    // Check that logout and login functions are called
    expect(mockLogout).toHaveBeenCalled();
    expect(mockLogin).toHaveBeenCalled();
  });

  // Test case 5: Ensure modal closes when clicking outside the modal
  test('closes modal when user clicks outside', () => {
    useSelector.mockReturnValue({
      isWalletModalOpen: true,
      isSwitchingWallet: false,
      connectedWallet: null,
      isWalletCreated: false
    });

    render(<WalletModal />);

    // Simulate clicking outside the modal (backdrop)
    const modal = screen.getByTestId('modal');
    fireEvent.click(modal);

    // Check that dispatch is called to close the modal
    expect(mockDispatch).toHaveBeenCalled();
  });

  // Test case 6: Ensure redirection happens when wallet is created
  test('redirects to wallet details when wallet is created', () => {
    useSelector.mockReturnValue({
      isWalletModalOpen: true,
      isSwitchingWallet: false,
      connectedWallet: null,
      isWalletCreated: true // Wallet is created
    });

    render(<WalletModal />);

    // Check that navigation to '/dashboard/wallet-details' happens
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/wallet-details');
  });

  // Test case 7: Ensure connected wallet is retrieved from localStorage on mount
  test('retrieves connected wallet from localStorage on mount', () => {
    window.localStorage.getItem.mockReturnValueOnce('ii'); // Simulate 'ii' in localStorage

    useSelector.mockReturnValue({
      isWalletModalOpen: true,
      isSwitchingWallet: false,
      connectedWallet: null,
      isWalletCreated: false
    });

    render(<WalletModal />);

    // Verify that localStorage is checked for the connected wallet
    expect(window.localStorage.getItem).toHaveBeenCalledWith('connectedWallet');
    expect(mockDispatch).toHaveBeenCalled();
  });

  // Test case 8: Ensure connected wallet is removed from localStorage when not authenticated
  test('removes connectedWallet from localStorage when not authenticated', () => {
    useSelector.mockReturnValue({
      isWalletModalOpen: true,
      isSwitchingWallet: false,
      connectedWallet: 'ii', // 'ii' is the connected wallet
      isWalletCreated: false
    });

    useAuth.mockReturnValue({
      login: mockLogin,
      logout: mockLogout,
      isAuthenticated: false // User is not authenticated
    });

    render(<WalletModal />);

    // Check that connected wallet is removed from localStorage
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('connectedWallet');
  });

  // Test case 9: Ensure correct wallet name is displayed when connected
  test('displays correct wallet name when connected', () => {
    useSelector.mockReturnValue({
      isWalletModalOpen: true,
      isSwitchingWallet: false,
      connectedWallet: 'nfid', // 'nfid' is connected wallet
      isWalletCreated: false
    });

    render(<WalletModal />);

    // Verify that 'NFID' text is displayed for the connected wallet
    const connectedWalletTexts = screen.getAllByText('NFID');
    expect(connectedWalletTexts.length).toBeGreaterThan(0);
    expect(screen.getByText('is connected')).toBeInTheDocument();
  });
});
