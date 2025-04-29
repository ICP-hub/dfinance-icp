import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import RiskPopup from "../../components/Dashboard/DashboardPopup/RiskDetails";
import { Provider } from "react-redux";
import { createStore } from "redux";

// Mock reducer for the Redux store
const mockReducer = (state = { theme: { theme: "light" } }, action) => state;

// Creating a mock store with the mockReducer
const mockStore = createStore(mockReducer);

// Mock user account data with placeholder values
const mockUserAccountData = {
  Ok: [
    1000000000, // Example values for account data
    200000000,
    300000000,
    400000000,
    500000000,
  ],
};

describe("RiskPopup Component", () => {
  // Test case 1: Verifying that the liquidation threshold value is displayed correctly
  test("displays correct liquidation threshold value", () => {
    render(
      <Provider store={mockStore}>
        {" "}
        {/* Wrapping the component with the mock store */}
        <RiskPopup onClose={() => { }} userAccountData={mockUserAccountData} />
      </Provider>
    );

    // Searching for elements that display the liquidation threshold value (4.00 in this case)
    const liquidationThresholds = screen.getAllByText(/4.00/); // Text expected to be displayed in the component
    expect(liquidationThresholds.length).toBeGreaterThan(0); // Verifying that the value is found in the document
  });

  // Test case 2: Verifying that the onClose function is called when the close button is clicked
  test("calls onClose when clicking close button", () => {
    const onClose = jest.fn(); // Creating a mock function for onClose
    render(
      <Provider store={mockStore}>
        {" "}
        {/* Wrapping the component with the mock store */}
        <RiskPopup onClose={onClose} userAccountData={mockUserAccountData} />
      </Provider>
    );

    // Finding the close button by its role (button)
    const closeButton = screen.getByRole("button");

    // Simulating a click event on the close button
    fireEvent.click(closeButton);

    // Verifying that the onClose function is called exactly once
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
