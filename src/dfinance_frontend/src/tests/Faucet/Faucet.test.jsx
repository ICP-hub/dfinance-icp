import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Faucet from "../../pages/Faucet/Faucet";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import { useAuth } from "../../utils/useAuthClient";
import { setWalletModalOpen } from "../../redux/reducers/utilityReducer";

const mockStore = configureStore([]);

// Mock dependencies
jest.mock("../../utils/useAuthClient", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../../components/Faucet/FaucetList", () => ({
  __esModule: true,
  default: () => <div data-testid="faucet-details">Faucet Details</div>,
}));

jest.mock("../../components/Dashboard/WalletModal", () => () => (
  <div data-testid="wallet-modal">Wallet Modal</div>
));

jest.mock("../../components/Common/Button", () => ({
  __esModule: true,
  default: ({ title, onClickHandler }) => (
    <button onClick={onClickHandler} data-testid="connect-wallet-button">
      {title}
    </button>
  ),
}));

jest.mock("../../components/Common/MiniLoader", () => () => (
  <div data-testid="mini-loader">Loading...</div>
));

// Mock SVG import
jest.mock("../../../public/element/elements.svg", () => "elements-image.svg");

describe("Faucet Component", () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      utility: {
        isWalletModalOpen: false,
        isSwitchingWallet: false,
      },
      testnetMode: {
        isTestnetMode: true,
      }
    });
    store.dispatch = jest.fn();
  });

  test("renders 'Please connect your wallet' message when not authenticated", () => {
    // Mock the isAuthenticated hook to be false
    useAuth.mockReturnValue({ isAuthenticated: false });

    render(
      <Provider store={store}>
        <Faucet />
      </Provider>
    );

    // Check if the "Please connect your wallet" text is rendered
    expect(
      screen.getByText(/Please, connect your wallet/i)
    ).toBeInTheDocument();
  });

  test("renders the testnet faucet explanation text", () => {
    // Mock the isAuthenticated hook to be false
    useAuth.mockReturnValue({ isAuthenticated: false });

    render(
      <Provider store={store}>
        <Faucet />
      </Provider>
    );

    // Check if the explanation text is rendered
    expect(
      screen.getByText(/With our testnet Faucet you can receive free assets/i)
    ).toBeInTheDocument();
  });

  test("renders Connect Wallet button and triggers modal on click", () => {
    // Mock the isAuthenticated hook to be false
    useAuth.mockReturnValue({ isAuthenticated: false });

    render(
      <Provider store={store}>
        <Faucet />
      </Provider>
    );

    // Check if the "Connect Wallet" button is rendered
    const connectWalletButton = screen.getByTestId("connect-wallet-button");
    expect(connectWalletButton).toBeInTheDocument();

    // Simulate click on the "Connect Wallet" button
    fireEvent.click(connectWalletButton);

    // Check if the dispatch was called with the correct action
    expect(store.dispatch).toHaveBeenCalledWith(
      setWalletModalOpen({ isOpen: true, isSwitching: false })
    );
  });

  test("renders WalletModal when isWalletModalOpen is true", () => {
    // Set up store with isWalletModalOpen as true
    store = mockStore({
      utility: {
        isWalletModalOpen: true,
        isSwitchingWallet: false,
      },
      testnetMode: {
        isTestnetMode: true,
      }
    });

    // Mock the isAuthenticated hook to be false
    useAuth.mockReturnValue({ isAuthenticated: false });

    render(
      <Provider store={store}>
        <Faucet />
      </Provider>
    );

    // Check if the WalletModal component is rendered
    expect(screen.getByTestId("wallet-modal")).toBeInTheDocument();
  });

  test("renders WalletModal when isSwitchingWallet is true", () => {
    // Set up store with isSwitchingWallet as true
    store = mockStore({
      utility: {
        isWalletModalOpen: false,
        isSwitchingWallet: true,
      },
      testnetMode: {
        isTestnetMode: true,
      }
    });

    // Mock the isAuthenticated hook to be false
    useAuth.mockReturnValue({ isAuthenticated: false });

    render(
      <Provider store={store}>
        <Faucet />
      </Provider>
    );

    // Check if the WalletModal component is rendered
    expect(screen.getByTestId("wallet-modal")).toBeInTheDocument();
  });

  test("renders the Elements image in the unauthenticated view", () => {
    // Mock the isAuthenticated hook to be false
    useAuth.mockReturnValue({ isAuthenticated: false });

    render(
      <Provider store={store}>
        <Faucet />
      </Provider>
    );

    // Check if the Elements image is rendered
    const elementsImage = screen.getByAltText("Elements");
    expect(elementsImage).toBeInTheDocument();
    expect(elementsImage).toHaveAttribute("src", "elements-image.svg");
  });

  test("renders gradient background in unauthenticated view", () => {
    // Mock the isAuthenticated hook to be false
    useAuth.mockReturnValue({ isAuthenticated: false });

    render(
      <Provider store={store}>
        <Faucet />
      </Provider>
    );

    // Check for the container with gradient background classes
    const gradientContainer = screen
      .getByText(/Please, connect your wallet/i)
      .closest("div");
    expect(gradientContainer).toHaveClass("bg-gradient-to-r");
    expect(gradientContainer).toHaveClass("from-[#4659CF]/40");
    expect(gradientContainer).toHaveClass("via-[#D379AB]/40");
    expect(gradientContainer).toHaveClass("to-[#FCBD78]/40");
  });

  test("renders the header text for unauthenticated users", () => {
    // Mock the isAuthenticated hook to be false
    useAuth.mockReturnValue({ isAuthenticated: false });

    render(
      <Provider store={store}>
        <Faucet />
      </Provider>
    );

    // Check if the information text is rendered
    expect(
      screen.getByText(/Please connect your wallet to get free testnet assets/i)
    ).toBeInTheDocument();
  });

  test("does not render content when isTestnetMode is false", () => {
    // Set up store with isTestnetMode as false
    store = mockStore({
      utility: {
        isWalletModalOpen: false,
        isSwitchingWallet: false,
      },
      testnetMode: {
        isTestnetMode: false,
      }
    });

    // Mock the isAuthenticated hook to be false
    useAuth.mockReturnValue({ isAuthenticated: false });

    render(
      <Provider store={store}>
        <Faucet />
      </Provider>
    );

    // Check that neither the explanation text nor "Connect Wallet" button is rendered
    expect(
      screen.queryByText(/With our testnet Faucet you can receive free assets/i)
    ).not.toBeInTheDocument();

    expect(screen.queryByTestId("connect-wallet-button")).not.toBeInTheDocument();
  });
});