import React from 'react';
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import Repay from "../../components/Dashboard/DashboardPopup/Repay";
import { Provider } from "react-redux";
import { store } from "../../redux/store";
import { MemoryRouter } from "react-router-dom";

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
  
    expect(screen.getByRole('heading', { name: /Repay ckBTC/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter Amount ckBTC/i)).toBeInTheDocument();
    expect(screen.getByText(/Transaction overview/i)).toBeInTheDocument();
    expect(screen.getByText(/Health Factor/i)).toBeInTheDocument();
  });

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
    
    const amountInput = screen.getByPlaceholderText(/Enter Amount ckBTC/i);
    expect(amountInput.value).toBe('50.00000000');
  });

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
    
    expect(screen.getByText("$0.00 USD")).toBeInTheDocument();
    
    // Enter an amount 
    const amountInput = screen.getByPlaceholderText(/Enter Amount ckBTC/i);
    
    await act(async () => {
      fireEvent.change(amountInput, { target: { value: '10' } });
    });
    
    await waitFor(() => {
      expect(screen.queryByText("$0.00 USD")).not.toBeInTheDocument();
      const usdTexts = screen.getAllByText(/\$.*USD/);
      expect(usdTexts.length).toBeGreaterThan(0);
    });
  });

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
    
    await waitFor(() => {
      expect(screen.getByText(/40/)).toBeInTheDocument();
    });
  });

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
    
    expect(screen.getByText(/2.50/)).toBeInTheDocument();
    
    const amountInput = screen.getByPlaceholderText(/Enter Amount ckBTC/i);
    
    await act(async () => {
      fireEvent.change(amountInput, { target: { value: '10' } });
    });
    
    await waitFor(() => {
      expect(screen.getByText(/→/)).toBeInTheDocument();
    });
  });


  
});