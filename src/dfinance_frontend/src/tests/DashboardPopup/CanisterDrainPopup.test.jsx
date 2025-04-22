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
      
        expect(screen.getByText(/Canister Out of Cycles/i)).toBeInTheDocument();
        expect(screen.getByText(/The canister is out of cycles./i)).toBeInTheDocument();
        expect(screen.getByText(/Your funds are safe./i)).toBeInTheDocument();
      
        fireEvent.click(screen.getByText("Close"));
      
        expect(onCloseMock).toHaveBeenCalledTimes(1);
      });
      
});
