import React from "react";
import { render, screen, fireEvent } from '@testing-library/react';
import RiskPopup from '../../components/Dashboard/DashboardPopup/RiskDetails';
import { Provider } from 'react-redux';
import { createStore } from 'redux';

// Mocking Redux Store
const mockReducer = (state = { theme: { theme: 'light' } }, action) => state;
const mockStore = createStore(mockReducer);

const mockUserAccountData = {
  Ok: [
    1000000000, // collateral
    200000000,  // debt
    300000000,  // max LTV
    400000000,  // liquidation threshold
    500000000,  // health factor
  ],
};

describe('RiskPopup Component', () => {
  test('displays correct liquidation threshold value', () => {
    render(
      <Provider store={mockStore}>
        <RiskPopup onClose={() => {}} userAccountData={mockUserAccountData} />
      </Provider>
    );

    // Use getAllByText if multiple elements with the same text
    const liquidationThresholds = screen.getAllByText(/4.00/);
    expect(liquidationThresholds.length).toBeGreaterThan(0);
  });

  test('calls onClose when clicking close button', () => {
    const onClose = jest.fn();
    render(
      <Provider store={mockStore}>
        <RiskPopup onClose={onClose} userAccountData={mockUserAccountData} />
      </Provider>
    );
    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
