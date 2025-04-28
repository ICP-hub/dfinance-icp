import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux"; // Redux provider for store integration
import { createStore } from "redux"; // To create a mock store for testing
import SupplyInfo from "../../components/Dashboard/DashboardPopup/SupplyInfo"; // Component to test
import { useParams } from "react-router-dom"; // Mocking useParams for routing behavior
import useFetchConversionRate from "../../components/customHooks/useFetchConversionRate"; // Mocking conversion rates

// Mocking react-router's useParams hook for routing functionality
jest.mock("react-router-dom", () => ({
  useParams: jest.fn(),
}));

// Mocking the useFetchConversionRate hook to return mock conversion rates
jest.mock("../../components/customHooks/useFetchConversionRate", () =>
  jest.fn()
);

// Mocking the CircularProgressbar component to simulate loading state in tests
jest.mock("../../components/Common/CircularProgressbar", () => ({
  __esModule: true,
  default: () => (
    <div data-testid="circular-progress">Mock Circular Progress</div>
  ),
}));

// Creating a mock Redux store for testing
const mockStore = createStore(
  (state = { dashboardUpdate: { refreshDashboardTrigger: true } }) => state
);

describe("SupplyInfo Component", () => {
  // Mock props to simulate data passed to the component
  const mockProps = {
    formatNumber: jest.fn((num) => num.toFixed(2)), // Mock function to format numbers
    supplyCap: 1000, // Mock supply cap value
    totalSupplied: 200, // Mock total supplied amount
    totalBorrowed: 150, // Mock total borrowed amount
    supplyRateAPR: 2.5, // Mock supply rate APR
    ltv: 75, // Mock loan-to-value ratio
    canBeCollateral: true, // Mock whether the asset can be used as collateral
    liquidationBonus: 10, // Mock liquidation bonus
    liquidationThreshold: 80, // Mock liquidation threshold
  };

  // Before each test, mock the return values for useParams and useFetchConversionRate hooks
  beforeEach(() => {
    useParams.mockReturnValue({ id: "ckBTC" }); // Simulating the 'ckBTC' id parameter in routing
    useFetchConversionRate.mockReturnValue({
      ckBTCUsdRate: 50000 * 1e8, // Mock conversion rate for ckBTC
      ckETHUsdRate: 3000 * 1e8, // Mock conversion rate for ckETH
      ckUSDCUsdRate: 1 * 1e8, // Mock conversion rate for ckUSDC
      ckICPUsdRate: 5 * 1e8, // Mock conversion rate for ckICP
      ckUSDTUsdRate: 1 * 1e8, // Mock conversion rate for ckUSDT
    });
  });

  // Test case 1: Verifying that the SupplyInfo component renders without crashing
  test("renders without crashing", () => {
    render(
      <Provider store={mockStore}>
        {" "}
        {/* Wrapping the component with the mock store */}
        <SupplyInfo {...mockProps} />
      </Provider>
    );
    // Verifying that key text elements are rendered
    expect(screen.getByText("Total Supplied")).toBeInTheDocument();
  });

  // Test case 2: Verifying that the total supplied and cap values are displayed correctly
  test("displays correct total supplied and cap values", () => {
    render(
      <Provider store={mockStore}>
        {" "}
        {/* Wrapping the component with the mock store */}
        <SupplyInfo {...mockProps} />
      </Provider>
    );

    // Verifying that the correct values for total supplied and supply cap are displayed
    expect(screen.getByText("200.00")).toBeInTheDocument(); // Total supplied should be 200.00
    expect(screen.getByText(/1000\.00/)).toBeInTheDocument(); // Supply cap should be 1000.00
  });

  // Test case 3: Verifying that the APY (Annual Percentage Yield) value is displayed correctly
  test("displays the correct APY value", () => {
    render(
      <Provider store={mockStore}>
        {" "}
        {/* Wrapping the component with the mock store */}
        <SupplyInfo {...mockProps} />
      </Provider>
    );
    // Verifying that the APY value (2.50%) is displayed correctly
    expect(screen.getByText("2.50%")).toBeInTheDocument();
  });

  // Test case 4: Verifying that the reserve factor is displayed correctly
  test("displays the correct reserve factor", () => {
    render(
      <Provider store={mockStore}>
        {" "}
        {/* Wrapping the component with the mock store */}
        <SupplyInfo {...mockProps} />
      </Provider>
    );
    // Verifying that the reserve factor value (10%) is displayed correctly
    expect(screen.getByText("10%")).toBeInTheDocument();
  });

  // Test case 5: Verifying that the liquidation threshold is displayed correctly
  test("displays the correct liquidation threshold", () => {
    render(
      <Provider store={mockStore}>
        {" "}
        {/* Wrapping the component with the mock store */}
        <SupplyInfo {...mockProps} />
      </Provider>
    );
    // Verifying that the liquidation threshold value (80%) is displayed correctly
    expect(screen.getByText("80%")).toBeInTheDocument();
  });

  // Test case 6: Verifying that the liquidation penalty is displayed correctly
  test("displays the correct liquidation penalty", () => {
    render(
      <Provider store={mockStore}>
        {" "}
        {/* Wrapping the component with the mock store */}
        <SupplyInfo {...mockProps} />
      </Provider>
    );
    // Verifying that the liquidation penalty value (10%) is displayed correctly
    expect(screen.getByText("10%")).toBeInTheDocument();
  });
});
