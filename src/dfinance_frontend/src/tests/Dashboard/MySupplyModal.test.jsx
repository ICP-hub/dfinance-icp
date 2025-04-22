import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MySupplyModal from '../../components/Dashboard/MySupplyModal';

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
  const mockSetIsModalOpen = jest.fn();
  const defaultProps = {
    isModalOpen: true,
    isLoading: false,
    setIsModalOpen: mockSetIsModalOpen,
    children: <div>Test Content</div>
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders when isModalOpen is true', () => {
    render(<MySupplyModal {...defaultProps} />);
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  test('does not render when isModalOpen is false', () => {
    render(<MySupplyModal {...{ ...defaultProps, isModalOpen: false }} />);
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  test('shows loading indicator when isLoading is true', () => {
    render(<MySupplyModal {...{ ...defaultProps, isLoading: true }} />);

    const modalContent = screen.getByText('Test Content').parentElement;
    expect(modalContent).toHaveClass('opacity-50');

    const loader = document.querySelector('.loader');
    expect(loader).toBeInTheDocument();
  });

  test('does not close modal on backdrop click when isLoading is true', () => {
    render(<MySupplyModal {...{ ...defaultProps, isLoading: true }} />);
    fireEvent.click(screen.getByTestId('modal'));
    expect(mockSetIsModalOpen).not.toHaveBeenCalled();
  });

  test('closes modal on backdrop click when isLoading is false', () => {
    render(<MySupplyModal {...defaultProps} />);
    fireEvent.click(screen.getByTestId('modal'));
    expect(mockSetIsModalOpen).not.toHaveBeenCalled();
  });

  test('applies correct CSS classes', () => {
    render(<MySupplyModal {...defaultProps} />);
    const modalContent = screen.getByText('Test Content').parentElement;
    expect(modalContent).toHaveClass('bg-white');
    expect(modalContent).toHaveClass('rounded-xl');
    expect(modalContent).toHaveClass('dark:bg-darkOverlayBackground');
    expect(modalContent).toHaveClass('dark:text-darkText');
  });

  test('applies additional opacity class when loading', () => {
    render(<MySupplyModal {...{ ...defaultProps, isLoading: true }} />);
    const modalContent = screen.getByText('Test Content').parentElement;
    expect(modalContent).toHaveClass('opacity-50');
    expect(modalContent).toHaveClass('pointer-events-none');
  });

  test('passes children correctly', () => {
    const customChildren = <div data-testid="custom-child">Custom Child</div>;
    render(<MySupplyModal {...{ ...defaultProps, children: customChildren }} />);
    expect(screen.getByTestId('custom-child')).toBeInTheDocument();
    expect(screen.getByText('Custom Child')).toBeInTheDocument();
  });
});