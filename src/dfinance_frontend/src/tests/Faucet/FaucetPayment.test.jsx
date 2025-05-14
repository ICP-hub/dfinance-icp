import React,{ act } from "react";
import {
  render,
  screen,
  fireEvent
} from "@testing-library/react";
import { Provider } from "react-redux";
import { store } from "../../redux/store";
import { MemoryRouter } from "react-router-dom";
import FaucetPopup from "../../components/Faucet/FaucetPopup";
import { toast } from "react-toastify";

// Mock required modules
jest.mock("../../utils/useAuthClient", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../../components/customHooks/useFetchConversionRate", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../../components/customHooks/useUserData", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../../components/customHooks/useFunctionBlockStatus", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("../../redux/reducers/faucetUpdateReducer", () => ({
  toggleRefresh: jest.fn(),
}));

jest.mock("../../components/Faucet/FaucetPayment", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(({ asset, amount, onClose }) => (
    <div data-testid="faucet-payment">
      <span>
        Payment for {amount} {asset}
      </span>
      <button onClick={onClose}>Close Payment</button>
    </div>
  )),
}));

describe("FaucetPopup Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Set up mocks for each test
    const { useAuth } = require("../../utils/useAuthClient");
    useAuth.mockReturnValue({
      backendActor: {
        faucet: jest.fn().mockResolvedValue({ Ok: true }),
      },
      principal: "rrkah-fqaaa-aaaaa-aaaaq-cai",
    });

    const useFetchConversionRate =
      require("../../components/CustomHooks/useFetchConversionRate").default;
    useFetchConversionRate.mockReturnValue({
      ckBTCUsdRate: 50000,
      ckETHUsdRate: 4000,
      ckUSDCUsdRate: 1,
      ckICPUsdRate: 5,
      ckUSDTUsdRate: 1,
      fetchConversionRate: jest.fn().mockResolvedValue({}),
      fetchBalance: jest.fn().mockResolvedValue({}),
    });

    const useUserData =
      require("../../components/CustomHooks/useUserData").default;
    useUserData.mockReturnValue({
      userData: {
        Ok: {
          reserves: [
            [
              [
                "ckBTC",
                {
                  faucet_limit: 50000000000,
                  faucet_usage: 10000000000,
                },
              ],
              [
                "ckETH",
                {
                  faucet_limit: 50000000000,
                  faucet_usage: 5000000000,
                },
              ],
              [
                "ckUSDC",
                {
                  faucet_limit: 50000000000,
                  faucet_usage: 20000000000,
                },
              ],
              [
                "ICP",
                {
                  faucet_limit: 50000000000,
                  faucet_usage: 15000000000,
                },
              ],
              [
                "ckUSDT",
                {
                  faucet_limit: 50000000000,
                  faucet_usage: 25000000000,
                },
              ],
            ],
          ],
        },
      },
    });

    const useFunctionBlockStatus =
      require("../../components/CustomHooks/useFunctionBlockStatus").default;
    useFunctionBlockStatus.mockReturnValue({
      isBlocked: false,
    });
  });

  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    asset: "ckBTC",
    assetImage: "bitcoin.png",
  };

  // Test: Disable faucet button when amount is 0 or empty
  test("disables faucet button when amount is 0 or empty", async () => {
    await act(async () => {
      render(
        <Provider store={store}>
          <MemoryRouter>
            <FaucetPopup {...defaultProps} />
          </MemoryRouter>
        </Provider>
      );
    });

    const faucetButton = screen.getByRole("button", { name: /Faucet ckBTC/i });
    expect(faucetButton).toHaveClass("opacity-50");
    expect(faucetButton).toHaveClass("cursor-not-allowed");
  });

  // Test: Verify amount input handling
  test("handles amount input change correctly", async () => {
    await act(async () => {
      render(
        <Provider store={store}>
          <MemoryRouter>
            <FaucetPopup {...defaultProps} />
          </MemoryRouter>
        </Provider>
      );
    });

    const amountInput = screen.getByPlaceholderText(/Enter Amount/i);

    await act(async () => {
      fireEvent.change(amountInput, { target: { value: "0.5" } });
    });

    expect(amountInput.value).toBe("0.5");
  });

  // Test: Max amount button functionality
  test("sets maximum amount when max button is clicked", async () => {
    await act(async () => {
      render(
        <Provider store={store}>
          <MemoryRouter>
            <FaucetPopup {...defaultProps} />
          </MemoryRouter>
        </Provider>
      );
    });

    const maxButton = screen.getByText(/Max$/i);
    const amountInput = screen.getByPlaceholderText(/Enter Amount/i);

    await act(async () => {
      fireEvent.click(maxButton);
    });

    // Input should now have a value (the exact format depends on your implementation)
    expect(amountInput.value).not.toBe("");
  });

  // Test: Verify closing functionality
  test("closes popup when close button is clicked", async () => {
    await act(async () => {
      render(
        <Provider store={store}>
          <MemoryRouter>
            <FaucetPopup {...defaultProps} />
          </MemoryRouter>
        </Provider>
      );
    });

    const closeButton = screen.getByRole("button", { name: "" }); // X button has no text

    await act(async () => {
      fireEvent.click(closeButton);
    });

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  // Test: Error handling when faucet request fails
  test("handles faucet request error", async () => {
    // Override the mock for this specific test
    const { useAuth } = require("../../utils/useAuthClient");
    useAuth.mockReturnValue({
      backendActor: {
        faucet: jest.fn().mockResolvedValue({ Err: "AmountTooMuch" }),
      },
      principal: "rrkah-fqaaa-aaaaa-aaaaq-cai",
    });

    await act(async () => {
      render(
        <Provider store={store}>
          <MemoryRouter>
            <FaucetPopup {...defaultProps} />
          </MemoryRouter>
        </Provider>
      );
    });

    // Set an amount
    const amountInput = screen.getByPlaceholderText(/Enter Amount/i);
    const faucetButton = screen.getByRole("button", { name: /Faucet ckBTC/i });

    await act(async () => {
      fireEvent.change(amountInput, { target: { value: "0.5" } });
    });

    // Now execute the faucet action which should error
    await act(async () => {
      fireEvent.click(faucetButton);
    });

    // Check if toast error was called
    expect(toast.error).toHaveBeenCalled();
  });

  // Test: Checking for temporary block status
  test("handles temporary block status", async () => {
    // Override the mocks for function block status
    const useFunctionBlockStatus =
      require("../../components/CustomHooks/useFunctionBlockStatus").default;
    useFunctionBlockStatus.mockReturnValue({
      isBlocked: true,
    });

    await act(async () => {
      render(
        <Provider store={store}>
          <MemoryRouter>
            <FaucetPopup {...defaultProps} />
          </MemoryRouter>
        </Provider>
      );
    });

    // Set an amount
    const amountInput = screen.getByPlaceholderText(/Enter Amount/i);
    const faucetButton = screen.getByRole("button", { name: /Faucet ckBTC/i });

    await act(async () => {
      fireEvent.change(amountInput, { target: { value: "0.5" } });
    });

    // Now execute the faucet action which should be blocked
    await act(async () => {
      fireEvent.click(faucetButton);
    });

    // Should show blocked message
    expect(toast.error).toHaveBeenCalledWith(
      "You are temporarily blocked from using this function",
      expect.any(Object)
    );
  });

  // Test: Handles out of cycles error
  test("displays proper message for out of cycles error", async () => {
    // Override the mock for this specific test
    const { useAuth } = require("../../utils/useAuthClient");
    useAuth.mockReturnValue({
      backendActor: {
        faucet: jest.fn().mockRejectedValue(new Error("out of cycles")),
      },
      principal: "rrkah-fqaaa-aaaaa-aaaaq-cai",
    });

    await act(async () => {
      render(
        <Provider store={store}>
          <MemoryRouter>
            <FaucetPopup {...defaultProps} />
          </MemoryRouter>
        </Provider>
      );
    });

    // Set an amount
    const amountInput = screen.getByPlaceholderText(/Enter Amount/i);
    const faucetButton = screen.getByRole("button", { name: /Faucet ckBTC/i });

    await act(async () => {
      fireEvent.change(amountInput, { target: { value: "0.5" } });
      fireEvent.click(faucetButton);
    });

    // Should show out of cycles message
    expect(toast.error).toHaveBeenCalledWith(
      "Canister is out of cycles. Please wait, the admin has been notified.",
      expect.any(Object)
    );
  });
});
