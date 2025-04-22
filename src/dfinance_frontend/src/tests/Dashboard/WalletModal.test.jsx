import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import WalletModal from '../../components/Dashboard/WalletModal';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/useAuthClient';

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn()
}));

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn()
}));

jest.mock('../../utils/useAuthClient', () => ({
  useAuth: jest.fn()
}));

jest.mock('@mui/material', () => ({
  Modal: ({ children, open, onClose }) => (
    open ? <div data-testid="modal" onClick={onClose}>{children}</div> : null
  )
}));

jest.mock('../../../public/wallet/icp.png', () => 'icp-image-mock');
jest.mock('../../../public/wallet/nfid.png', () => 'nfid-image-mock');

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
    jest.clearAllMocks();
    
    useDispatch.mockReturnValue(mockDispatch);
    useNavigate.mockReturnValue(mockNavigate);
    
    useAuth.mockReturnValue({
      login: mockLogin,
      logout: mockLogout,
      isAuthenticated: false
    });
    
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn()
      },
      writable: true
    });
  });
  
  test('renders connect wallet modal when no wallet is connected', () => {
    useSelector.mockReturnValue({
      isWalletModalOpen: true,
      isSwitchingWallet: false,
      connectedWallet: null,
      isWalletCreated: false
    });
    
    render(<WalletModal />);
    
    expect(screen.getByText('Connect a wallet')).toBeInTheDocument();
    expect(screen.getByText('Internet Identity')).toBeInTheDocument();
    expect(screen.getByText('NFID')).toBeInTheDocument();
  });
  
  test('renders switch wallet modal when a wallet is connected', () => {
    useSelector.mockReturnValue({
      isWalletModalOpen: true,
      isSwitchingWallet: false,
      connectedWallet: 'ii',
      isWalletCreated: false
    });
    
    render(<WalletModal />);
    
    expect(screen.getByText('Switch wallet')).toBeInTheDocument();
    
    const walletText = screen.getByText('Internet Identity');
    expect(walletText).toBeInTheDocument();
    
    expect(screen.getByText('is connected')).toBeInTheDocument();
    
    const divElements = document.querySelectorAll('div.cursor-pointer');
    const iiOptionExists = Array.from(divElements).some(div => 
      div.textContent.includes('Internet Identity')
    );
    expect(iiOptionExists).toBe(false);
    
    expect(screen.getByText('NFID')).toBeInTheDocument();
  });
  
  test('does not render when modal is closed', () => {
    useSelector.mockReturnValue({
      isWalletModalOpen: false,
      isSwitchingWallet: false,
      connectedWallet: null,
      isWalletCreated: false
    });
    
    render(<WalletModal />);
    
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });
  
  test('calls switch wallet handler when in switching mode', async () => {
    useSelector.mockReturnValue({
      isWalletModalOpen: true,
      isSwitchingWallet: true, 
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
    
    expect(iiOption).toBeTruthy();
    fireEvent.click(iiOption);
    
    await Promise.resolve();
    
    expect(mockLogout).toHaveBeenCalled();
    
    expect(mockLogin).toHaveBeenCalled();
  });
  
  test('closes modal when user clicks outside', () => {
    useSelector.mockReturnValue({
      isWalletModalOpen: true,
      isSwitchingWallet: false,
      connectedWallet: null,
      isWalletCreated: false
    });
    
    render(<WalletModal />);
    
    const modal = screen.getByTestId('modal');
    fireEvent.click(modal);
    
    expect(mockDispatch).toHaveBeenCalled();
  });
  
  test('redirects to wallet details when wallet is created', () => {
    useSelector.mockReturnValue({
      isWalletModalOpen: true,
      isSwitchingWallet: false,
      connectedWallet: null,
      isWalletCreated: true
    });
    
    render(<WalletModal />);
    
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/wallet-details');
  });
  
  test('retrieves connected wallet from localStorage on mount', () => {
    window.localStorage.getItem.mockReturnValueOnce('ii');
    
    useSelector.mockReturnValue({
      isWalletModalOpen: true,
      isSwitchingWallet: false,
      connectedWallet: null,
      isWalletCreated: false
    });
    
    render(<WalletModal />);
    
    expect(window.localStorage.getItem).toHaveBeenCalledWith('connectedWallet');
    expect(mockDispatch).toHaveBeenCalled();
  });
  
  test('removes connectedWallet from localStorage when not authenticated', () => {
    useSelector.mockReturnValue({
      isWalletModalOpen: true,
      isSwitchingWallet: false,
      connectedWallet: 'ii',
      isWalletCreated: false
    });
    
    useAuth.mockReturnValue({
      login: mockLogin,
      logout: mockLogout,
      isAuthenticated: false
    });
    
    render(<WalletModal />);
    
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('connectedWallet');
  });
  
  test('displays correct wallet name when connected', () => {
    useSelector.mockReturnValue({
      isWalletModalOpen: true,
      isSwitchingWallet: false,
      connectedWallet: 'nfid',
      isWalletCreated: false
    });
    
    render(<WalletModal />);
    
    const connectedWalletTexts = screen.getAllByText('NFID');
    expect(connectedWalletTexts.length).toBeGreaterThan(0);
    expect(screen.getByText('is connected')).toBeInTheDocument();
  });
});