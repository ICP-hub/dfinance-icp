import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import FaucetDetails from "../../components/Faucet/FaucetList";
import { useSelector } from "react-redux";
import useAssetData from "../../components/CustomHooks/useAssets";
import { useAuth } from "../../utils/useAuthClient";
import useFetchConversionRate from "../../components/CustomHooks/useFetchConversionRate";
import useUserData from "../../components/CustomHooks/useUserData";
import { SCALING_FACTOR } from '../../utils/constants';
// Mock all the required dependencies
jest.mock("react-redux", () => ({
  useSelector: jest.fn(),
  Provider: ({ children }) => children,
}));

jest.mock("react-router-dom", () => ({
  useNavigate: () => jest.fn(),
}));

jest.mock("../../components/Common/lottie", () => ({
  __esModule: true,
  default: () => <div data-testid="lottie-animation">Lottie Animation</div>,
}));

jest.mock("../../components/Common/miniLoader", () => ({
  __esModule: true,
  default: ({ isLoading }) => (
    <div data-testid="mini-loader">
      {isLoading ? "Loading..." : "Not Loading"}
    </div>
  ),
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
      <div data-testid="freeze-canister-popup">
        Freeze Canister Popup
        <button onClick={onClose}>Close</button>
      </div>
    ),
  })
);

jest.mock("../../components/Faucet/FaucetPopup", () => ({
  __esModule: true,
  default: ({ isOpen, onClose, asset }) => (
    <div data-testid="faucet-popup">
      Faucet Popup for {asset}
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

jest.mock("../../components/customHooks/useAssets", () => jest.fn());

jest.mock("../../utils/useAuthClient", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../../components/customHooks/useFetchConversionRate", () =>
  jest.fn()
);

jest.mock("../../components/customHooks/useUserData", () => jest.fn());

// Mock images
jest.mock("../../../public/assests-icon/ckBTC.png", () => "ckBTC.png");
jest.mock("../../../public/assests-icon/CKETH.svg", () => "CKETH.svg");
jest.mock("../../../public/assests-icon/ckusdc.svg", () => "ckUSDC.svg");
jest.mock("../../../public/assests-icon/ckUSDT.svg", () => "ckUSDT.svg");
jest.mock("../../../public/assests-icon/ICPMARKET.png", () => "icp.png");



describe("FaucetDetails Component", () => {
  // Default mock values
  const defaultMocks = () => {
    useSelector.mockImplementation((selector) =>
      selector({
        faucetUpdate: { refreshTrigger: false },
        utility: { isSwitchingWallet: false },
      })
    );

    useAssetData.mockReturnValue({
      filteredItems: [["ckBTC"], ["ckETH"], ["ckUSDC"], ["ICP"], ["ckUSDT"]],
      loading: false,
    });

    useAuth.mockReturnValue({
      isAuthenticated: true,
      backendActor: {},
    });

    useFetchConversionRate.mockReturnValue({
      ckBTCUsdRate: 40000 * SCALING_FACTOR,
      ckETHUsdRate: 2500 * SCALING_FACTOR,
      ckUSDCUsdRate: 1 * SCALING_FACTOR,
      ckICPUsdRate: 8 * SCALING_FACTOR,
      ckUSDTUsdRate: 1 * SCALING_FACTOR,
      fetchConversionRate: jest.fn(),
      ckBTCBalance: 0.05,
      ckETHBalance: 0.5,
      ckUSDCBalance: 100,
      ckICPBalance: 10,
      ckUSDTBalance: 100,
      fetchBalance: jest.fn(),
    });

    useUserData.mockReturnValue({
      isFreezePopupVisible: false,
      setIsFreezePopupVisible: jest.fn(),
    });
  };

  beforeEach(() => {
    defaultMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders component with title 'Test Assets'", () => {
    render(<FaucetDetails />);
    expect(screen.getByText("Test Assets")).toBeInTheDocument();
  });

  test("displays loading state when data is being fetched", () => {
    useAssetData.mockReturnValue({
      filteredItems: [],
      loading: true,
    });

    render(<FaucetDetails />);
    expect(screen.getByTestId("faucet-list")).toBeInTheDocument();
    expect(screen.getByTestId("mini-loader")).toBeInTheDocument();
  });

  test("displays 'NO ASSETS FOUND!' when there are no assets", () => {
    useAssetData.mockReturnValue({
      filteredItems: [],
      loading: false,
    });

    render(<FaucetDetails />);
    expect(screen.getByText("NO ASSETS FOUND!")).toBeInTheDocument();
    expect(screen.getByTestId("lottie-animation")).toBeInTheDocument();
  });

  test("renders all asset rows", () => {
    render(<FaucetDetails />);

    // Check for all asset types
    expect(screen.getByText("ckBTC")).toBeInTheDocument();
    expect(screen.getByText("ckETH")).toBeInTheDocument();
    expect(screen.getByText("ckUSDC")).toBeInTheDocument();
    expect(screen.getByText("ICP")).toBeInTheDocument();
    expect(screen.getByText("ckUSDT")).toBeInTheDocument();
  });
  // show faucet buttons for each asset
  test("shows faucet buttons for each asset", () => {
    render(<FaucetDetails />);

    // Check for faucet text in desktop view
    const faucetTexts = screen.getAllByText("Faucet");
    expect(faucetTexts.length).toBe(5); // One faucet button for each asset
  });

  test("opens faucet popup when faucet button is clicked", () => {
    render(<FaucetDetails />);

    // Click the first faucet button
    const faucetButtons = screen.getAllByText("Faucet");
    fireEvent.click(faucetButtons[0]);

    // Check if popup appears with asset name
    expect(screen.getByTestId("faucet-popup")).toBeInTheDocument();
    expect(screen.getByText("Faucet Popup for ckBTC")).toBeInTheDocument();
  });

  test("closes faucet popup when close button is clicked", async () => {
    render(<FaucetDetails />);

    // First open the popup
    const faucetButtons = screen.getAllByText("Faucet");
    fireEvent.click(faucetButtons[0]);

    // Now find and click the close button
    const closeButton = screen.getByText("Close");
    fireEvent.click(closeButton);

    // Now we should check if the popup is gone
    await waitFor(() => {
      expect(screen.queryByTestId("faucet-popup")).not.toBeInTheDocument();
    });
  });

  test("shows wallet modal when user is not authenticated", () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      backendActor: {},
    });

    render(<FaucetDetails />);
    expect(screen.getByTestId("wallet-modal")).toBeInTheDocument();
  });

  test("shows wallet modal when switching wallet", () => {
    useSelector.mockImplementation((selector) =>
      selector({
        faucetUpdate: { refreshTrigger: false },
        utility: { isSwitchingWallet: true },
      })
    );

    render(<FaucetDetails />);
    expect(screen.getByTestId("wallet-modal")).toBeInTheDocument();
  });

  test("displays correct balance format for assets with balance >= 1", () => {
    useFetchConversionRate.mockReturnValue({
      ...useFetchConversionRate(),
      ckUSDCBalance: 1000,
    });

    render(<FaucetDetails />);
    expect(screen.getByText("1,000.00")).toBeInTheDocument();
  });

  test("displays balance with 7 decimal places for assets with balance < 1", () => {
    useFetchConversionRate.mockReturnValue({
      ...useFetchConversionRate(),
      ckBTCBalance: 0.0012345,
      ckBTCUsdRate: 40000 * SCALING_FACTOR,
    });

    render(<FaucetDetails />);
    expect(screen.getByText("0.0012345")).toBeInTheDocument();
  });

  test("displays USD value for each asset", () => {
    render(<FaucetDetails />);

    // Check USD values for different assets based on the mock data
    expect(screen.getByText("$2,000.00")).toBeInTheDocument(); // ckBTC: 0.05 * 40000
    expect(screen.getByText("$1,250.00")).toBeInTheDocument(); // ckETH: 0.5 * 2500
    expect(screen.getByText("$80.00")).toBeInTheDocument(); // ICP: 10 * 8
  });

  test("shows freeze canister popup when isFreezePopupVisible is true", () => {
    useUserData.mockReturnValue({
      isFreezePopupVisible: true,
      setIsFreezePopupVisible: jest.fn(),
    });

    render(<FaucetDetails />);
    expect(screen.getByTestId("freeze-canister-popup")).toBeInTheDocument();
  });

  test("closes freeze canister popup when close button is clicked", () => {
    const setIsFreezePopupVisible = jest.fn();
    useUserData.mockReturnValue({
      isFreezePopupVisible: true,
      setIsFreezePopupVisible,
    });

    render(<FaucetDetails />);

    const closeButton = screen.getByText("Close");
    fireEvent.click(closeButton);

    expect(setIsFreezePopupVisible).toHaveBeenCalledWith(false);
  });

  test("fetches asset data on component mount", () => {
    const fetchBalance = jest.fn();
    const fetchConversionRate = jest.fn();

    useFetchConversionRate.mockReturnValue({
      ...useFetchConversionRate(),
      fetchBalance,
      fetchConversionRate,
    });

    render(<FaucetDetails />);

    expect(fetchBalance).toHaveBeenCalledWith("ckBTC");
    expect(fetchBalance).toHaveBeenCalledWith("ckETH");
    expect(fetchBalance).toHaveBeenCalledWith("ckUSDC");
    expect(fetchBalance).toHaveBeenCalledWith("ICP");
    expect(fetchBalance).toHaveBeenCalledWith("ckUSDT");
    expect(fetchConversionRate).toHaveBeenCalled();
  });

  test("handles zero balance display correctly", () => {
    useFetchConversionRate.mockReturnValue({
      ...useFetchConversionRate(),
      ckBTCBalance: 0,
      ckBTCUsdRate: 40000 * SCALING_FACTOR,
    });

    render(<FaucetDetails />);

    // Check for the $0.00 display for ckBTC
    const zeroBalances = screen.getAllByText("$0.00");
    expect(zeroBalances.length).toBeGreaterThan(0);
  });

  test("updates body overflow style when freeze popup is visible", () => {
    useUserData.mockReturnValue({
      isFreezePopupVisible: true,
      setIsFreezePopupVisible: jest.fn(),
    });

    render(<FaucetDetails />);

    expect(document.body.style.overflow).toBe("hidden");

    // Cleanup
    useUserData.mockReturnValue({
      isFreezePopupVisible: false,
      setIsFreezePopupVisible: jest.fn(),
    });

    render(<FaucetDetails />);

    expect(document.body.style.overflow).toBe("auto");
  });
});
