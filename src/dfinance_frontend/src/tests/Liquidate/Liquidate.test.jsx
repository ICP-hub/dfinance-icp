import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Liquidate from "../../components/Liquidate/Liquidate";
import { MemoryRouter } from "react-router-dom";

// Mock the necessary hooks and components
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: "/Liquidate" }),
}));

jest.mock("react-redux", () => ({
  useSelector: jest.fn().mockImplementation(() => ({
    isWalletCreated: false,
    isSwitchingWallet: false,
  })),
}));

jest.mock("../../utils/useAuthClient", () => ({
  useAuth: jest.fn().mockImplementation(() => ({
    isAuthenticated: false,
  })),
}));

jest.mock("../../components/customHooks/useUserData", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    isFreezePopupVisible: false,
    setIsFreezePopupVisible: jest.fn(),
  })),
}));

jest.mock("../../components/Dashboard/WalletModal", () => ({
  __esModule: true,
  default: () => <div data-testid="wallet-modal">Wallet Modal</div>,
}));

jest.mock(
  "../../components/Dashboard/DashboardPopup/CanisterDrainPopup",
  () => ({
    __esModule: true,
    default: ({ onClose }) => (
      <div data-testid="freeze-popup">
        Freeze Canister Popup
        <button onClick={onClose}>Close</button>
      </div>
    ),
  })
);

jest.mock("../../components/Liquidate/LiquidationList", () => ({
  __esModule: true,
  default: ({ onBackClick }) => (
    <div data-testid="debt-status">
      Debt Status Component
      <button onClick={onBackClick}>Back</button>
    </div>
  ),
}));

jest.mock("../../components/Common/button", () => ({
  __esModule: true,
  default: ({ title, onClickHandler }) => (
    <button
      data-testid={`button-${title.replace(/\s+/g, "-").toLowerCase()}`}
      onClick={onClickHandler}
    >
      {title}
    </button>
  ),
}));

describe("Liquidate Component", () => {
  // Helper function to render with basic router
  const renderLiquidate = (pathname = "/Liquidate") => {
    // Override the useLocation mock for this render
    jest.spyOn(require("react-router-dom"), "useLocation").mockReturnValue({
      pathname,
    });

    return render(
      <MemoryRouter>
        <Liquidate />
      </MemoryRouter>
    );
  };

  test("renders the Liquidate component header correctly", () => {
    renderLiquidate();

    const header = screen.getByText("Liquidation");
    expect(header).toBeInTheDocument();
  });

  test('displays the "Check Users in Debt" title', () => {
    renderLiquidate();

    const title = screen.getByText("Check Users in Debt");
    expect(title).toBeInTheDocument();
  });

  test('displays the "Get Debt Status" button', () => {
    renderLiquidate();

    const button = screen.getByTestId("button-get-debt-status");
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("Get Debt Status");
  });

  test("shows warning message when unauthenticated user clicks the button", () => {
    renderLiquidate();

    // Click the button
    const button = screen.getByTestId("button-get-debt-status");
    fireEvent.click(button);

    // Check if warning message appears
    const warning = screen.getByText(
      "Please connect your wallet to check the debt status."
    );
    expect(warning).toBeInTheDocument();
  });

  test("renders wallet modal for unauthenticated users", () => {
    // Mock authentication state
    jest
      .spyOn(require("../../utils/useAuthClient"), "useAuth")
      .mockReturnValue({
        isAuthenticated: false,
      });

    renderLiquidate();

    const walletModal = screen.getByTestId("wallet-modal");
    expect(walletModal).toBeInTheDocument();
  });

  test("does not show wallet modal for authenticated users", () => {
    // Mock authentication state
    jest
      .spyOn(require("../../utils/useAuthClient"), "useAuth")
      .mockReturnValue({
        isAuthenticated: true,
      });

    renderLiquidate();

    expect(screen.queryByTestId("wallet-modal")).not.toBeInTheDocument();
  });

  test("renders DebtStatus component on debt-users-list route", () => {
    renderLiquidate("/Liquidate/debt-users-list");

    const debtStatus = screen.getByTestId("debt-status");
    expect(debtStatus).toBeInTheDocument();

    // Main page elements should not be shown
    expect(screen.queryByText("Check Users in Debt")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("button-get-debt-status")
    ).not.toBeInTheDocument();
  });

  test("renders freeze popup when isFreezePopupVisible is true", () => {
    // Mock the freeze popup state
    jest
      .spyOn(require("../../components/customHooks/useUserData"), "default")
      .mockReturnValue({
        isFreezePopupVisible: true,
        setIsFreezePopupVisible: jest.fn(),
      });

    renderLiquidate();

    const freezePopup = screen.getByTestId("freeze-popup");
    expect(freezePopup).toBeInTheDocument();
  });
});
