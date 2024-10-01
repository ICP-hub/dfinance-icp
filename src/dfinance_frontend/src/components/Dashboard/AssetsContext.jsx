import React, { createContext, useState, useContext } from 'react';
const AssetContext = createContext();

export const AssetProvider = ({ children }) => {
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [allAssets, setAllAssets] = useState([]);

  return (
    <AssetContext.Provider value={{ selectedAsset, setSelectedAsset, allAssets, setAllAssets }}>
      {children}
    </AssetContext.Provider>
  );
};

export const useAsset = () => {
  return useContext(AssetContext);
};
