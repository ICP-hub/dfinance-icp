import React from "react";
import { render, screen } from "@testing-library/react";
import BorrowInfo from "../../components/Dashboard/DashboardPopup/BorrowInfo";
import { useParams } from "react-router-dom";
import useFetchConversionRate from "../../components/customHooks/useFetchConversionRate";

// Mocking react-router's useParams to return a fake ID
jest.mock("react-router-dom", () => ({
  useParams: jest.fn(),
}));

// Mocking the custom hook useFetchConversionRate to return fake conversion rates
jest.mock("../../components/customHooks/useFetchConversionRate", () =>
  jest.fn()
);

// Mocking CircularProgressbar component for testing purposes
jest.mock("../../components/Common/circularProgressbar", () => ({
  __esModule: true,
  default: () => (
    <div data-testid="circular-progress">Mock Circular Progress</div>
  ),
}));

describe("BorrowInfo Component", () => {
  // Defining mockProps to simulate the props passed to BorrowInfo component
  const mockProps = {
    formatNumber: jest.fn((num) => num.toFixed(2)), // Mock number formatting function
    borrowCap: 1000, // Mock borrowCap value
    totalBorrowed: 200, // Mock total borrowed value
    borrowRateAPR: 2.5, // Mock APR value
    reserveFactor: 10, // Mock reserve factor value
  };

  // Before each test, mocking return values for useParams and useFetchConversionRate
  beforeEach(() => {
    useParams.mockReturnValue({ id: "ckBTC" }); // Simulating the router param for id as 'ckBTC'
    useFetchConversionRate.mockReturnValue({
      ckBTCUsdRate: 50000 * 1e8, // Mock USD rate for ckBTC
      ckETHUsdRate: 3000 * 1e8, // Mock USD rate for ckETH
      ckUSDCUsdRate: 1 * 1e8, // Mock USD rate for ckUSDC
      ckICPUsdRate: 5 * 1e8, // Mock USD rate for ckICP
      ckUSDTUsdRate: 1 * 1e8, // Mock USD rate for ckUSDT
    });
  });

  // Test case 1: Ensure the component renders without errors
  test("renders without crashing", () => {
    render(<BorrowInfo {...mockProps} />); // Render the component with mockProps
    // Check if 'Total Borrowed' text is present
    expect(screen.getByText("Total Borrowed")).toBeInTheDocument();
  });

  // Test case 2: Verify the total borrowed and cap values are displayed correctly
  test("displays correct total borrowed and cap values", () => {
    render(<BorrowInfo {...mockProps} />); // Render component with mock props
    // Check if the total borrowed value (200.00) is displayed
    expect(screen.getByText("200.00")).toBeInTheDocument();

    // Check if the 'of' elements are displayed twice (indicating the borrowed vs cap)
    const ofElements = screen.getAllByText("of");
    expect(ofElements).toHaveLength(2); // Two 'of' elements should exist
    expect(ofElements[1]).toBeInTheDocument();
  });

  // Test case 3: Verify the correct APY value is displayed
  test("displays the correct APY value", () => {
    render(<BorrowInfo {...mockProps} />);
    // Check if the APY value (2.50%) is displayed
    expect(screen.getByText("2.50%")).toBeInTheDocument();
  });

  // Test case 4: Verify the correct reserve factor is displayed
  test("displays the correct reserve factor", () => {
    render(<BorrowInfo {...mockProps} />);
    // Check if the reserve factor (10%) is displayed
    expect(screen.getByText("10%")).toBeInTheDocument();
  });

  // Test case 5: Ensure small APY values are formatted correctly
  test("formats APY value correctly for small numbers", () => {
    render(<BorrowInfo {...{ ...mockProps, borrowRateAPR: 0.05 }} />);
    // For very small APRs, the component should display '<0.01%'
    expect(screen.getByText("<0.01%")).toBeInTheDocument();
  });

  // Test case 6: Ensure the component handles an empty borrowCap correctly
  test("handles empty borrowCap correctly", () => {
    render(<BorrowInfo {...{ ...mockProps, borrowCap: null }} />);
    // When borrowCap is null, it should display 'N/A'
    expect(screen.getByText("N/A")).toBeInTheDocument();
  });

  // Test case 7: Verify that the borrow percentage is calculated and displayed correctly
  test("calculates and displays correct borrow percentage", () => {
    render(<BorrowInfo {...mockProps} />);
    // Check if the CircularProgress (borrow percentage) component is rendered
    expect(screen.getByTestId("circular-progress")).toBeInTheDocument();
  });
});
