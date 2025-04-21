import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PaymentDone from '../../components/Dashboard/DashboardPopup/PaymentDone';

describe('PaymentDone Component', () => {
  const defaultProps = {
    asset: 'ckBTC',
    isModalOpen: true,
    handleModalOpen: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders PaymentDone component with correct content', () => {
    render(<PaymentDone {...defaultProps} />);
    
    // Check for success message
    expect(screen.getByText('All done!')).toBeInTheDocument();
    expect(screen.getByText('You received 0.00025 ckBTC')).toBeInTheDocument();
    
    // Check for wallet instruction
    expect(screen.getByText('Add dToken to wallet to track your balance.')).toBeInTheDocument();
    
    // Check for button texts
    expect(screen.getByText('Add to wallet')).toBeInTheDocument();
    expect(screen.getByText('Close Now')).toBeInTheDocument();
  });

  test('calls handleModalOpen when close button is clicked', () => {
    render(<PaymentDone {...defaultProps} />);
    
    // Find and click the X button (close button)
    const closeButton = screen.getByRole('button', { name: '' });
    fireEvent.click(closeButton);
    
    expect(defaultProps.handleModalOpen).toHaveBeenCalledTimes(1);
  });

  test('calls handleModalOpen when Close Now button is clicked', () => {
    render(<PaymentDone {...defaultProps} />);
    
    // Find and click the "Close Now" button
    const closeNowButton = screen.getByText('Close Now');
    fireEvent.click(closeNowButton);
    
    expect(defaultProps.handleModalOpen).toHaveBeenCalledTimes(1);
  });

  test('displays the correct asset name in the received message', () => {
    const customProps = {
      ...defaultProps,
      asset: 'ICP',
    };
    
    render(<PaymentDone {...customProps} />);
    
    // Check if the asset name is displayed correctly
    expect(screen.getByText('You received 0.00025 ICP')).toBeInTheDocument();
  });

  test('Add to wallet button is rendered correctly', () => {
    render(<PaymentDone {...defaultProps} />);
    
    // Find the "Add to wallet" button directly by role and name
    const addToWalletButton = screen.getByRole('button', { name: /Add to wallet/i });
    
    // Check if the button has the correct classes
    expect(addToWalletButton).toHaveClass('my-2');
    expect(addToWalletButton).toHaveClass('bg-[#AEADCB]');
    expect(addToWalletButton).toHaveClass('rounded-md');
  });
});