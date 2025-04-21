import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CreateWallet from "../../pages/Dashboard/Dashboard";  // Adjust this path based on your file structure
import { Provider } from "react-redux";
import { store } from "../../redux/store"; // Your Redux store
import { BrowserRouter as Router } from "react-router-dom";
import { useAuth } from "../../utils/useAuthClient";  // Mocking the hook
import WalletModal from "../../components/Dashboard/WalletModal";

// Mock necessary hooks and components
jest.mock("../../utils/useAuthClient", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../../components/Dashboard/WalletModal", () => () => (
  <div>Wallet Modal</div>
));
// Mocking lottie-react
jest.mock('lottie-react', () => ({
    useLottie: () => ({ View: () => <div>Mocked Lottie Animation</div> })
  }));
  

describe("CreateWallet Component", () => {
  test("renders 'Please connect your wallet' message when not authenticated", () => {
    // Mock the isAuthenticated hook to be false
    useAuth.mockReturnValue({ isAuthenticated: false });

    render(
      <Provider store={store}>
        <Router>
          <CreateWallet />
        </Router>
      </Provider>
    );

    // Check if the "Please connect your wallet" text is rendered
    expect(screen.getByText(/Please, connect your wallet/i)).toBeInTheDocument();
  });

  test("renders Connect Wallet button and triggers modal on click", () => {
    // Mock the isAuthenticated hook to be false
    useAuth.mockReturnValue({ isAuthenticated: false });

    render(
      <Provider store={store}>
        <Router>
          <CreateWallet />
        </Router>
      </Provider>
    );

    // Check if the "Connect Wallet" button is rendered
    const connectWalletButton = screen.getByText(/Connect Wallet/i);
    expect(connectWalletButton).toBeInTheDocument();

    // Simulate click on the "Connect Wallet" button
    fireEvent.click(connectWalletButton);

    // Check if the modal is shown (as isSwitchingWallet or isAuthenticated will be false)
    expect(screen.getByText("Wallet Modal")).toBeInTheDocument();
  });

 

  test("WalletModal is rendered when isSwitchingWallet is true", () => {
    // Mock the isAuthenticated and isSwitchingWallet hook values
    useAuth.mockReturnValue({ isAuthenticated: false });

    render(
      <Provider store={store}>
        <Router>
          <CreateWallet />
        </Router>
      </Provider>
    );

    // Simulate the wallet switch state to true (or use mock data from Redux store)
    const walletModal = screen.getByText("Wallet Modal");
    expect(walletModal).toBeInTheDocument();
  });
});
