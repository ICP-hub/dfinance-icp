import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import FreezeCanisterPopup from "../../components/Dashboard/DashboardPopup/CanisterDrainPopup"; 
import { BrowserRouter as Router } from "react-router-dom"; 

describe("FreezeCanisterPopup", () => {
  // Test case to verify the popup renders correctly and closes when the close button is clicked
  it("should render the popup and close when close button is clicked", () => {
    const onCloseMock = jest.fn(); // Mock function to simulate onClose behavior

    // Rendering the FreezeCanisterPopup with Router and the mock onClose function
    render(
      <Router>
        <FreezeCanisterPopup onClose={onCloseMock} />
      </Router>
    );

    // Verifying the presence of popup content
    expect(screen.getByText(/Canister Out of Cycles/i)).toBeInTheDocument(); // Ensure heading is present
    expect(
      screen.getByText(/The canister is out of cycles./i)
    ).toBeInTheDocument(); // Ensure body text is displayed
    expect(screen.getByText(/Your funds are safe./i)).toBeInTheDocument(); // Ensure safety message is displayed

    // Simulating a click on the 'Close' button
    fireEvent.click(screen.getByText("Close"));

    // Verifying that the onClose function is called once
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});
