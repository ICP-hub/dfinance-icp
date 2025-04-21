import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AssetProvider, useAsset } from '../../components/Dashboard/AssetsContext';
import userEvent from '@testing-library/user-event';

// Mock component that uses the context
const TestConsumer = () => {
  const { selectedAsset, setSelectedAsset, allAssets, setAllAssets } = useAsset();
  
  return (
    <div>
      <div data-testid="selected-asset">{selectedAsset ? 'has-asset' : 'no-asset'}</div>
      <div data-testid="assets-count">{allAssets.length}</div>
      <button 
        data-testid="select-asset-btn" 
        onClick={() => setSelectedAsset({ id: 1, name: 'Test Asset' })}
      >
        Select Asset
      </button>
      <button 
        data-testid="add-asset-btn" 
        onClick={() => setAllAssets([...allAssets, { id: allAssets.length + 1 }])}
      >
        Add Asset
      </button>
    </div>
  );
};

describe('AssetContext', () => {
  test('provides expected context values and updates state correctly', async () => {
    // Setup user event
    const user = userEvent.setup();
    
    // Fix the missing AssetContext.Provider in your component
    render(
      <AssetProvider>
        <TestConsumer />
      </AssetProvider>
    );
    
    // Check initial state
    expect(screen.getByTestId('selected-asset').textContent).toBe('no-asset');
    expect(screen.getByTestId('assets-count').textContent).toBe('0');
    
    // Test setSelectedAsset functionality using userEvent instead of direct click
    await user.click(screen.getByTestId('select-asset-btn'));
    
    // Wait for the state update to be reflected in the DOM
    await waitFor(() => {
      expect(screen.getByTestId('selected-asset').textContent).toBe('has-asset');
    });
    
    // Test setAllAssets functionality
    await user.click(screen.getByTestId('add-asset-btn'));
    
    // Wait for the state update to be reflected in the DOM
    await waitFor(() => {
      expect(screen.getByTestId('assets-count').textContent).toBe('1');
    });
  });
});