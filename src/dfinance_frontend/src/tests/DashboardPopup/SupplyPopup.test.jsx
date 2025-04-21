import React from 'react';
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { Provider } from "react-redux";
import SupplyPopup from '../../components/Dashboard/DashboardPopup/SupplyPopup';

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
      execute_supply: jest.fn().mockResolvedValue({ Ok: true }),  // Success mock
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

describe("SupplyPopup Component", () => {
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

  // Test: Render Supply component
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
  
    // Correct usage: await findByPlaceholderText
    const inputElement = await screen.findByPlaceholderText("Enter ckBTC Amount");
    expect(inputElement).toBeInTheDocument();
  
    // Use getAllByText to find all instances of the "Health Factor" text
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
            <SupplyPopup {...defaultProps} />
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
            <SupplyPopup {...defaultProps} />
          </MemoryRouter>
        </Provider>
      );
    });
  
     const amountInput = await screen.findByPlaceholderText("Enter ckBTC Amount");

    
    await act(async () => {
      fireEvent.change(amountInput, { target: { value: '10' } });
    });
    
    expect(amountInput.value).toBe('10');
  });

  // Test: Verify Max button functionality
  
  

  // Test: Verify transaction overview displays correct information
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
  
    // Check for the "Transaction overview" section
    expect(screen.getByText(/Transaction overview/i)).toBeInTheDocument();
  
    // Check that each part of the transaction overview is displayed correctly
    expect(screen.getByText(/Supply APY/i)).toBeInTheDocument();
    expect(screen.getByText(/Collateralization/i)).toBeInTheDocument();
    expect(screen.getByText(/Health Factor/i)).toBeInTheDocument();
    expect(screen.getByText(/Transaction Fee/i)).toBeInTheDocument();
    expect(screen.getByText(/Final amount/i)).toBeInTheDocument();
    
    // Health Factor and other numeric values should be rendered
    expect(screen.getByText(/2.50/i)).toBeInTheDocument();  // Health factor
    expect(screen.getByText(/5.00%/i)).toBeInTheDocument();  // Supply APY
    expect(screen.getByText(/0.0001/i)).toBeInTheDocument();  // Transaction Fee
    expect(screen.getByText(/0.00000000/i)).toBeInTheDocument();  // Final amount
  });

  // Test: Verify USD value calculation
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
    
    expect(screen.getByText("$0.00 USD")).toBeInTheDocument();
    
     const amountInput = await screen.findByPlaceholderText("Enter ckBTC Amount");

    
    await act(async () => {
      fireEvent.change(amountInput, { target: { value: '10' } });
    });
    
    await waitFor(() => {
      expect(screen.queryByText("$0.00 USD")).not.toBeInTheDocument();
      const usdTexts = screen.getAllByText(/\$.*USD/);
      expect(usdTexts.length).toBeGreaterThan(0);
    });
  });

  // Test: Verify remaining debt calculation
  

  // Test: Verify health factor calculation and display
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
    
    expect(screen.getByText(/2.50/)).toBeInTheDocument();
    
     const amountInput = await screen.findByPlaceholderText("Enter ckBTC Amount");

    
    await act(async () => {
      fireEvent.change(amountInput, { target: { value: '10' } });
    });
    
    await waitFor(() => {
      expect(screen.getByText(/→/)).toBeInTheDocument();
    });
  });
});
