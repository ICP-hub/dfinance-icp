import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { Provider } from "react-redux";
import SupplyPopup from "../../components/Dashboard/DashboardPopup/SupplyPopup";
import { store } from "../../redux/store";
import { MemoryRouter } from "react-router-dom";

// Mock toast notifications to verify success/error feedback
jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock conversion rate hook to return a stable rate for testing calculations
jest.mock("../../components/customHooks/useRealTimeConversionRate", () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({
    conversionRate: 50000 * Math.pow(10, 8),
    error: null,
  }),
}));

// Mock authentication client with a successful supply execution response
jest.mock("../../utils/useAuthClient", () => ({
  useAuth: jest.fn().mockReturnValue({
    backendActor: {
      execute_supply: jest.fn().mockResolvedValue({ Ok: true }),
    },
    principal: "rrkah-fqaaa-aaaaa-aaaaq-cai",
  }),
}));

// Mock user data with a healthy financial position for testing
jest.mock("../../components/customHooks/useUserData", () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({
    userData: {},
    healthFactorBackend: 2.5, // Good health factor for testing
    refetchUserData: jest.fn(),
  }),
}));

// Mock function blocking status to allow operations during tests
jest.mock("../../components/customHooks/useFunctionBlockStatus", () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({
    isBlocked: false,
  }),
}));

// Mock transfer fee for consistent transaction cost display
jest.mock("../../components/customHooks/useTransferFee", () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({
    transferFee: 0.0001,
  }),
}));

// Mock IC Principal functionality
jest.mock("@dfinity/principal", () => ({
  Principal: {
    fromText: jest.fn().mockImplementation((text) => ({
      _arr: new Uint8Array(10),
      toString: () => text,
    })),
  },
}));

// Mock Redux store with necessary state for testing component
jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useSelector: jest.fn().mockImplementation((callback) => {
    return callback({
      ledger: {
        // Mock token ledgers with successful approval responses
        ckBTC: {
          icrc2_approve: jest.fn().mockResolvedValue({ Ok: true }),
        },
        ckETH: {
          icrc2_approve: jest.fn().mockResolvedValue({ Ok: true }),
        },
        ckUSDC: {
          icrc2_approve: jest.fn().mockResolvedValue({ Ok: true }),
        },
        ICP: {
          icrc2_approve: jest.fn().mockResolvedValue({ Ok: true }),
        },
        ckUSDT: {
          icrc2_approve: jest.fn().mockResolvedValue({ Ok: true }),
        },
      },
      sound: {
        isSoundOn: true, // Enable sound effects for testing
      },
      fees: {
        fees: {
          // Mock consistent fee structure across tokens
          ckBTC: 0.0001,
          ckETH: 0.0001,
          ckUSDC: 0.0001,
          ICP: 0.0001,
          ckUSDT: 0.0001,
        },
      },
    });
  }),
  useDispatch: () => jest.fn(),
}));

describe("SupplyPopup Component", () => {
  // Mock media playback to prevent errors during testing
  window.HTMLMediaElement.prototype.play = jest.fn();

  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Common props used across multiple tests
  const defaultProps = {
    asset: "ckBTC",
    image: "mockImage.png",
    supplyRateAPR: 5,
    balance: "1000",
    liquidationThreshold: 85,
    assetSupply: 100,
    assetBorrow: 50,
    totalCollateral: "1000",
    totalDebt: "500",
    currentCollateralStatus: "status",
    Ltv: 1.5,
    borrowableValue: "1000",
    borrowableAssetValue: "1000",
    isModalOpen: true,
    handleModalOpen: jest.fn(),
    setIsModalOpen: jest.fn(),
    onLoadingChange: jest.fn(),
  };

  // Test basic component rendering and key UI elements
  test("renders Supply component", async () => {
    await act(async () => {
      render(
        <Provider store={store}>
          <MemoryRouter>
            <SupplyPopup {...defaultProps} />
          </MemoryRouter>
        </Provider>
      );
    });

    // Verify input field is properly rendered
    const inputElement = await screen.findByPlaceholderText(
      "Enter ckBTC Amount"
    );
    expect(inputElement).toBeInTheDocument();

    // Check health factor information is displayed
    const healthFactorElements = screen.getAllByText(/Health Factor/i);
    expect(healthFactorElements.length).toBeGreaterThan(0);

    // Verify transaction overview section is present
    expect(screen.getByText(/Transaction overview/i)).toBeInTheDocument();
  });

  // Test approval button state when no amount is entered
  test("disables approval button when amount is 0", async () => {
    await act(async () => {
      render(
        <Provider store={store}>
          <MemoryRouter>
            <SupplyPopup {...defaultProps} />
          </MemoryRouter>
        </Provider>
      );
    });

    // Verify approval button is disabled when no amount is entered
    const approveButton = screen.getByText(/Approve ckBTC to continue/i);
    expect(approveButton.closest("button")).toBeDisabled();
  });

  // Test input handling for amount field
  test("handles amount input change correctly", async () => {
    await act(async () => {
      render(
        <Provider store={store}>
          <MemoryRouter>
            <SupplyPopup {...defaultProps} />
          </MemoryRouter>
        </Provider>
      );
    });

    // Get amount input field
    const amountInput = await screen.findByPlaceholderText(
      "Enter ckBTC Amount"
    );

    // Enter a value and verify it updates correctly
    await act(async () => {
      fireEvent.change(amountInput, { target: { value: "10" } });
    });

    expect(amountInput.value).toBe("10");
  });

  // Test transaction overview section displays correct information
  test("displays correct transaction overview information", async () => {
    await act(async () => {
      render(
        <Provider store={store}>
          <MemoryRouter>
            <SupplyPopup {...defaultProps} />
          </MemoryRouter>
        </Provider>
      );
    });

    // Verify transaction section header
    expect(screen.getByText(/Transaction overview/i)).toBeInTheDocument();

    // Check all key transaction details are shown
    expect(screen.getByText(/Supply APY/i)).toBeInTheDocument();
    expect(screen.getByText(/Collateralization/i)).toBeInTheDocument();
    expect(screen.getByText(/Health Factor/i)).toBeInTheDocument();
    expect(screen.getByText(/Transaction Fee/i)).toBeInTheDocument();
    expect(screen.getByText(/Final amount/i)).toBeInTheDocument();

    // Verify displayed values match expected calculations
    expect(screen.getByText(/2.50/i)).toBeInTheDocument();
    expect(screen.getByText(/5.00%/i)).toBeInTheDocument();
    expect(screen.getByText(/0.0001/i)).toBeInTheDocument();
    expect(screen.getByText(/0.00000000/i)).toBeInTheDocument();
  });

  // Test USD value calculation and display
  test("displays USD value for amount input", async () => {
    await act(async () => {
      render(
        <Provider store={store}>
          <MemoryRouter>
            <SupplyPopup {...defaultProps} />
          </MemoryRouter>
        </Provider>
      );
    });

    // Check initial USD value display when amount is zero
    expect(screen.getByText("$0.00 USD")).toBeInTheDocument();

    // Get amount input field
    const amountInput = await screen.findByPlaceholderText(
      "Enter ckBTC Amount"
    );

    // Enter a value to trigger USD calculation
    await act(async () => {
      fireEvent.change(amountInput, { target: { value: "10" } });
    });

    // Verify USD value updates after input change
    await waitFor(() => {
      expect(screen.queryByText("$0.00 USD")).not.toBeInTheDocument();
      const usdTexts = screen.getAllByText(/\$.*USD/);
      expect(usdTexts.length).toBeGreaterThan(0);
    });
  });

  // Test health factor recalculation based on input amount
  test("displays health factor calculation correctly", async () => {
    await act(async () => {
      render(
        <Provider store={store}>
          <MemoryRouter>
            <SupplyPopup {...defaultProps} />
          </MemoryRouter>
        </Provider>
      );
    });

    // Check initial health factor display
    expect(screen.getByText(/2.50/)).toBeInTheDocument();

    // Get amount input field
    const amountInput = await screen.findByPlaceholderText(
      "Enter ckBTC Amount"
    );

    // Enter a value to trigger health factor recalculation
    await act(async () => {
      fireEvent.change(amountInput, { target: { value: "10" } });
    });

    // Verify updated health factor with arrow indicator is shown
    await waitFor(() => {
      expect(screen.getByText(/→/)).toBeInTheDocument();
    });
  });
});
