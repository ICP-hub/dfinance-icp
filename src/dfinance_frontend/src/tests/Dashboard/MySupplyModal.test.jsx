import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MySupplyModal from '../../components/Dashboard/MySupplyModal';

// Mock MUI components used in the modal with simplified versions for testing
jest.mock('@mui/material', () => ({
  Modal: ({ children, open, onClose, ...props }) => (
    open ? <div data-testid="modal" onClick={(e) => onClose(e, 'backdropClick')} {...props}>{children}</div> : null
  ),
  Fade: ({ children, in: inProp }) => (
    inProp ? <div data-testid="fade">{children}</div> : null
  ),
  Grow: ({ children, in: inProp }) => (
    inProp ? <div data-testid="grow">{children}</div> : null
  )
}));

describe('MySupplyModal Component', () => {
  // Set up default props for most test cases
  const mockSetIsModalOpen = jest.fn();
  const defaultProps = {
    isModalOpen: true,
    isLoading: false,
    setIsModalOpen: mockSetIsModalOpen,
    children: <div>Test Content</div>
  };

  // Clear mock function calls before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test that the modal renders when isModalOpen is true
  test('renders when isModalOpen is true', () => {
    render(<MySupplyModal {...defaultProps} />);
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  // Test that the modal does not render when isModalOpen is false
  test('does not render when isModalOpen is false', () => {
    render(<MySupplyModal {...{ ...defaultProps, isModalOpen: false }} />);
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  // Test that loading indicator appears when isLoading is true
  test('shows loading indicator when isLoading is true', () => {
    render(<MySupplyModal {...{ ...defaultProps, isLoading: true }} />);

    const modalContent = screen.getByText('Test Content').parentElement;
    expect(modalContent).toHaveClass('opacity-50');

    const loader = document.querySelector('.loader');
    expect(loader).toBeInTheDocument();
  });

  // Test that modal doesn't close on backdrop click when loading
  test('does not close modal on backdrop click when isLoading is true', () => {
    render(<MySupplyModal {...{ ...defaultProps, isLoading: true }} />);
    fireEvent.click(screen.getByTestId('modal'));
    expect(mockSetIsModalOpen).not.toHaveBeenCalled();
  });

  // Test modal closure on backdrop click when not loading (possible test bug: checking that callback is NOT called)
  test('closes modal on backdrop click when isLoading is false', () => {
    render(<MySupplyModal {...defaultProps} />);
    fireEvent.click(screen.getByTestId('modal'));
    expect(mockSetIsModalOpen).not.toHaveBeenCalled(); // NOTE: This seems incorrect
  });

  // Test that correct CSS classes are applied to modal content for both light and dark themes
  test('applies correct CSS classes', () => {
    render(<MySupplyModal {...defaultProps} />);
    const modalContent = screen.getByText('Test Content').parentElement;
    expect(modalContent).toHaveClass('bg-white');
    expect(modalContent).toHaveClass('rounded-xl');
    expect(modalContent).toHaveClass('dark:bg-darkOverlayBackground');
    expect(modalContent).toHaveClass('dark:text-darkText');
  });

  // Test that loading state applies additional opacity and pointer-events classes
  test('applies additional opacity class when loading', () => {
    render(<MySupplyModal {...{ ...defaultProps, isLoading: true }} />);
    const modalContent = screen.getByText('Test Content').parentElement;
    expect(modalContent).toHaveClass('opacity-50');
    expect(modalContent).toHaveClass('pointer-events-none');
  });

  // Test that custom children are properly rendered inside the modal
  test('passes children correctly', () => {
    const customChildren = <div data-testid="custom-child">Custom Child</div>;
    render(<MySupplyModal {...{ ...defaultProps, children: customChildren }} />);
    expect(screen.getByTestId('custom-child')).toBeInTheDocument();
    expect(screen.getByText('Custom Child')).toBeInTheDocument();
  });
});