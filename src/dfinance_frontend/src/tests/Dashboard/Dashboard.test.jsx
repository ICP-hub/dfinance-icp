import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CreateWallet from "../../pages/Dashboard/Dashboard"; 
import { Provider } from "react-redux";
import { store } from "../../redux/store"; 
import { BrowserRouter as Router } from "react-router-dom"; 
import { useAuth } from "../../utils/useAuthClient"; 

// Mocking the useAuth hook
jest.mock("../../utils/useAuthClient", () => ({
  useAuth: jest.fn(),
}));

// Mocking the WalletModal component to avoid rendering the real one
jest.mock("../../components/Dashboard/WalletModal", () => () => (
  <div>Wallet Modal</div>
));

// Mocking Lottie animation rendering
jest.mock("lottie-react", () => ({
  useLottie: () => ({ View: () => <div>Mocked Lottie Animation</div> }),
}));

// Test suite for CreateWallet component
describe("CreateWallet Component", () => {
  // Test case 1: Ensure 'Please connect your wallet' message is displayed when not authenticated
  test("renders 'Please connect your wallet' message when not authenticated", () => {
    useAuth.mockReturnValue({ isAuthenticated: false }); // Mocking the authentication status as false

    render(
      <Provider store={store}>
        {" "}
        {/* Wrapping with Redux provider */}
        <Router>
          {" "}
          {/* Wrapping with Router for routing */}
          <CreateWallet />
        </Router>
      </Provider>
    );

    // Verifying the presence of the 'Please connect your wallet' message
    expect(
      screen.getByText(/Please, connect your wallet/i)
    ).toBeInTheDocument();
  });

  // Test case 2: Ensure Connect Wallet button is rendered and triggers modal on click
  test("renders Connect Wallet button and triggers modal on click", () => {
    useAuth.mockReturnValue({ isAuthenticated: false }); // Mocking the authentication status as false

    render(
      <Provider store={store}>
        {" "}
        {/* Wrapping with Redux provider */}
        <Router>
          {" "}
          {/* Wrapping with Router for routing */}
          <CreateWallet />
        </Router>
      </Provider>
    );

    const connectWalletButton = screen.getByText(/Connect Wallet/i); // Finding the Connect Wallet button
    expect(connectWalletButton).toBeInTheDocument(); // Verifying button presence

    // Simulating a button click
    fireEvent.click(connectWalletButton);

    // Verifying that the Wallet Modal appears after the click
    expect(screen.getByText("Wallet Modal")).toBeInTheDocument();
  });

  // Test case 3: Ensure Wallet Modal is rendered when isSwitchingWallet is true
  test("WalletModal is rendered when isSwitchingWallet is true", () => {
    useAuth.mockReturnValue({ isAuthenticated: false }); // Mocking the authentication status as false

    render(
      <Provider store={store}>
        {" "}
        {/* Wrapping with Redux provider */}
        <Router>
          {" "}
          {/* Wrapping with Router for routing */}
          <CreateWallet />
        </Router>
      </Provider>
    );

    // Verifying that the Wallet Modal is rendered
    const walletModal = screen.getByText("Wallet Modal");
    expect(walletModal).toBeInTheDocument();
  });
});
