import React from "react";
import { render, screen } from "@testing-library/react";
import MainDashboard from "../../pages/Dashboard/MainDashboard";
import { BrowserRouter as Router } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "../../redux/store";
import { useAuth } from "../../utils/useAuthClient";
import useAssetData from "../../components/customHooks/useAssets";

// Mocking the useAuth hook to control authentication state in the tests
jest.mock("../../utils/useAuthClient", () => ({
  useAuth: jest.fn(),
}));

// Mocking useAssetData hook to simulate asset data (with loading state and asset values)
jest.mock("../../components/customHooks/useAssets", () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({
    loading: false,
    filteredItems: [
      ["ckBTC", { Ok: { asset_supply: 100000000, asset_borrow: 50000000 } }],
    ], 
  }),
}));

// Mocking the Loading component to display "Loading..." or "Not Loading" based on the loading state
jest.mock("../../components/Common/loading", () => ({
  __esModule: true,
  default: ({ isLoading }) => (
    <div>{isLoading ? "Loading..." : "Not Loading"}</div>
  ),
}));

// Mocking the Navbar, Footer, and DashboardNav components to ensure they render correctly
jest.mock("../../components/Layout/Navbar", () => () => <div>Navbar</div>);
jest.mock("../../components/Layout/Footer", () => () => <div>Footer</div>);
jest.mock("../../components/Dashboard/DashboardNav", () => () => (
  <div>DashboardNav</div>
));

describe("MainDashboard Component", () => {
  // Test case 1: Ensure Navbar, Footer, and children are rendered
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

    // Verifying that Navbar, Footer, and the child element are rendered
    expect(screen.getByText("Navbar")).toBeInTheDocument();
    expect(screen.getByText("Footer")).toBeInTheDocument();
    expect(screen.getByText("Test Child")).toBeInTheDocument();
  });

  // Test case 2: Ensure loading state is displayed when isLoadingPage is true
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

    // Verifying that "Loading..." message is displayed when isLoading is true
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  // Test case 3: Ensure children and DashboardNav are rendered when includeDashboardNav is true
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

    // Verifying that the DashboardNav component is rendered
    expect(screen.getByText("DashboardNav")).toBeInTheDocument();
  });

  // Test case 4: Ensure children are rendered without DashboardNav when includeDashboardNav is false
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

    // Verifying that DashboardNav is not rendered
    expect(screen.queryByText("DashboardNav")).toBeNull();
  });

  // Test case 5: Ensure children are rendered without DashboardNav when isDGov page is true
  test("renders children without DashboardNav for isDGov page", () => {
    useAuth.mockReturnValue({ isAuthenticated: true }); 
    useAssetData.mockReturnValue({ loading: false }); 

    render(
      <Provider store={store}>
        <Router>
          {" "}
          <MainDashboard isDGov={true} includeDashboardNav={true}>
            <div>Test Child</div> 
          </MainDashboard>
        </Router>
      </Provider>
    );

    // Verifying that DashboardNav is not rendered when isDGov is true
    expect(screen.queryByText("DashboardNav")).toBeNull();
  });
});
