import React from 'react';
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import ColateralPopup from "../../components/Dashboard/DashboardPopup/CollateralDisablePopup";
import { Provider } from "react-redux";
import { toast } from "react-toastify";
import * as useAuthModule from "../../utils/useAuthClient";
import * as useFunctionBlockStatusModule from "../../components/customHooks/useFunctionBlockStatus";
import * as useUserDataModule from "../../components/customHooks/useUserData";
import * as useRealTimeConversionRateModule from "../../components/customHooks/useRealTimeConversionRate";

// Mock the store
const mockStore = {
  getState: jest.fn(),
  subscribe: jest.fn(),
  dispatch: jest.fn(),
};

// Mock the required hooks and modules
jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    dismiss: jest.fn(),
  }
}));

describe("ColateralPopup Component", () => {
  const defaultProps = {
    asset: "ckBTC",
    image: "bitcoin.png",
    supplyRateAPR: 5,
    balance: "1000",
    liquidationThreshold: 85,
    reserveliquidationThreshold: 85,
    assetSupply: "2.5",
    assetBorrow: "1.0",
    totalCollateral: "5000",
    totalDebt: "2000",
    currentCollateralStatus: true, // Asset is currently used as collateral
    Ltv: 40,
    borrowableValue: "3000",
    borrowableAssetValue: "3000",
    isModalOpen: true,
    handleModalOpen: jest.fn(),
    setIsModalOpen: jest.fn(),
    onLoadingChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock hook implementations
    jest.spyOn(useFunctionBlockStatusModule, 'default').mockReturnValue({
      isBlocked: false
    });
    
    jest.spyOn(useUserDataModule, 'default').mockReturnValue({
      healthFactorBackend: "3.5"
    });
    
    jest.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      backendActor: {
        toggle_collateral: jest.fn().mockResolvedValue({ Ok: true })
      }
    });
    
    jest.spyOn(useRealTimeConversionRateModule, 'default').mockReturnValue({
      conversionRate: "5000000000", // 50 USD in 1e8 format
      error: null
    });
  });

  test("renders ColateralPopup component with correct initial content", () => {
    render(
      <Provider store={mockStore}>
        <ColateralPopup {...defaultProps} />
      </Provider>
    );
    
    // Check for asset name in heading
    expect(screen.getByText(/Review ckBTC/i)).toBeInTheDocument();
    
    // Check for warning about disabling collateral
    expect(screen.getByText(/Disabling ckBTC as collateral affects your borrowing power and Health Factor./i)).toBeInTheDocument();
    
    // Check for transaction overview section
    expect(screen.getByText(/Transaction overview/i)).toBeInTheDocument();
    
    // Check for supply balance display
    expect(screen.getByText(/Supply Balance/i)).toBeInTheDocument();
    
    // Check for health factor display
    const healthFactorElements = screen.getAllByText(/Health Factor/i);
  expect(healthFactorElements.length).toBeGreaterThan(0);
    
    // Check for button text when disabling collateral
    expect(screen.getByRole('button', { name: /Disable ckBTC as collateral/i })).toBeInTheDocument();
  });

  test("shows correct warning message when enabling collateral", () => {
    render(
      <Provider store={mockStore}>
        <ColateralPopup {...defaultProps} currentCollateralStatus={false} />
      </Provider>
    );
    
    expect(screen.getByText(/Enabling ckBTC as collateral increases your borrowing power and Health Factor/i)).toBeInTheDocument();
    expect(screen.getByText(/it can get liquidated if your health factor drops below 1/i)).toBeInTheDocument();
    
    // Check for button text when enabling collateral
    expect(screen.getByRole('button', { name: /Enable ckBTC as collateral/i })).toBeInTheDocument();
  });

  test("toggles collateral status when button is clicked", async () => {
    const mockToggleCollateral = jest.fn().mockResolvedValue({ Ok: true });
    jest.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      backendActor: {
        toggle_collateral: mockToggleCollateral
      }
    });
    
    render(
      <Provider store={mockStore}>
        <ColateralPopup {...defaultProps} />
      </Provider>
    );
    
    // Click the toggle button
    const toggleButton = screen.getByRole('button', { name: /Disable ckBTC as collateral/i });
    await act(async () => {
      fireEvent.click(toggleButton);
    });
    
    // Check if the toggle_collateral function was called with correct parameters
    expect(mockToggleCollateral).toHaveBeenCalledWith(
      "ckBTC",
      expect.any(Number),
      expect.any(BigInt)
    );
    
    // Check if success toast was shown
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Collateral updated successfully!");
    });
    
    // Check if dispatch was called to refresh dashboard
    expect(mockStore.dispatch).toHaveBeenCalled();
  });

  test("displays error toast when user is blocked from using function", async () => {
    // Mock the user being blocked
    jest.spyOn(useFunctionBlockStatusModule, 'default').mockReturnValue({
      isBlocked: true
    });
    
    render(
      <Provider store={mockStore}>
        <ColateralPopup {...defaultProps} />
      </Provider>
    );
    
    const toggleButton = screen.getByRole('button', { name: /Disable ckBTC as collateral/i });
    await act(async () => {
      fireEvent.click(toggleButton);
    });
    
    expect(toast.error).toHaveBeenCalledWith(
      "You are temporarily blocked from using this function",
      expect.any(Object)
    );
  });

  test("shows warning when health factor is less than or equal to 1", async () => {
    // Mock health factor calculation to return a value <= 1
    const lowHealthFactorProps = {
      ...defaultProps,
      totalCollateral: "1000", 
      totalDebt: "1000",
      liquidationThreshold: 80,
      assetSupply: "1.0"
    };
    
    jest.spyOn(useUserDataModule, 'default').mockReturnValue({
      healthFactorBackend: "0.9"
    });
    
    render(
      <Provider store={mockStore}>
        <ColateralPopup {...lowHealthFactorProps} />
      </Provider>
    );
    
    // Check for the warning icon and message
    await waitFor(() => {
      expect(screen.getByText(/Switching collateral may trigger a liquidation call/i)).toBeInTheDocument();
    });
    
    // Verify the toast warning was shown
    expect(toast.info).toHaveBeenCalledWith(
      "Health Factor Less than 1",
      expect.any(Object)
    );
    
    // Check that the button is disabled
    const toggleButton = screen.getByRole('button', { name: /Disable ckBTC as collateral/i });
    expect(toggleButton).toHaveAttribute('disabled');
  });
});