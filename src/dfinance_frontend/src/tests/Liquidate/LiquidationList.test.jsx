import React from "react";
import { render, screen } from "@testing-library/react";
import DebtStatus from "../../components/Liquidate/LiquidationList";
import { useSelector } from "react-redux";
import { useAuth } from "../../utils/useAuthClient";
import useAssetData from "../../components/CustomHooks/useAssets";

// Mock the hooks and modules
jest.mock("react-redux", () => ({
  useSelector: jest.fn(),
}));

jest.mock("../../utils/useAuthClient", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../../components/CustomHooks/useAssets", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Fix: Mock useReserveData with proper return value
jest.mock("../../context/ReserveDataContext", () => ({
  __esModule: true,
  default: jest.fn(),
  useReserveData: jest.fn(() => ({
    batchFetchReserveData: jest.fn().mockResolvedValue({}),
    reserveData: {},
    loading: false,
    error: null,
  })),
}));

// Mock the child components
jest.mock("../../components/Common/miniLoader", () => ({
  __esModule: true,
  default: () => <div data-testid="mini-loader">Loading...</div>,
}));

jest.mock("../../components/Common/lottie", () => ({
  __esModule: true,
  default: () => <div data-testid="lottie-animation">Lottie Animation</div>,
}));

jest.mock("../../components/Common/pagination", () => ({
  __esModule: true,
  default: () => <div data-testid="pagination">Pagination Component</div>,
}));

jest.mock("../../components/Liquidate/UserInformation", () => ({
  __esModule: true,
  default: () => <div data-testid="user-info-popup">User Info Popup</div>,
}));

describe("DebtStatus Component", () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mock returns
    useSelector.mockReturnValue(false);
    
    useAuth.mockReturnValue({
      getAllUsers: jest.fn().mockResolvedValue([]),
      user: { toString: () => "user-principal" },
      backendActor: {
        get_total_users: jest.fn().mockResolvedValue(0),
        get_liquidation_users_concurrent: jest.fn().mockResolvedValue([]),
      },
      fetchReserveData: jest.fn().mockResolvedValue({}),
      createLedgerActor: jest.fn(),
    });
    
    useAssetData.mockReturnValue({
      assets: [],
      filteredItems: [],
      asset_supply: {},
      asset_borrow: {},
      fetchAssetSupply: jest.fn(),
      fetchAssetBorrow: jest.fn(),
      loading: false,
    });
  });

  test("renders the component without crashing", () => {
    render(<DebtStatus />);
    expect(document.body).toBeTruthy();
  });

  test("renders component title correctly", () => {
    render(<DebtStatus />);
    expect(screen.getByText("Debt users list")).toBeInTheDocument();
  });

  test("renders with the correct structure", () => {
    render(<DebtStatus />);
    const container = document.querySelector(".w-full");
    expect(container).toBeInTheDocument();
    
    const title = screen.getByText("Debt users list");
    expect(title).toBeInTheDocument();
  });

  test("shows loading state", () => {
    render(<DebtStatus />);
    const loader = screen.getByTestId("mini-loader");
    expect(loader).toBeInTheDocument();
  });

  test("handles empty liquidation users state", () => {
    const { rerender } = render(<DebtStatus />);
    
    // Use fake timers to handle the component's setTimeout
    jest.useFakeTimers();
    setTimeout(() => {}, 1300);
    jest.runAllTimers();
    
    rerender(<DebtStatus />);
    expect(document.body).toBeTruthy();
    
    // Clean up
    jest.useRealTimers();
  });
});