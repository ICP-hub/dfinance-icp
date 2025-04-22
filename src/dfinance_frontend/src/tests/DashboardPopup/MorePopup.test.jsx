import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Popup from '../../components/Dashboard/DashboardPopup/Morepopup'; // Adjust the import path as needed

describe('Popup Component', () => {
  const mockPosition = { top: 50, left: 100 };
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders popup with correct links', () => {
    render(<Popup position={mockPosition} onClose={mockOnClose} />);
    
    expect(screen.getByText('Doc')).toBeInTheDocument();
    expect(screen.getByText("FAQ's")).toBeInTheDocument();
  });

  test('positions popup correctly based on provided position', () => {
    render(<Popup position={mockPosition} onClose={mockOnClose} />);
    
    const popupContainer = screen.getByText('Doc').closest('div').parentElement.parentElement;
    
    expect(popupContainer).toHaveStyle({
      position: 'absolute',
      top: `${mockPosition.top + 100}px`,
      left: `${mockPosition.left + 850}px`,
      zIndex: '10'
    });
  });

  test('links have correct attributes', () => {
    render(<Popup position={mockPosition} onClose={mockOnClose} />);
    
    const docLink = screen.getByText('Doc').closest('a');
    expect(docLink).toHaveAttribute('href', 'https://dfinance.notion.site/bbe01eaf7d414148bc4b9843675a532f?v=8b792ba254da44ecab1c0c016331c8af&pvs=4');
    expect(docLink).toHaveAttribute('target', 'blank');
    
    const faqLink = screen.getByText("FAQ's").closest('a');
    expect(faqLink).toHaveAttribute('href', '/#faq');
  });
});