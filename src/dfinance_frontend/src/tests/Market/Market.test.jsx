import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Market from "../../pages/Market/Market";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../utils/useAuthClient";
import useAssetData from "../../components/customHooks/useAssets";
import useFetchConversionRate from "../../components/customHooks/useFetchConversionRate";
import useUserData from "../../components/customHooks/useUserData";

jest.mock("react-redux", () => ({
  useSelector: jest.fn(),
}));

jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
}));

jest.mock("../../utils/useAuthClient", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../../components/customHooks/useAssets", () => jest.fn());

jest.mock("../../components/customHooks/useFetchConversionRate", () =>
  jest.fn()
);

jest.mock("../../components/customHooks/useUserData", () => jest.fn());

jest.mock("lucide-react", () => ({
  ChevronRight: () => <div data-testid="chevron-right">ChevronRight</div>,
  X: () => <div data-testid="x-icon">X</div>,
}));

jest.mock("../../../public/assests-icon/ckBTC.png", () => "ckBTC.png");
jest.mock("../../../public/assests-icon/CKETH.svg", () => "CKETH.svg");
jest.mock("../../../public/assests-icon/ckusdc.svg", () => "ckusdc.svg");
jest.mock("../../../public/assests-icon/ckUSDT.svg", () => "ckUSDT.svg");
jest.mock("../../../public/assests-icon/ICPMARKET.png", () => "ICPMARKET.png");

jest.mock("../../components/Common/lottie", () => () => (
  <div>Lottie Animation</div>
));
jest.mock("../../components/Common/miniLoader", () => ({ isLoading }) => (
  <div>Loading...</div>
));
jest.mock(
  "../../components/Common/button",
  () =>
    ({ title, onClickHandler }) =>
      <button onClick={onClickHandler}>{title}</button>
);
// Removed WalletModal mock
jest.mock(
  "../../components/Dashboard/DashboardPopup/CanisterDrainPopup",
  () => () => <div>Freeze Canister Popup</div>
);

describe("Market Component", () => {
  const defaultMockData = {
    theme: { theme: "light" },
    utility: { isWalletCreated: false, isSwitchingWallet: false },
    dashboardUpdate: { refreshDashboardTrigger: 0 },
  };

  const mockNavigate = jest.fn();
  const mockFilteredItems = [
    [
      "ckBTC",
      {
        Ok: {
          asset_supply: "100000000", // 1 ckBTC
          asset_borrow: "50000000", // 0.5 ckBTC
          current_liquidity_rate: "500000", // 0.5%
          borrow_rate: "1000000", // 1%
        },
      },
    ],
    [
      "ckETH",
      {
        Ok: {
          asset_supply: "200000000", // 2 ckETH
          asset_borrow: "100000000", // 1 ckETH
          current_liquidity_rate: "600000", // 0.6%
          borrow_rate: "1200000", // 1.2%
        },
      },
    ],
  ];

  const mockConversionRates = {
    ckBTCUsdRate: 5000000000, // $50,000
    ckETHUsdRate: 300000000, // $3,000
    ckUSDCUsdRate: 100000000, // $1
    ckICPUsdRate: 1000000000, // $10
    ckUSDTUsdRate: 100000000, // $1
  };

  beforeEach(() => {
    jest.clearAllMocks();

    useSelector.mockImplementation((selector) => selector(defaultMockData));
    useNavigate.mockReturnValue(mockNavigate);
    useAuth.mockReturnValue({
      isAuthenticated: true,
      principal:
        "fiwxf-6ciew-637q6-qjls2-op344-mkbrd-sr3uw-3jnjs-dr74l-jhpll-iqe",
    });
    useAssetData.mockReturnValue({
      filteredItems: mockFilteredItems,
      loading: false,
      totalMarketSize: "5M",
      totalSupplySize: "3M",
      totalBorrowSize: "1M",
      totalReserveFactor: "0.1",
      interestAccure: "0.05",
    });
    useFetchConversionRate.mockReturnValue(mockConversionRates);
    useUserData.mockReturnValue({
      isFreezePopupVisible: false,
      setIsFreezePopupVisible: jest.fn(),
    });
  });

  test("renders component with asset data", async () => {
    render(<Market />);

    // Check that the component renders the main title
    expect(screen.getByText("ICP Assets")).toBeInTheDocument();

    // Check that assets are rendered
    expect(screen.getByText("ckBTC")).toBeInTheDocument();
    expect(screen.getByText("ckETH")).toBeInTheDocument();

    // Check that buttons are rendered
    const detailsButtons = screen.getAllByText("Details");
    expect(detailsButtons.length).toBe(2); // One for each asset
  });

  test("shows loading state", () => {
    useAssetData.mockReturnValue({
      filteredItems: [],
      loading: true,
      totalMarketSize: "0",
      totalSupplySize: "0",
      totalBorrowSize: "0",
      totalReserveFactor: "0",
      interestAccure: "0",
    });

    render(<Market />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  test("shows no assets found message when filteredItems is empty", () => {
    useAssetData.mockReturnValue({
      filteredItems: [],
      loading: false,
      totalMarketSize: "0",
      totalSupplySize: "0",
      totalBorrowSize: "0",
      totalReserveFactor: "0",
      interestAccure: "0",
    });

    render(<Market />);

    expect(screen.getByText("NO ASSETS FOUND!")).toBeInTheDocument();
  });

  test("search functionality works", async () => {
    const mockFilterFunction = jest.fn();
    useAssetData.mockImplementation((query) => ({
      filteredItems: mockFilteredItems,
      loading: false,
      totalMarketSize: "5M",
      totalSupplySize: "3M",
      totalBorrowSize: "1M",
      totalReserveFactor: "0.1",
      interestAccure: "0.05",
    }));

    render(<Market />);

    // Click search icon to show search input
    fireEvent.click(screen.getByTestId("search-icon"));

    const searchInputs = screen.getAllByPlaceholderText("Search assets");
    const searchInput = searchInputs[0]; // Select the first one
    fireEvent.change(searchInput, { target: { value: "ckBTC" } });

    // Check if the search query state is updated
    expect(searchInput.value).toBe("ckBTC");
  });

  test("details button navigates to asset details page", () => {
    render(<Market />);

    const detailsButtons = screen.getAllByText("Details");
    fireEvent.click(detailsButtons[0]); // Click first Details button

    expect(mockNavigate).toHaveBeenCalledWith("/market/asset-details/ckBTC", {
      state: { assetData: mockFilteredItems[0][1] },
    });
  });

  test("chevron icon opens asset modal on mobile", () => {
    render(<Market />);

    const chevronIcons = screen.getAllByTestId("chevron-right");
    fireEvent.click(chevronIcons[0]); // Click first chevron

    // Check if modal appears with asset details
    expect(screen.getByText("Total Supplied:")).toBeInTheDocument();
    expect(screen.getByText("Supply APY:")).toBeInTheDocument();
    expect(screen.getByText("Total Borrowing:")).toBeInTheDocument();
    expect(screen.getByText("Borrow APY:")).toBeInTheDocument();
  });

  test("freeze canister popup shows when isFreezePopupVisible is true", () => {
    useUserData.mockReturnValue({
      isFreezePopupVisible: true,
      setIsFreezePopupVisible: jest.fn(),
    });

    render(<Market />);

    expect(screen.getByText("Freeze Canister Popup")).toBeInTheDocument();
  });

  test("closes asset modal when clicking the X button", () => {
    render(<Market />);

    // Open the modal first
    const chevronIcons = screen.getAllByTestId("chevron-right");
    fireEvent.click(chevronIcons[0]);

    // Find and click the close button
    const closeButton = screen.getByTestId("x-icon");
    fireEvent.click(closeButton);

    // Modal should be closed (elements no longer in document)
    expect(screen.queryByText("Total Supplied:")).not.toBeInTheDocument();
  });
});
