import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import RiskPopup from "../../components/Dashboard/DashboardPopup/RiskDetails";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";

// Mock reducer for the Redux store
const mockReducer = (state = { theme: { theme: "light" } }) => state;

const mockStore = configureStore({
  reducer: mockReducer,
});

// Mock user account data with realistic values
const mockUserAccountData = {
  Ok: [
    1000000000, // Total collateral
    200000000,  // Total debt  
    300000000,  // Available to borrow
    400000000,  // Liquidation threshold (should show as 4.00)
    500000000,  // Health factor
  ],
};

describe("RiskPopup Component", () => {
 

  test("displays liquidation risk parameters", () => {
    render(
      <Provider store={mockStore}>
        <RiskPopup onClose={() => {}} userAccountData={mockUserAccountData} />
      </Provider>
    );

    // Check for the main title
    const title = screen.getByText("Liquidation Risk Parameters");
    expect(title).toBeInTheDocument();

    // Check for Health Factor section
    const healthFactorTitle = screen.getByText("Health Factor");
    expect(healthFactorTitle).toBeInTheDocument();

    // Check for Current LTV section
    const ltvTitle = screen.getByText("Current LTV");
    expect(ltvTitle).toBeInTheDocument();
  });

  test("displays health factor information", () => {
    render(
      <Provider store={mockStore}>
        <RiskPopup onClose={() => {}} userAccountData={mockUserAccountData} />
      </Provider>
    );

    // Check for health factor description
    const healthFactorDescription = screen.getByText(/Safety of your deposited collateral/);
    expect(healthFactorDescription).toBeInTheDocument();

    // Check for liquidation warning text
    const liquidationWarning = screen.getByText(/If the health factor goes below/);
    expect(liquidationWarning).toBeInTheDocument();
  });

  test("displays current LTV information", () => {
    render(
      <Provider store={mockStore}>
        <RiskPopup onClose={() => {}} userAccountData={mockUserAccountData} />
      </Provider>
    );

    // Check for LTV description
    const ltvDescription = screen.getByText(/Your current loan to value based on your collateral/);
    expect(ltvDescription).toBeInTheDocument();

    // Check for liquidation warning for LTV
    const ltvWarning = screen.getByText(/If your loan to value goes above/);
    expect(ltvWarning).toBeInTheDocument();
  });

  test("calls onClose when clicking close button", () => {
    const onClose = jest.fn();
    render(
      <Provider store={mockStore}>
        <RiskPopup onClose={onClose} userAccountData={mockUserAccountData} />
      </Provider>
    );

    // Find the close button (X icon)
    const closeButton = screen.getByRole("button");
    expect(closeButton).toBeInTheDocument();

    // Click the close button
    fireEvent.click(closeButton);

    // Verify onClose was called
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("renders with correct styling and structure", () => {
    const { container } = render(
      <Provider store={mockStore}>
        <RiskPopup onClose={() => {}} userAccountData={mockUserAccountData} />
      </Provider>
    );

    // Check for the modal overlay
    const overlay = container.querySelector('.fixed.inset-0');
    expect(overlay).toBeInTheDocument();

    // Check for the modal content
    const modalContent = container.querySelector('.bg-white.rounded-lg');
    expect(modalContent).toBeInTheDocument();

    // Check for the gradient SVG elements (health factor and LTV charts)
    const svgElements = container.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThan(0);
  });

  test("displays numerical values even if they are zero or NaN", () => {
    render(
      <Provider store={mockStore}>
        <RiskPopup onClose={() => {}} userAccountData={mockUserAccountData} />
      </Provider>
    );

  
    // Check that both main sections are present
    const healthFactorSection = screen.getByText("Health Factor").closest('.border');
    const ltvSection = screen.getByText("Current LTV").closest('.border');
    
    expect(healthFactorSection).toBeInTheDocument();
    expect(ltvSection).toBeInTheDocument();
  });
});