import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import Repay from "../../components/Dashboard/DashboardPopup/Repay";
import { Provider } from "react-redux";
import { store } from "../../redux/store";
import { MemoryRouter } from "react-router-dom";

// Mocking react-toastify to simulate toast notifications
jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mocking react-router's useLocation and useNavigate hooks for routing behavior
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useLocation: jest.fn().mockReturnValue({
    pathname: "/repay",
    search: "",
    hash: "",
    state: null,
    key: "default",
  }),
  useNavigate: jest.fn().mockReturnValue(jest.fn()), // Mocking navigation
  MemoryRouter: jest.requireActual("react-router-dom").MemoryRouter,
}));

// Mocking custom hook for real-time conversion rates
jest.mock("../../components/customHooks/useRealTimeConversionRate", () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({
    conversionRate: 50000 * Math.pow(10, 8), // Returning mock conversion rate for ckBTC
    error: null,
  }),
}));

// Mocking authentication logic (backendActor)
jest.mock("../../utils/useAuthClient", () => ({
  useAuth: jest.fn().mockReturnValue({
    backendActor: {
      execute_repay: jest.fn().mockResolvedValue({ Ok: true }), // Mocked repay function (success)
    },
    principal: "rrkah-fqaaa-aaaaa-aaaaq-cai",
  }),
}));

// Mocking user data (health factor)
jest.mock("../../components/customHooks/useUserData", () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({
    userData: {},
    healthFactorBackend: 2.5,
    refetchUserData: jest.fn(),
  }),
}));

// Mocking function block status to simulate an unblocked state
jest.mock("../../components/customHooks/useFunctionBlockStatus", () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({
    isBlocked: false,
  }),
}));

// Mocking transfer fee
jest.mock("../../components/customHooks/useTransferFee", () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({
    transferFee: 0.0001,
  }),
}));

// Mocking Principal from @dfinity/principal
jest.mock("@dfinity/principal", () => ({
  Principal: {
    fromText: jest.fn().mockImplementation((text) => ({
      _arr: new Uint8Array(10),
      toString: () => text,
    })),
  },
}));

// Mocking Redux's useSelector for store state and dispatch
jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useSelector: jest.fn().mockImplementation((callback) => {
    return callback({
      ledger: {
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
        isSoundOn: true,
      },
      fees: {
        fees: {
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

describe("Repay Component", () => {
  // Mocking the play method for media elements
  window.HTMLMediaElement.prototype.play = jest.fn();

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Default props for the Repay component in test cases
  const defaultProps = {
    asset: "ckBTC",
    image: "mockImage.png",
    supplyRateAPR: 5,
    balance: "1000",
    liquidationThreshold: 85,
    reserveliquidationThreshold: 85,
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

  // Test case 1: Verifying that the Repay component renders with correct content
  test("renders Repay component", async () => {
    await act(async () => {
      render(
        <Provider store={store}>
          <MemoryRouter>
            <Repay {...defaultProps} />
          </MemoryRouter>
        </Provider>
      );
    });

    // Check for expected content in the document
    expect(
      screen.getByRole("heading", { name: /Repay ckBTC/i })
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Enter Amount ckBTC/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Transaction overview/i)).toBeInTheDocument();
    expect(screen.getByText(/Health Factor/i)).toBeInTheDocument();
  });

  // Test case 2: Verifying that the approval button is disabled when amount is 0
  test("disables approval button when amount is 0", async () => {
    await act(async () => {
      render(
        <Provider store={store}>
          <MemoryRouter>
            <Repay {...defaultProps} />
          </MemoryRouter>
        </Provider>
      );
    });

    const approveButton = screen.getByText(/Approve ckBTC to continue/i);
    expect(approveButton.closest("button")).toBeDisabled(); // Button should be disabled if the amount is 0
  });

  // Test case 3: Verifying that the amount input field is handled correctly
  test("handles amount input change correctly", async () => {
    await act(async () => {
      render(
        <Provider store={store}>
          <MemoryRouter>
            <Repay {...defaultProps} />
          </MemoryRouter>
        </Provider>
      );
    });

    const amountInput = screen.getByPlaceholderText(/Enter Amount ckBTC/i);

    await act(async () => {
      fireEvent.change(amountInput, { target: { value: "10" } }); // Simulating input change
    });

    expect(amountInput.value).toBe("10"); // Verify the value was correctly updated
  });

  // Test case 4: Verifying that the Max button works correctly
  test("handles Max button click correctly", async () => {
    await act(async () => {
      render(
        <Provider store={store}>
          <MemoryRouter>
            <Repay {...defaultProps} />
          </MemoryRouter>
        </Provider>
      );
    });

    const maxButton = screen.getByText("Max");

    await act(async () => {
      fireEvent.click(maxButton); // Simulate clicking the Max button
    });

    const amountInput = screen.getByPlaceholderText(/Enter Amount ckBTC/i);
    expect(amountInput.value).toBe("50.00000000"); // Check if the amount is set to the maximum borrowable value
  });

  // Test case 5: Verifying that transaction overview information is displayed correctly
  test("displays correct transaction overview information", async () => {
    await act(async () => {
      render(
        <Provider store={store}>
          <MemoryRouter>
            <Repay {...defaultProps} />
          </MemoryRouter>
        </Provider>
      );
    });

    // Verifying various details in the transaction overview
    expect(screen.getByText(/Transaction overview/i)).toBeInTheDocument();
    expect(screen.getByText(/Remaining debt/i)).toBeInTheDocument();
    expect(screen.getByText(/Health Factor/i)).toBeInTheDocument();
    expect(screen.getByText(/Transaction Fee/i)).toBeInTheDocument();
    expect(screen.getByText(/Final amount/i)).toBeInTheDocument();
    expect(screen.getByText(/liquidation at/i)).toBeInTheDocument();
  });

  // Test case 6: Verifying that the USD value for the amount input is displayed correctly
  test("displays USD value for amount input", async () => {
    await act(async () => {
      render(
        <Provider store={store}>
          <MemoryRouter>
            <Repay {...defaultProps} />
          </MemoryRouter>
        </Provider>
      );
    });

    // Initially, USD value should be displayed as $0.00
    expect(screen.getByText("$0.00 USD")).toBeInTheDocument();

    // Entering an amount and checking if the USD value updates
    const amountInput = screen.getByPlaceholderText(/Enter Amount ckBTC/i);

    await act(async () => {
      fireEvent.change(amountInput, { target: { value: "10" } });
    });

    await waitFor(() => {
      expect(screen.queryByText("$0.00 USD")).not.toBeInTheDocument(); // Check if the USD text has been updated
      const usdTexts = screen.getAllByText(/\$.*USD/);
      expect(usdTexts.length).toBeGreaterThan(0); // Verify that USD value is displayed
    });
  });

  // Test case 7: Verifying that the remaining debt is calculated correctly
  test("calculates remaining debt correctly", async () => {
    await act(async () => {
      render(
        <Provider store={store}>
          <MemoryRouter>
            <Repay {...defaultProps} />
          </MemoryRouter>
        </Provider>
      );
    });

    const amountInput = screen.getByPlaceholderText(/Enter Amount ckBTC/i);

    await act(async () => {
      fireEvent.change(amountInput, { target: { value: "10" } }); // Enter an amount for repayment
    });

    await waitFor(() => {
      expect(screen.getByText(/40/)).toBeInTheDocument(); // Check if the remaining debt is calculated
    });
  });

  // Test case 8: Verifying that the health factor is displayed and calculated correctly
  test("displays health factor calculation correctly", async () => {
    await act(async () => {
      render(
        <Provider store={store}>
          <MemoryRouter>
            <Repay {...defaultProps} />
          </MemoryRouter>
        </Provider>
      );
    });

    // Verifying that the initial health factor is displayed
    expect(screen.getByText(/2.50/)).toBeInTheDocument();

    const amountInput = screen.getByPlaceholderText(/Enter Amount ckBTC/i);

    await act(async () => {
      fireEvent.change(amountInput, { target: { value: "10" } });
    });

    await waitFor(() => {
      // Verifying that the health factor is updated correctly after amount change
      expect(screen.getByText(/→/)).toBeInTheDocument();
    });
  });
});
