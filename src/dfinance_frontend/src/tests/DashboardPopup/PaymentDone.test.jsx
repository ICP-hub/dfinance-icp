import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import PaymentDone from "../../components/Dashboard/DashboardPopup/PaymentDone";

describe("PaymentDone Component", () => {
  // Default props to be used in the tests
  const defaultProps = {
    asset: "ckBTC", // Default asset type
    isModalOpen: true, // Modal open state
    handleModalOpen: jest.fn(), // Mocked modal open handler function
  };

  // Clear mocks before each test to ensure a clean test environment
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test case 1: Verifying that the PaymentDone component renders the correct content
  test("renders PaymentDone component with correct content", () => {
    render(<PaymentDone {...defaultProps} />); // Render the PaymentDone component with the default props

    // Verify that the key text elements are present
    expect(screen.getByText("All done!")).toBeInTheDocument();
    expect(screen.getByText("You received 0.00025 ckBTC")).toBeInTheDocument();
    expect(
      screen.getByText("Add dToken to wallet to track your balance.")
    ).toBeInTheDocument();
    expect(screen.getByText("Add to wallet")).toBeInTheDocument();
    expect(screen.getByText("Close Now")).toBeInTheDocument();
  });

  // Test case 2: Verifying that the handleModalOpen function is called when the close button is clicked
  test("calls handleModalOpen when close button is clicked", () => {
    render(<PaymentDone {...defaultProps} />); // Render the component

    // Find and click the close button
    const closeButton = screen.getByRole("button", { name: "" });
    fireEvent.click(closeButton);

    // Verify that the handleModalOpen function was called once when the close button was clicked
    expect(defaultProps.handleModalOpen).toHaveBeenCalledTimes(1);
  });

  // Test case 3: Verifying that the handleModalOpen function is called when the Close Now button is clicked
  test("calls handleModalOpen when Close Now button is clicked", () => {
    render(<PaymentDone {...defaultProps} />); // Render the component

    // Find and click the 'Close Now' button
    const closeNowButton = screen.getByText("Close Now");
    fireEvent.click(closeNowButton);

    // Verify that the handleModalOpen function was called once when the 'Close Now' button was clicked
    expect(defaultProps.handleModalOpen).toHaveBeenCalledTimes(1);
  });

  // Test case 4: Verifying that the correct asset name is displayed in the received message
  test("displays the correct asset name in the received message", () => {
    const customProps = {
      ...defaultProps,
      asset: "ICP", // Change the asset to 'ICP' for this test case
    };

    render(<PaymentDone {...customProps} />); // Render the component with custom props

    // Verify that the correct asset name ('ICP') is displayed in the received message
    expect(screen.getByText("You received 0.00025 ICP")).toBeInTheDocument();
  });

  // Test case 5: Verifying that the 'Add to wallet' button is rendered correctly with the correct classes
  test("Add to wallet button is rendered correctly", () => {
    render(<PaymentDone {...defaultProps} />); // Render the component

    // Find the 'Add to wallet' button
    const addToWalletButton = screen.getByRole("button", {
      name: /Add to wallet/i,
    });

    // Verify that the button has the correct CSS classes
    expect(addToWalletButton).toHaveClass("my-2"); // Check margin class
    expect(addToWalletButton).toHaveClass("bg-[#AEADCB]"); // Check background color class
    expect(addToWalletButton).toHaveClass("rounded-md"); // Check border radius class
  });
});
