import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CreateWallet from "../../pages/Dashboard/Dashboard";  
import { Provider } from "react-redux";
import { store } from "../../redux/store"; 
import { BrowserRouter as Router } from "react-router-dom";
import { useAuth } from "../../utils/useAuthClient";  

jest.mock("../../utils/useAuthClient", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../../components/Dashboard/WalletModal", () => () => (
  <div>Wallet Modal</div>
));
jest.mock('lottie-react', () => ({
    useLottie: () => ({ View: () => <div>Mocked Lottie Animation</div> })
  }));
  

describe("CreateWallet Component", () => {
  test("renders 'Please connect your wallet' message when not authenticated", () => {
    useAuth.mockReturnValue({ isAuthenticated: false });

    render(
      <Provider store={store}>
        <Router>
          <CreateWallet />
        </Router>
      </Provider>
    );

    expect(screen.getByText(/Please, connect your wallet/i)).toBeInTheDocument();
  });

  test("renders Connect Wallet button and triggers modal on click", () => {
    useAuth.mockReturnValue({ isAuthenticated: false });

    render(
      <Provider store={store}>
        <Router>
          <CreateWallet />
        </Router>
      </Provider>
    );

    const connectWalletButton = screen.getByText(/Connect Wallet/i);
    expect(connectWalletButton).toBeInTheDocument();

    fireEvent.click(connectWalletButton);

    expect(screen.getByText("Wallet Modal")).toBeInTheDocument();
  });

 

  test("WalletModal is rendered when isSwitchingWallet is true", () => {
    useAuth.mockReturnValue({ isAuthenticated: false });

    render(
      <Provider store={store}>
        <Router>
          <CreateWallet />
        </Router>
      </Provider>
    );

    const walletModal = screen.getByText("Wallet Modal");
    expect(walletModal).toBeInTheDocument();
  });
});
