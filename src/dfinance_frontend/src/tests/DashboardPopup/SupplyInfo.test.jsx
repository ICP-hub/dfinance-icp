import React from "react";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import SupplyInfo from "../../components/Dashboard/DashboardPopup/SupplyInfo";
import { useParams } from "react-router-dom";
import useFetchConversionRate from "../../components/CustomHooks/useFetchConversionRate";
import { SCALING_FACTOR } from '../../utils/constants';
// Mocking react-router's useParams hook for routing functionality
jest.mock("react-router-dom", () => ({
  useParams: jest.fn(),
}));

// Mocking the useFetchConversionRate hook to return mock conversion rates
jest.mock("../../components/customHooks/useFetchConversionRate", () =>
  jest.fn()
);

// Mocking the CircularProgressbar component to simulate loading state in tests
jest.mock("../../components/Common/circularProgressbar", () => ({
  __esModule: true,
  default: () => (
    <div data-testid="circular-progress">Mock Circular Progress</div>
  ),
}));

const mockReducer = (state = { dashboardUpdate: { refreshDashboardTrigger: true } }) => state;
// Creating a mock Redux store for testing
const mockStore = configureStore({
  reducer: mockReducer
});


describe("SupplyInfo Component", () => {
  // Mock props to simulate data passed to the component
  const mockProps = {
    formatNumber: jest.fn((num) => num.toFixed(2)), 
    supplyCap: 1000, 
    totalSupplied: 200, 
    totalBorrowed: 150, 
    supplyRateAPR: 2.5, 
    ltv: 75,
    canBeCollateral: true, 
    liquidationBonus: 10, 
    liquidationThreshold: 80, 
  };

  // Before each test, mock the return values for useParams and useFetchConversionRate hooks
  beforeEach(() => {
    useParams.mockReturnValue({ id: "ckBTC" }); 
    useFetchConversionRate.mockReturnValue({
      ckBTCUsdRate: 50000 * SCALING_FACTOR, 
      ckETHUsdRate: 3000 * SCALING_FACTOR, 
      ckUSDCUsdRate: 1 * SCALING_FACTOR, 
      ckICPUsdRate: 5 * SCALING_FACTOR, 
      ckUSDTUsdRate: 1 * SCALING_FACTOR, 
    });
  });

  // Test case 1: Verifying that the SupplyInfo component renders without crashing
  test("renders without crashing", () => {
    render(
      <Provider store={mockStore}>
        {" "}
        <SupplyInfo {...mockProps} />
      </Provider>
    );
   
    expect(screen.getByText("Total Supplied")).toBeInTheDocument();
  });

  // Test case 2: Verifying that the total supplied and cap values are displayed correctly
  test("displays correct total supplied and cap values", () => {
    render(
      <Provider store={mockStore}>
        {" "}
        <SupplyInfo {...mockProps} />
      </Provider>
    );

    
    expect(screen.getByText("200.00")).toBeInTheDocument(); // Total supplied should be 200.00
    expect(screen.getByText(/1000\.00/)).toBeInTheDocument(); // Supply cap should be 1000.00
  });

  // Test case 3: Verifying that the APY (Annual Percentage Yield) value is displayed correctly
  test("displays the correct APY value", () => {
    render(
      <Provider store={mockStore}>
        {" "}
        <SupplyInfo {...mockProps} />
      </Provider>
    );
    
    expect(screen.getByText("2.50%")).toBeInTheDocument();
  });

  // Test case 4: Verifying that the reserve factor is displayed correctly
  test("displays the correct reserve factor", () => {
    render(
      <Provider store={mockStore}>
        {" "}
        <SupplyInfo {...mockProps} />
      </Provider>
    );
    expect(screen.getByText("10%")).toBeInTheDocument();
  });

  // Test case 5: Verifying that the liquidation threshold is displayed correctly
  test("displays the correct liquidation threshold", () => {
    render(
      <Provider store={mockStore}>
        {" "}
        <SupplyInfo {...mockProps} />
      </Provider>
    );
    expect(screen.getByText("80%")).toBeInTheDocument();
  });

  // Test case 6: Verifying that the liquidation penalty is displayed correctly
  test("displays the correct liquidation penalty", () => {
    render(
      <Provider store={mockStore}>
        {" "}
        <SupplyInfo {...mockProps} />
      </Provider>
    );
    expect(screen.getByText("10%")).toBeInTheDocument();
  });
});
