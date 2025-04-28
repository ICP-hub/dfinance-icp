import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import ColateralPopup from "../../components/Dashboard/DashboardPopup/CollateralDisablePopup"; 
import { Provider } from "react-redux"; 
import { toast } from "react-toastify"; 
import * as useAuthModule from "../../utils/useAuthClient"; 
import * as useFunctionBlockStatusModule from "../../components/customHooks/useFunctionBlockStatus"; 
import * as useUserDataModule from "../../components/customHooks/useUserData"; 
import * as useRealTimeConversionRateModule from "../../components/customHooks/useRealTimeConversionRate"; 

// Mocking Redux store for the test
const mockStore = {
  getState: jest.fn(),
  subscribe: jest.fn(),
  dispatch: jest.fn(),
};

// Mocking toast notifications
jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    dismiss: jest.fn(),
  },
}));

describe("ColateralPopup Component", () => {
  // Default props to be used in multiple test cases
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
    currentCollateralStatus: true, // Mock status of collateral (enabled)
    Ltv: 40,
    borrowableValue: "3000",
    borrowableAssetValue: "3000",
    isModalOpen: true, // Modal is open by default
    handleModalOpen: jest.fn(), // Mocked modal open handler
    setIsModalOpen: jest.fn(), // Mocked setter for modal open state
    onLoadingChange: jest.fn(), // Mocked loading state change handler
  };

  // Reset mocks before each test case
  beforeEach(() => {
    jest.clearAllMocks();

    // Mocking the function block status to not be blocked
    jest.spyOn(useFunctionBlockStatusModule, "default").mockReturnValue({
      isBlocked: false,
    });

    // Mocking user data, particularly health factor value
    jest.spyOn(useUserDataModule, "default").mockReturnValue({
      healthFactorBackend: "3.5",
    });

    // Mocking authentication logic, particularly backendActor's collateral toggle function
    jest.spyOn(useAuthModule, "useAuth").mockReturnValue({
      backendActor: {
        toggle_collateral: jest.fn().mockResolvedValue({ Ok: true }), // Simulating successful collateral toggle
      },
    });

    // Mocking real-time conversion rate to return a sample conversion rate
    jest.spyOn(useRealTimeConversionRateModule, "default").mockReturnValue({
      conversionRate: "5000000000", // Mock conversion rate
      error: null,
    });
  });

  // Test case 1: Verify the component renders with correct initial content
  test("renders ColateralPopup component with correct initial content", () => {
    render(
      <Provider store={mockStore}>
        <ColateralPopup {...defaultProps} />
      </Provider>
    );

    // Verifying that key text elements are displayed in the component
    expect(screen.getByText(/Review ckBTC/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Disabling ckBTC as collateral affects your borrowing power and Health Factor./i
      )
    ).toBeInTheDocument();
    expect(screen.getByText(/Transaction overview/i)).toBeInTheDocument();
    expect(screen.getByText(/Supply Balance/i)).toBeInTheDocument();

    // Verifying that the health factor text is present
    const healthFactorElements = screen.getAllByText(/Health Factor/i);
    expect(healthFactorElements.length).toBeGreaterThan(0);

    // Verifying that the button to disable collateral is rendered
    expect(
      screen.getByRole("button", { name: /Disable ckBTC as collateral/i })
    ).toBeInTheDocument();
  });

  // Test case 2: Verify the correct warning message is shown when enabling collateral
  test("shows correct warning message when enabling collateral", () => {
    render(
      <Provider store={mockStore}>
        <ColateralPopup {...defaultProps} currentCollateralStatus={false} />
      </Provider>
    );

    // Verifying that enabling collateral triggers the correct warning message
    expect(
      screen.getByText(
        /Enabling ckBTC as collateral increases your borrowing power and Health Factor/i
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /it can get liquidated if your health factor drops below 1/i
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Enable ckBTC as collateral/i })
    ).toBeInTheDocument();
  });

  // Test case 3: Verify the collateral status toggles correctly when the button is clicked
  test("toggles collateral status when button is clicked", async () => {
    const mockToggleCollateral = jest.fn().mockResolvedValue({ Ok: true });
    jest.spyOn(useAuthModule, "useAuth").mockReturnValue({
      backendActor: {
        toggle_collateral: mockToggleCollateral,
      },
    });

    render(
      <Provider store={mockStore}>
        <ColateralPopup {...defaultProps} />
      </Provider>
    );

    const toggleButton = screen.getByRole("button", {
      name: /Disable ckBTC as collateral/i,
    });

    // Simulating button click to toggle collateral status
    await act(async () => {
      fireEvent.click(toggleButton);
    });

    // Verifying that the toggle_collateral function is called with appropriate arguments
    expect(mockToggleCollateral).toHaveBeenCalledWith(
      "ckBTC",
      expect.any(Number),
      expect.any(BigInt)
    );

    // Verifying the success toast message is shown
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Collateral updated successfully!"
      );
    });

    // Verifying that the mockStore dispatch function is called
    expect(mockStore.dispatch).toHaveBeenCalled();
  });

  // Test case 4: Verify error toast is shown when the user is blocked from using the function
  test("displays error toast when user is blocked from using function", async () => {
    jest.spyOn(useFunctionBlockStatusModule, "default").mockReturnValue({
      isBlocked: true,
    });

    render(
      <Provider store={mockStore}>
        <ColateralPopup {...defaultProps} />
      </Provider>
    );

    const toggleButton = screen.getByRole("button", {
      name: /Disable ckBTC as collateral/i,
    });
    await act(async () => {
      fireEvent.click(toggleButton);
    });

    // Verifying that an error toast is shown when the user is blocked
    expect(toast.error).toHaveBeenCalledWith(
      "You are temporarily blocked from using this function",
      expect.any(Object)
    );
  });

  // Test case 5: Verify warning when health factor is below 1
  test("shows warning when health factor is less than or equal to 1", async () => {
    const lowHealthFactorProps = {
      ...defaultProps,
      totalCollateral: "1000",
      totalDebt: "1000",
      liquidationThreshold: 80,
      assetSupply: "1.0",
    };

    jest.spyOn(useUserDataModule, "default").mockReturnValue({
      healthFactorBackend: "0.9", // Mocked low health factor value
    });

    render(
      <Provider store={mockStore}>
        <ColateralPopup {...lowHealthFactorProps} />
      </Provider>
    );

    // Verifying that the liquidation warning is displayed
    await waitFor(() => {
      expect(
        screen.getByText(/Switching collateral may trigger a liquidation call/i)
      ).toBeInTheDocument();
    });

    // Verifying that an info toast is shown for low health factor
    expect(toast.info).toHaveBeenCalledWith(
      "Health Factor Less than 1",
      expect.any(Object)
    );

    // Verifying that the button is disabled when health factor is low
    const toggleButton = screen.getByRole("button", {
      name: /Disable ckBTC as collateral/i,
    });
    expect(toggleButton).toHaveAttribute("disabled");
  });
});
