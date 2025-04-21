import React from 'react';
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import WithdrawPopup from '../../components/Dashboard/DashboardPopup/WithdrawPopup';
import { Provider } from "react-redux";
import { store } from "../../redux/store";
import { MemoryRouter } from "react-router-dom";
import { toast } from "react-toastify";

// Mock toast notifications
jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  }
}));

// Mock required modules
jest.mock("../../components/customHooks/useRealTimeConversionRate", () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({
    conversionRate: 50000 * Math.pow(10, 8), // Return rates in correct format for the component
    error: null
  })
}));

jest.mock("../../utils/useAuthClient", () => ({
  useAuth: jest.fn().mockReturnValue({
    backendActor: {
      execute_withdraw: jest.fn().mockResolvedValue({ Ok: true }),  // Success mock
    },
    principal: "rrkah-fqaaa-aaaaa-aaaaq-cai"
  })
}));

jest.mock("../../components/customHooks/useUserData", () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({
    userData: {}, 
    healthFactorBackend: 2.5,
    refetchUserData: jest.fn()
  })
}));

jest.mock("../../components/customHooks/useFunctionBlockStatus", () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({
    isBlocked: false
  })
}));

// Mock redux state
jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useSelector: jest.fn().mockImplementation(callback => {
    return callback({
      ledger: {
        ckBTC: {
          icrc2_approve: jest.fn().mockResolvedValue({ Ok: true })
        },
        ckETH: {
          icrc2_approve: jest.fn().mockResolvedValue({ Ok: true })
        },
        ckUSDC: {
          icrc2_approve: jest.fn().mockResolvedValue({ Ok: true })
        },
        ICP: {
          icrc2_approve: jest.fn().mockResolvedValue({ Ok: true })
        },
        ckUSDT: {
          icrc2_approve: jest.fn().mockResolvedValue({ Ok: true })
        }
      },
      sound: {
        isSoundOn: true
      },
      fees: {
        fees: {
          ckBTC: 0.0001,
          ckETH: 0.0001,
          ckUSDC: 0.0001,
          ICP: 0.0001,
          ckUSDT: 0.0001
        }
      }
    });
  }),
  useDispatch: () => jest.fn()
}));

describe("WithdrawPopup Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

  // Test: Render Withdraw component
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

    const inputElement = await screen.findByPlaceholderText("Enter Amount ckBTC");

    expect(inputElement).toBeInTheDocument();

    const healthFactorElements = screen.getAllByText(/Health Factor/i);
    expect(healthFactorElements.length).toBeGreaterThan(0);  // Expect at least one element to be present

    expect(screen.getByText(/Transaction overview/i)).toBeInTheDocument();
  });

  // Test: Disable approval button when amount is 0
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
  
    const withdrawButton = screen.getByRole('button', { name: /Withdraw/i });
  
    // Check if the button has the disabled visual class (opacity-50 and cursor-not-allowed)
    expect(withdrawButton).toHaveClass('opacity-50');
    expect(withdrawButton).toHaveClass('cursor-not-allowed');
  });
  
  

  // Test: Verify amount input handling
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

    const amountInput = await screen.findByPlaceholderText("Enter Amount ckBTC");


    await act(async () => {
      fireEvent.change(amountInput, { target: { value: '10' } });
    });

    expect(amountInput.value).toBe('10');
  });

  // Test: Verify transaction overview displays correct information
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

    // Check for the "Transaction overview" section
    expect(screen.getByText(/Transaction overview/i)).toBeInTheDocument();

    // Check that each part of the transaction overview is displayed correctly
    expect(screen.getByText(/Supply APY/i)).toBeInTheDocument();
    expect(screen.getByText(/Collateralization/i)).toBeInTheDocument();
    expect(screen.getByText(/Health Factor/i)).toBeInTheDocument();

    // Health Factor and other numeric values should be rendered
    expect(screen.getByText(/2.50/i)).toBeInTheDocument();  // Health factor
    expect(screen.getByText(/5.00%/i)).toBeInTheDocument();  // Supply APY
  });

  // Test: Verify USD value calculation
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

    const amountInput = await screen.findByPlaceholderText("Enter Amount ckBTC");


    await act(async () => {
      fireEvent.change(amountInput, { target: { value: '10' } });
    });

    await waitFor(() => {
      expect(screen.queryByText("$0.00 USD")).not.toBeInTheDocument();
      const usdTexts = screen.getAllByText(/\$.*USD/);
      expect(usdTexts.length).toBeGreaterThan(0);
    });
  });

  // Test: Verify withdraw button click
 
});
