import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import FreezeCanisterPopup from "../../components/Dashboard/DashboardPopup/CanisterDrainPopup";
import { BrowserRouter as Router } from "react-router-dom";

describe("FreezeCanisterPopup", () => {
    it("should render the popup and close when close button is clicked", () => {
        const onCloseMock = jest.fn();
      
        render(
          <Router>
            <FreezeCanisterPopup onClose={onCloseMock} />
          </Router>
        );
      
        // Check if the popup content is displayed
        expect(screen.getByText(/Canister Out of Cycles/i)).toBeInTheDocument();
        expect(screen.getByText(/The canister is out of cycles./i)).toBeInTheDocument();
        expect(screen.getByText(/Your funds are safe./i)).toBeInTheDocument();
      
        // Click the close button
        fireEvent.click(screen.getByText("Close"));
      
        // Ensure onClose is called
        expect(onCloseMock).toHaveBeenCalledTimes(1);
      });
      
});
