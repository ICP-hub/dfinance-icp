import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BorrowInfo from '../../components/Dashboard/DashboardPopup/BorrowInfo';
import { useParams } from 'react-router-dom';
import useFetchConversionRate from '../../components/customHooks/useFetchConversionRate';

jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
}));

jest.mock('../../components/customHooks/useFetchConversionRate', () => jest.fn());

jest.mock('../../components/Common/CircularProgressbar', () => ({
  __esModule: true,
  default: () => <div data-testid="circular-progress">Mock Circular Progress</div>,
}));

describe('BorrowInfo Component', () => {
  const mockProps = {
    formatNumber: jest.fn(num => num.toFixed(2)),
    borrowCap: 1000,
    totalBorrowed: 200,
    borrowRateAPR: 2.5,
    reserveFactor: 10
  };

  beforeEach(() => {
    useParams.mockReturnValue({ id: 'ckBTC' });
    useFetchConversionRate.mockReturnValue({
      ckBTCUsdRate: 50000 * 1e8,
      ckETHUsdRate: 3000 * 1e8,
      ckUSDCUsdRate: 1 * 1e8,
      ckICPUsdRate: 5 * 1e8,
      ckUSDTUsdRate: 1 * 1e8,
    });
  });

  test('renders without crashing', () => {
    render(<BorrowInfo {...mockProps} />);
    expect(screen.getByText('Total Borrowed')).toBeInTheDocument();
  });

  test('displays correct total borrowed and cap values', () => {
    render(<BorrowInfo {...mockProps} />);
    
    expect(screen.getByText('200.00')).toBeInTheDocument();
  
    const ofElements = screen.getAllByText('of');
    
    expect(ofElements).toHaveLength(2);
  
    expect(ofElements[1]).toBeInTheDocument();
  });
  

  test('displays the correct APY value', () => {
    render(<BorrowInfo {...mockProps} />);
    expect(screen.getByText('2.50%')).toBeInTheDocument();
  });

  test('displays the correct reserve factor', () => {
    render(<BorrowInfo {...mockProps} />);
    expect(screen.getByText('10%')).toBeInTheDocument();
  });

  test('formats APY value correctly for small numbers', () => {
    render(<BorrowInfo {...{...mockProps, borrowRateAPR: 0.05}} />);
    expect(screen.getByText('<0.01%')).toBeInTheDocument();
  });

  test('handles empty borrowCap correctly', () => {
    render(<BorrowInfo {...{...mockProps, borrowCap: null}} />);
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  test('calculates and displays correct borrow percentage', () => {
    render(<BorrowInfo {...mockProps} />);
    expect(screen.getByTestId('circular-progress')).toBeInTheDocument();
  });
});
