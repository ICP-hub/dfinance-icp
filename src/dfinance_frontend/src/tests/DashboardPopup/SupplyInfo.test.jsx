import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux'; // You can also use `configureStore` if you're using @reduxjs/toolkit
import SupplyInfo from '../../components/Dashboard/DashboardPopup/SupplyInfo';
import { useParams } from 'react-router-dom';
import useFetchConversionRate from '../../components/customHooks/useFetchConversionRate';
// Mock the dependencies
jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
}));

jest.mock('../../components/customHooks/useFetchConversionRate', () => jest.fn());

jest.mock('../../components/Common/CircularProgressbar', () => ({
  __esModule: true,
  default: () => <div data-testid="circular-progress">Mock Circular Progress</div>,
}));

// Create a mock store
const mockStore = createStore((state = { dashboardUpdate: { refreshDashboardTrigger: true } }) => state);

describe('SupplyInfo Component', () => {
  const mockProps = {
    formatNumber: jest.fn(num => num.toFixed(2)),
    supplyCap: 1000,
    totalSupplied: 200,
    totalBorrowed: 150,
    supplyRateAPR: 2.5,
    ltv: 75,
    canBeCollateral: true,
    liquidationBonus: 10,
    liquidationThreshold: 80,
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
    render(
      <Provider store={mockStore}>
        <SupplyInfo {...mockProps} />
      </Provider>
    );
    expect(screen.getByText('Total Supplied')).toBeInTheDocument();
  });

  test('displays correct total supplied and cap values', () => {
    render(
      <Provider store={mockStore}>
        <SupplyInfo {...mockProps} />
      </Provider>
    );
  
    // Check if the '200.00' (total supplied) is in the document
    expect(screen.getByText('200.00')).toBeInTheDocument();
    
    // Use a regular expression to handle the text for '1000.00' in case it's split across multiple elements
    expect(screen.getByText(/1000\.00/)).toBeInTheDocument();
  });
  

  test('displays the correct APY value', () => {
    render(
      <Provider store={mockStore}>
        <SupplyInfo {...mockProps} />
      </Provider>
    );
    expect(screen.getByText('2.50%')).toBeInTheDocument();
  });

  test('displays the correct reserve factor', () => {
    render(
      <Provider store={mockStore}>
        <SupplyInfo {...mockProps} />
      </Provider>
    );
    expect(screen.getByText('10%')).toBeInTheDocument();
  });

  test('displays the correct liquidation threshold', () => {
    render(
      <Provider store={mockStore}>
        <SupplyInfo {...mockProps} />
      </Provider>
    );
    expect(screen.getByText('80%')).toBeInTheDocument();
  });

  test('displays the correct liquidation penalty', () => {
    render(
      <Provider store={mockStore}>
        <SupplyInfo {...mockProps} />
      </Provider>
    );
    expect(screen.getByText('10%')).toBeInTheDocument();
  });

  

 
});
