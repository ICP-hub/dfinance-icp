import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Popup from "../../components/Dashboard/DashboardPopup/Morepopup"; // Adjust the import path as needed

describe("Popup Component", () => {
  // Mock data for position and onClose handler to simulate prop values
  const mockPosition = { top: 50, left: 100 };
  const mockOnClose = jest.fn(); // Mock function for onClose prop

  // Before each test, clear mocks to ensure clean test environment
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test case 1: Verifying that the popup renders with correct links
  test("renders popup with correct links", () => {
    render(<Popup position={mockPosition} onClose={mockOnClose} />); // Render the Popup component with mock data

    // Verifying that the 'Doc' and "FAQ's" text are rendered correctly in the document
    expect(screen.getByText("Doc")).toBeInTheDocument();
    expect(screen.getByText("FAQ's")).toBeInTheDocument();
  });

  // Test case 2: Verifying that the popup is positioned correctly based on the position prop
  test("positions popup correctly based on provided position", () => {
    render(<Popup position={mockPosition} onClose={mockOnClose} />); // Render the Popup component with position prop

    // Find the popup container by getting the closest 'div' to the 'Doc' link
    const popupContainer = screen.getByText("Doc").closest("div")
      .parentElement.parentElement;

    // Check if the style is applied correctly, ensuring that the popup is positioned based on the provided 'top' and 'left' values
    expect(popupContainer).toHaveStyle({
      position: "absolute",
      top: `${mockPosition.top + 100}px`, // The top position should be offset by 100px (mockPosition.top + 100)
      left: `${mockPosition.left + 850}px`, // The left position should be offset by 850px (mockPosition.left + 850)
      zIndex: "10", // Ensure the popup has the correct z-index for visibility
    });
  });

  // Test case 3: Verifying that links inside the popup have the correct attributes
  test("links have correct attributes", () => {
    render(<Popup position={mockPosition} onClose={mockOnClose} />); // Render the Popup component with mock data

    // Verifying the 'Doc' link has the correct href and target attributes
    const docLink = screen.getByText("Doc").closest("a");
    expect(docLink).toHaveAttribute(
      "href",
      "https://dfinance.notion.site/bbe01eaf7d414148bc4b9843675a532f?v=8b792ba254da44ecab1c0c016331c8af&pvs=4"
    );
    expect(docLink).toHaveAttribute("target", "blank"); // The link should open in a new tab

    // Verifying the "FAQ's" link has the correct href attribute
    const faqLink = screen.getByText("FAQ's").closest("a");
    expect(faqLink).toHaveAttribute("href", "/#faq"); // The FAQ link should have the correct href to the FAQ section
  });
});
