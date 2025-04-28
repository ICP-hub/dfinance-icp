import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { Provider } from "react-redux";
import { createStore } from "redux";
import "@testing-library/jest-dom";
import { useAuth } from "../../utils/useAuthClient";
import useAssetData from "../../components/customHooks/useAssets";
import { MemoryRouter } from "react-router-dom";
import MainDashboard from "../../pages/Dashboard/MainDashboard";

// Mock necessary modules
jest.mock("react-chartjs-2", () => ({
  Doughnut: jest.fn().mockReturnValue(<div>Mocked Doughnut Chart</div>),
}));

jest.mock("../../utils/useAuthClient", () => ({
  useAuth: jest.fn().mockReturnValue({
    backendActor: { to_check_controller: jest.fn() },
    isAuthenticated: true,
  }),
}));

jest.mock("../../components/Common/Loading", () => ({
  __esModule: true,
  default: ({ isLoading }) => (
    <div>{isLoading ? "Loading..." : "Not Loading"}</div>
  ),
}));

jest.mock("react-toastify", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

jest.mock("../../components/customHooks/useFormatNumber", () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue((num) => num),
}));

jest.mock("../../components/customHooks/useFetchConversionRate", () => ({
  __esModule: true,
  default: () => ({
    ckBTCUsdRate: 50000,
    ckETHUsdRate: 4000,
    ckUSDCUsdRate: 1,
    ckICPUsdRate: 5,
    ckUSDTUsdRate: 1,
  }),
}));

jest.mock("../../components/customHooks/useFetchBalanceBackend", () => ({
  __esModule: true,
  default: () => ({
    fetchBalance: jest.fn(),
    ckBTCBalance: 10,
    ckETHBalance: 20,
    ckUSDCBalance: 1000,
    ckICPBalance: 50,
    ckUSDTBalance: 500,
  }),
}));

jest.mock("../../components/customHooks/useUserData", () => ({
  __esModule: true,
  default: () => ({
    isFreezePopupVisible: false,
    setIsFreezePopupVisible: jest.fn(),
  }),
}));

jest.mock("../../components/customHooks/useAssets", () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({
    loading: false,
    filteredItems: [
      ["ckBTC", { Ok: { asset_supply: 100000000, asset_borrow: 50000000 } }],
    ],
  }),
}));

jest.mock(
  "../../components/Dashboard/DashboardPopup/CanisterDrainPopup",
  () => ({
    __esModule: true,
    default: () => <div>Mock Freeze Canister Popup</div>,
  })
);

// Mock the Navbar component to avoid the syntax error
jest.mock("../../components/Layout/Navbar", () => ({
  __esModule: true,
  default: () => <div>Mock Navbar</div>,
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => jest.fn(),
  BrowserRouter: ({ children }) => <div>{children}</div>,
  MemoryRouter: ({ children }) => <div>{children}</div>,
}));

// Mock Redux store
const initialState = {
  utility: { isSwitchingWallet: false },
  theme: { theme: "light" },
};

const mockStore = createStore((state = initialState) => state);

describe("DashboardCards Component", () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    mockNavigate.mockClear();
  });

  test("displays loading state when isLoadingPage is true", async () => {
    // Mock the necessary hooks to simulate loading
    useAuth.mockReturnValue({ isAuthenticated: true });
    useAssetData.mockReturnValue({ loading: true });

    await act(async () => {
      render(
        <Provider store={mockStore}>
          <MemoryRouter>
            <MainDashboard isDGov={false} includeDashboardNav={true}>
              <div>Test Child</div>
            </MainDashboard>
          </MemoryRouter>
        </Provider>
      );
    });

    // Check if loading state is displayed
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});
