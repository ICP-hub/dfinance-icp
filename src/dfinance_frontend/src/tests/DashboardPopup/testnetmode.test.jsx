
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TestnetModePopup from "../../components/Dashboard/DashboardPopup/testnetmode";
import { ToastContainer } from "react-toastify";
import '@testing-library/jest-dom/extend-expect';

jest.mock("react-toastify", () => ({
    ...jest.requireActual("react-toastify"),
    toast: {
        info: jest.fn(),
        dismiss: jest.fn(),
    }
}));

describe("TestnetModePopup", () => {
    const mockHandleTestnetModeToggle = jest.fn();
    const mockOnClose = jest.fn();

    beforeEach(() => {
        render(
            <>
                <TestnetModePopup
                    onClose={mockOnClose}
                    handleTestnetModeToggle={mockHandleTestnetModeToggle}
                />
                <ToastContainer />
            </>
        );
    });

    test("clicking the close icon triggers onClose", () => {
        fireEvent.click(screen.getByTestId("close-icon"));
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });


    test("clicking the background triggers onClose", () => {
        fireEvent.click(screen.getByText(/Testnet Mode is ON/i));
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });





});
