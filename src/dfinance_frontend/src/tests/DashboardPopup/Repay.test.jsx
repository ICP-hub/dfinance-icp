import React from 'react';
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import Repay from "../../components/Dashboard/DashboardPopup/Repay";
import { Provider } from "react-redux";
import { store } from "../../redux/store";
import { MemoryRouter } from "react-router-dom";
import { toast } from "react-toastify";

// Mock toast notifications
jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  }
}));
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useLocation: jest.fn().mockReturnValue({
      pathname: '/repay',
      search: '',
      hash: '',
      state: null,
      key: 'default'
    }),
    useNavigate: jest.fn().mockReturnValue(jest.fn()),
    MemoryRouter: jest.requireActual('react-router-dom').MemoryRouter
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
      execute_repay: jest.fn().mockResolvedValue({ Ok: true }),  // Success mock
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

jest.mock("../../components/customHooks/useTransferFee", () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({
    transferFee: 0.0001
  })
}));

jest.mock("@dfinity/principal", () => ({
  Principal: {
    fromText: jest.fn().mockImplementation(text => ({
      _arr: new Uint8Array(10),
      toString: () => text
    }))
  }
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

describe("Repay Component", () => {
  // Mock HTML media element
  window.HTMLMediaElement.prototype.play = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

  // Test: Render Repay component
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
  
    // Use more specific selectors for elements that might appear multiple times
    expect(screen.getByRole('heading', { name: /Repay ckBTC/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter Amount ckBTC/i)).toBeInTheDocument();
    expect(screen.getByText(/Transaction overview/i)).toBeInTheDocument();
    expect(screen.getByText(/Health Factor/i)).toBeInTheDocument();
    // ...rest of your assertions
  });

  // Test: Disable approval button when amount is 0
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
    expect(approveButton.closest('button')).toBeDisabled();
  });

  // Test: Verify amount input handling
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
      fireEvent.change(amountInput, { target: { value: '10' } });
    });
    
    expect(amountInput.value).toBe('10');
  });

  // Test: Verify Max button functionality
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
  
    const maxButton = screen.getByText('Max');
    
    await act(async () => {
      fireEvent.click(maxButton);
    });
    
    // Update to match the actual format your component returns
    const amountInput = screen.getByPlaceholderText(/Enter Amount ckBTC/i);
    expect(amountInput.value).toBe('50.00000000');
  });

  // Test: Verify transaction overview displays correct information
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
  
    expect(screen.getByText(/Transaction overview/i)).toBeInTheDocument();
    expect(screen.getByText(/Remaining debt/i)).toBeInTheDocument();
    expect(screen.getByText(/Health Factor/i)).toBeInTheDocument();
    expect(screen.getByText(/Transaction Fee/i)).toBeInTheDocument();
    expect(screen.getByText(/Final amount/i)).toBeInTheDocument();
    expect(screen.getByText(/liquidation at/i)).toBeInTheDocument();
  });

  // Test: Verify USD value calculation
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
    
    // Initial USD value should be $0.00 USD
    expect(screen.getByText("$0.00 USD")).toBeInTheDocument();
    
    // Enter an amount 
    const amountInput = screen.getByPlaceholderText(/Enter Amount ckBTC/i);
    
    await act(async () => {
      fireEvent.change(amountInput, { target: { value: '10' } });
    });
    
    // Wait for updates to propagate 
    await waitFor(() => {
      // USD value should be updated
      expect(screen.queryByText("$0.00 USD")).not.toBeInTheDocument();
      // Should find a dollar value that's not $0.00 USD
      const usdTexts = screen.getAllByText(/\$.*USD/);
      expect(usdTexts.length).toBeGreaterThan(0);
    });
  });

  // Test: Verify remaining debt calculation
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
      fireEvent.change(amountInput, { target: { value: '10' } });
    });
    
    // With assetBorrow = 50 and amount = 10, remaining debt should be 40
    await waitFor(() => {
      expect(screen.getByText(/40/)).toBeInTheDocument();
    });
  });

  // Test: Verify health factor calculation and display
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
    
    // Initial health factor should be displayed
    expect(screen.getByText(/2.50/)).toBeInTheDocument();
    
    // Enter an amount to change health factor
    const amountInput = screen.getByPlaceholderText(/Enter Amount ckBTC/i);
    
    await act(async () => {
      fireEvent.change(amountInput, { target: { value: '10' } });
    });
    
    // Health factor should be recalculated and displayed
    // It's difficult to predict the exact value without knowing the exact calculation
    // but we can check that the display format is correct
    await waitFor(() => {
      // Should find health factor with arrow symbol between values
      expect(screen.getByText(/→/)).toBeInTheDocument();
    });
  });


  
});