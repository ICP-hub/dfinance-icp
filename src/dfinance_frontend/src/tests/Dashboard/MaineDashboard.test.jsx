import React from "react";
import { render, screen } from "@testing-library/react";
import MainDashboard from "../../pages/Dashboard/MainDashboard";
import { BrowserRouter as Router } from "react-router-dom"; 
import { Provider } from "react-redux";
import { store } from "../../redux/store"; 
import { useAuth } from "../../utils/useAuthClient";  
import useAssetData from "../../components/customHooks/useAssets";  

jest.mock("../../utils/useAuthClient", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../../components/customHooks/useAssets", () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({
    loading: false,  
    filteredItems: [["ckBTC", { Ok: { asset_supply: 100000000, asset_borrow: 50000000 } }]],
  })
}));

jest.mock("../../components/Common/Loading", () => ({
  __esModule: true,
  default: ({ isLoading }) => (
    <div>{isLoading ? "Loading..." : "Not Loading"}</div>
  ),
}));

jest.mock("../../components/Layout/Navbar", () => () => <div>Navbar</div>);
jest.mock("../../components/Layout/Footer", () => () => <div>Footer</div>);
jest.mock("../../components/Dashboard/DashboardNav", () => () => (
  <div>DashboardNav</div>
));

describe("MainDashboard Component", () => {
  test("renders Navbar, Footer, and children", () => {
    useAuth.mockReturnValue({ isAuthenticated: true });

    render(
      <Provider store={store}>
        <Router>
          <MainDashboard isDGov={false} includeDashboardNav={true}>
            <div>Test Child</div>
          </MainDashboard>
        </Router>
      </Provider>
    );

    expect(screen.getByText("Navbar")).toBeInTheDocument();
    expect(screen.getByText("Footer")).toBeInTheDocument();
    expect(screen.getByText("Test Child")).toBeInTheDocument();
  });

  test("displays loading state when isLoadingPage is true", async () => {
    useAuth.mockReturnValue({ isAuthenticated: true });
    useAssetData.mockReturnValue({ loading: true });

    render(
      <Provider store={store}>
        <Router>
          <MainDashboard isDGov={false} includeDashboardNav={true}>
            <div>Test Child</div>
          </MainDashboard>
        </Router>
      </Provider>
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  
  test("renders children and DashboardNav when includeDashboardNav is true", () => {
    useAuth.mockReturnValue({ isAuthenticated: true });
    useAssetData.mockReturnValue({ loading: false });

    render(
      <Provider store={store}>
        <Router>
          <MainDashboard isDGov={false} includeDashboardNav={true}>
            <div>Test Child</div>
          </MainDashboard>
        </Router>
      </Provider>
    );

    expect(screen.getByText("DashboardNav")).toBeInTheDocument();
  });

  test("renders children without DashboardNav when includeDashboardNav is false", () => {
    useAuth.mockReturnValue({ isAuthenticated: true });
    useAssetData.mockReturnValue({ loading: false });

    render(
      <Provider store={store}>
        <Router>
          <MainDashboard isDGov={false} includeDashboardNav={false}>
            <div>Test Child</div>
          </MainDashboard>
        </Router>
      </Provider>
    );

    expect(screen.queryByText("DashboardNav")).toBeNull();
  });

  test("renders children without DashboardNav for isDGov page", () => {
    useAuth.mockReturnValue({ isAuthenticated: true });
    useAssetData.mockReturnValue({ loading: false });

    render(
      <Provider store={store}>
        <Router>
          <MainDashboard isDGov={true} includeDashboardNav={true}>
            <div>Test Child</div>
          </MainDashboard>
        </Router>
      </Provider>
    );

    expect(screen.queryByText("DashboardNav")).toBeNull();
  });
});
