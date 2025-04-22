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
    
    expect(screen.getByText('All done!')).toBeInTheDocument();
    expect(screen.getByText('You received 0.00025 ckBTC')).toBeInTheDocument();
    
    expect(screen.getByText('Add dToken to wallet to track your balance.')).toBeInTheDocument();
    
    expect(screen.getByText('Add to wallet')).toBeInTheDocument();
    expect(screen.getByText('Close Now')).toBeInTheDocument();
  });

  test('calls handleModalOpen when close button is clicked', () => {
    render(<PaymentDone {...defaultProps} />);
    
    const closeButton = screen.getByRole('button', { name: '' });
    fireEvent.click(closeButton);
    
    expect(defaultProps.handleModalOpen).toHaveBeenCalledTimes(1);
  });

  test('calls handleModalOpen when Close Now button is clicked', () => {
    render(<PaymentDone {...defaultProps} />);
    
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
    
    expect(screen.getByText('You received 0.00025 ICP')).toBeInTheDocument();
  });

  test('Add to wallet button is rendered correctly', () => {
    render(<PaymentDone {...defaultProps} />);
    
    const addToWalletButton = screen.getByRole('button', { name: /Add to wallet/i });
    
    expect(addToWalletButton).toHaveClass('my-2');
    expect(addToWalletButton).toHaveClass('bg-[#AEADCB]');
    expect(addToWalletButton).toHaveClass('rounded-md');
  });
});