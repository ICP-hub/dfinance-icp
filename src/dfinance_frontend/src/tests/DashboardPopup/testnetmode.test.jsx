import React from "react";
import { render, screen, fireEvent } from "@testing-library/react"; // Import testing utilities
import TestnetModePopup from "../../components/Dashboard/DashboardPopup/Testnetmode"; // Component to test
import { ToastContainer } from "react-toastify"; // Toast notifications container
import "@testing-library/jest-dom/extend-expect"; // To extend Jest matchers for DOM elements

// Mocking react-toastify for controlling toast notifications during tests
jest.mock("react-toastify", () => ({
  ...jest.requireActual("react-toastify"),
  toast: {
    info: jest.fn(), // Mocking the info method of toast
    dismiss: jest.fn(), // Mocking the dismiss method of toast
  },
}));

describe("TestnetModePopup", () => {
  // Mock functions to simulate the behavior of props passed to TestnetModePopup
  const mockHandleTestnetModeToggle = jest.fn();
  const mockOnClose = jest.fn();

  // Setup for each test, rendering the component with mock props
  beforeEach(() => {
    render(
      <>
        <TestnetModePopup
          onClose={mockOnClose} // Passing mock function for onClose prop
          handleTestnetModeToggle={mockHandleTestnetModeToggle} // Passing mock function for handleTestnetModeToggle
        />
        <ToastContainer />{" "}
        {/* Rendering ToastContainer to handle toast notifications */}
      </>
    );
  });

  // Test case 1: Verifying that the close icon triggers the onClose function
  test("clicking the close icon triggers onClose", () => {
    // Finding and clicking the close icon
    fireEvent.click(screen.getByTestId("close-icon"));

    // Verifying that the onClose function is called once after clicking the close icon
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  // Test case 2: Verifying that clicking the background triggers the onClose function
  test("clicking the background triggers onClose", () => {
    // Finding and clicking the background (Testnet Mode text area)
    fireEvent.click(screen.getByText(/Testnet Mode is ON/i));

    // Verifying that the onClose function is called once after clicking the background
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
