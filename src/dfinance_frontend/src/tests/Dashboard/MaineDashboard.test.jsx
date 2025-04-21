import React from "react";
import { render, screen } from "@testing-library/react";
import MainDashboard from "../../pages/Dashboard/MainDashboard";
import { BrowserRouter as Router } from "react-router-dom"; // For Router-based components
import { Provider } from "react-redux";
import { store } from "../../redux/store"; // Your Redux store
import { useAuth } from "../../utils/useAuthClient";  // Mocking the hook
import useAssetData from "../../components/customHooks/useAssets";  // Correct import of the hook
import Loading from "../../components/Common/Loading";

// Mocking necessary hooks and components
jest.mock("../../utils/useAuthClient", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../../components/customHooks/useAssets", () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({
    loading: false,  // mock the loading state or whatever values you need for your test
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
    // Mock the useAuth hook to simulate authentication status
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

    // Check if Navbar, Footer, and children are rendered
    expect(screen.getByText("Navbar")).toBeInTheDocument();
    expect(screen.getByText("Footer")).toBeInTheDocument();
    expect(screen.getByText("Test Child")).toBeInTheDocument();
  });

  test("displays loading state when isLoadingPage is true", async () => {
    // Mock the necessary hooks to simulate loading
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

    // Check if loading state is displayed
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  
  test("renders children and DashboardNav when includeDashboardNav is true", () => {
    // Mock the necessary hooks
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

    // Check if DashboardNav is rendered when includeDashboardNav is true
    expect(screen.getByText("DashboardNav")).toBeInTheDocument();
  });

  test("renders children without DashboardNav when includeDashboardNav is false", () => {
    // Mock the necessary hooks
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

    // Check that DashboardNav is not rendered when includeDashboardNav is false
    expect(screen.queryByText("DashboardNav")).toBeNull();
  });

  test("renders children without DashboardNav for isDGov page", () => {
    // Mock the necessary hooks
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

    // Check that DashboardNav is not rendered when isDGov is true
    expect(screen.queryByText("DashboardNav")).toBeNull();
  });
});
