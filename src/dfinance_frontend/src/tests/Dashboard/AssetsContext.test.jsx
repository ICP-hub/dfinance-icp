import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import {
  AssetProvider,
  useAsset,
} from "../../components/Dashboard/AssetsContext";
import userEvent from "@testing-library/user-event";

// Mock component that uses the context
const TestConsumer = () => {
  const { selectedAsset, setSelectedAsset, allAssets, setAllAssets } =
    useAsset();

  return (
    <div>
      <div data-testid="selected-asset">
        {selectedAsset ? "has-asset" : "no-asset"}
      </div>
      <div data-testid="assets-count">{allAssets.length}</div>
      <button
        data-testid="select-asset-btn"
        onClick={() => setSelectedAsset({ id: 1, name: "Test Asset" })}
      >
        Select Asset
      </button>
      <button
        data-testid="add-asset-btn"
        onClick={() =>
          setAllAssets([...allAssets, { id: allAssets.length + 1 }])
        }
      >
        Add Asset
      </button>
    </div>
  );
};

describe("AssetContext", () => {
  test("provides expected context values and updates state correctly", async () => {
    const user = userEvent.setup();
    render(
      <AssetProvider>
        <TestConsumer />
      </AssetProvider>
    );

    expect(screen.getByTestId("selected-asset").textContent).toBe("no-asset");
    expect(screen.getByTestId("assets-count").textContent).toBe("0");

    await user.click(screen.getByTestId("select-asset-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("selected-asset").textContent).toBe(
        "has-asset"
      );
    });

    await user.click(screen.getByTestId("add-asset-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("assets-count").textContent).toBe("1");
    });
  });
});
