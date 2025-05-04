import React, { act } from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,

} from "@testing-library/react";
import WithdrawPopup from "../../components/Dashboard/DashboardPopup/WithdrawPopup";
import { Provider } from "react-redux";
import { store } from "../../redux/store";
import { MemoryRouter } from "react-router-dom";

// Mocking react-toastify to simulate toast notifications during tests
jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(), // Mock success toast
    error: jest.fn(), // Mock error toast
    info: jest.fn(), // Mock info toast
  },
}));

// Mocking custom hook for real-time conversion rates
jest.mock("../../components/customHooks/useRealTimeConversionRate", () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({
    conversionRate: 50000 * Math.pow(10, 8), // Mock conversion rate for ckBTC
    error: null,
  }),
}));

// Mocking authentication logic (backendActor)
jest.mock("../../utils/useAuthClient", () => ({
  useAuth: jest.fn().mockReturnValue({
    backendActor: {
      execute_withdraw: jest.fn().mockResolvedValue({ Ok: true }), // Simulating a successful withdraw operation
    },
    principal: "rrkah-fqaaa-aaaaa-aaaaq-cai",
  }),
}));

// Mocking user data hook (health factor and user data)
jest.mock("../../components/customHooks/useUserData", () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({
    userData: {},
    healthFactorBackend: 2.5, // Mock health factor value
    refetchUserData: jest.fn(),
  }),
}));

// Mocking function block status to simulate an unblocked state
jest.mock("../../components/customHooks/useFunctionBlockStatus", () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({
    isBlocked: false, // Simulating that no function is blocked
  }),
}));

// Mocking transfer fee hook to simulate transfer fee data
jest.mock("../../components/customHooks/useTransferFee", () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({
    transferFee: 0.0001, // Mock transfer fee
  }),
}));

// Mocking Principal for dfinity actor integration
jest.mock("@dfinity/principal", () => ({
  Principal: {
    fromText: jest.fn().mockImplementation((text) => ({
      _arr: new Uint8Array(10),
      toString: () => text,
    })),
  },
}));

// Mocking Redux's useSelector for state management
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

describe("WithdrawPopup Component", () => {
  // Clear all mocks before each test to ensure isolated test cases
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Default props passed to WithdrawPopup in each test case
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

  // Test case 1: Verifying that the WithdrawPopup component renders correctly with the necessary content
  test("renders Withdraw component", async () => {
    await act(async () => {
      render(
        <Provider store={store}>
          <MemoryRouter>
            <WithdrawPopup {...defaultProps} />
          </MemoryRouter>
        </Provider>
      );
    });

    // Check for key elements (amount input field, health factor, transaction overview)
    const inputElement = await screen.findByPlaceholderText(
      "Enter Amount ckBTC"
    );
    expect(inputElement).toBeInTheDocument(); // Verify amount input is rendered

    const healthFactorElements = screen.getAllByText(/Health Factor/i);
    expect(healthFactorElements.length).toBeGreaterThan(0); // Verify health factor is displayed

    expect(screen.getByText(/Transaction overview/i)).toBeInTheDocument();
  });

  // Test case 2: Verifying that the withdrawal button is disabled when the amount is 0
  test("disables approval button when amount is 0", async () => {
    await act(async () => {
      render(
        <Provider store={store}>
          <MemoryRouter>
            <WithdrawPopup {...defaultProps} />
          </MemoryRouter>
        </Provider>
      );
    });

    const withdrawButton = screen.getByRole("button", { name: /Withdraw/i });

    expect(withdrawButton).toHaveClass("opacity-50");
    expect(withdrawButton).toHaveClass("cursor-not-allowed"); // Button should be disabled when amount is 0
  });

  // Test case 3: Verifying that the amount input field is handled correctly when changed
  test("handles amount input change correctly", async () => {
    await act(async () => {
      render(
        <Provider store={store}>
          <MemoryRouter>
            <WithdrawPopup {...defaultProps} />
          </MemoryRouter>
        </Provider>
      );
    });

    const amountInput = await screen.findByPlaceholderText(
      "Enter Amount ckBTC"
    );

    // Simulate typing a value into the amount input field
    await act(async () => {
      fireEvent.change(amountInput, { target: { value: "10" } });
    });

    expect(amountInput.value).toBe("10");
  });

  // Test case 4: Verifying that the transaction overview section displays the correct information
  test("displays correct transaction overview information", async () => {
    await act(async () => {
      render(
        <Provider store={store}>
          <MemoryRouter>
            <WithdrawPopup {...defaultProps} />
          </MemoryRouter>
        </Provider>
      );
    });

    expect(screen.getByText(/Transaction overview/i)).toBeInTheDocument();
    expect(screen.getByText(/Supply APY/i)).toBeInTheDocument();
    expect(screen.getByText(/Collateralization/i)).toBeInTheDocument();
    expect(screen.getByText(/Health Factor/i)).toBeInTheDocument();

    expect(screen.getByText(/2.50/i)).toBeInTheDocument();
    expect(screen.getByText(/5.00%/i)).toBeInTheDocument();
  });

  // Test case 5: Verifying that the USD value for the amount input is displayed correctly
  test("displays USD value for amount input", async () => {
    await act(async () => {
      render(
        <Provider store={store}>
          <MemoryRouter>
            <WithdrawPopup {...defaultProps} />
          </MemoryRouter>
        </Provider>
      );
    });

    expect(screen.getByText("$0.00 USD")).toBeInTheDocument();

    const amountInput = await screen.findByPlaceholderText(
      "Enter Amount ckBTC"
    );

    // Simulate changing the amount input and check if the USD value is updated
    await act(async () => {
      fireEvent.change(amountInput, { target: { value: "10" } });
    });

    await waitFor(() => {
      expect(screen.queryByText("$0.00 USD")).not.toBeInTheDocument();
      const usdTexts = screen.getAllByText(/\$.*USD/);
      expect(usdTexts.length).toBeGreaterThan(0); // Ensure that USD value is displayed
    });
  });
});
