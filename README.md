# DFinance

![DFinance Header](./src/dfinance_frontend/public/logo/header.png)

DFinance is a decentralized lending and borrowing protocol on ICP. The protocol uniquely combines liquidity mining with deflationary buy and burn mechanics.

<br>

## ⚙️ Setup

Clone the repository and follow the below commands:

```bash
# Install node modules
npm install

# Start dfx server
dfx start --clean --background

# Initialize deps
dfx deps pull
dfx deps init
dfx deps deploy

# Deploy local ledgers and canisters
cd scripts
cd deploy_scripts
./deploy.sh

# For frontend using npm
npm start
```

<br>

## 📄 Documentation

- [DFinance Notion](https://dfinance.notion.site/bbe01eaf7d414148bc4b9843675a532f?v=8b792ba254da44ecab1c0c016331c8af)

<br>

## 🪪 License

[Full license](./LICENSE)

Copyright (c) 2024, ICP-hub

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.