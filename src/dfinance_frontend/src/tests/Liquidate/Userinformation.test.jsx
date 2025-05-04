import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import UserInformationPopup from "../../components/Liquidate/UserInformation";
import { Provider } from "react-redux";
import { store } from "../../redux/store";

// Mock necessary modules
jest.mock("../../utils/useAuthClient", () => ({
  useAuth: jest.fn().mockReturnValue({
    principal: "rrkah-fqaaa-aaaaa-aaaaq-cai",
  }),
}));

jest.mock("../../components/customHooks/useAssets", () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({
    assets: ["ckBTC", "ckETH", "ckUSDC", "ICP", "ckUSDT"],
  }),
}));

jest.mock("../../components/customHooks/useFetchConversionRate", () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({
    ckBTCUsdRate: 50000,
    ckETHUsdRate: 4000,
    ckUSDCUsdRate: 1,
    ckICPUsdRate: 5,
    ckUSDTUsdRate: 1,
  }),
}));

// Test if the component renders correctly
test("renders UserInformationPopup component", () => {
  render(
    <Provider store={store}>
      <UserInformationPopup
        onClose={() => { }}
        mappedItem={{ principal: { _arr: ["rrkah-fqaaa-aaaaa-aaaaq-cai"] } }}
      />
    </Provider>
  );

  expect(screen.getByText("User Information")).toBeInTheDocument();
});

// Test if the user principal is rendered
test("renders user principal", () => {
  render(
    <Provider store={store}>
      <UserInformationPopup
        onClose={() => { }}
        mappedItem={{ principal: { _arr: ["rrkah-fqaaa-aaaaa-aaaaq-cai"] } }}
      />
    </Provider>
  );

  expect(screen.getByText("rrkah-fqaaa-aaaaa-aaaaq-cai")).toBeInTheDocument();
});

test("clicking the Next button", () => {
  render(
    <Provider store={store}>
      <UserInformationPopup
        onClose={() => { }}
        mappedItem={{ principal: { _arr: ["rrkah-fqaaa-aaaaa-aaaaq-cai"] } }}
      />
    </Provider>
  );

  // Use getByText if the button's text is static and exactly known
  const nextButton = screen.getByText("NEXT");
  fireEvent.click(nextButton);
});
