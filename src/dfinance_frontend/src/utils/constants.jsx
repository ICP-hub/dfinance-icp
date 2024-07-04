const TabPanel = ({ items }) => {
  return (
    <div className="flex flex-wrap justify-center gap-4">
      {items.map((item) => (
        <div key={item.id} className="max-w-xs w-full p-4 border rounded-lg shadow-md">
          <img src={item.image} alt={item.title} className="w-full h-48 object-cover rounded-md" />
          <h2 className="mt-4 text-lg font-semibold text-[#0C5A74]">{item.title}</h2>
          <p className="mt-2 text-sm text-gray-600">{item.description}</p>
        </div>
      ))}
    </div>
  );
};

export const FOOTER_LINK_1 = [
  {
    id: 0,
    title: "Governance",
    route: "/#",
    icon: "",
  },
  {
    id: 1,
    title: "Security",
    route: "/#",
    icon: "",
  },
  {
    id: 2,
    title: "Docs",
    route: "/#",
    icon: "",
  },
  {
    id: 3,
    title: "FAQ",
    route: "/#",
    icon: "",
  },
]

export const FOOTER_LINK_2 = [
  {
    id: 0,
    title: "Dev Forum",
    route: "/#",
    icon: "",
  },
  {
    id: 1,
    title: "Discord",
    route: "/#",
    icon: "",
  },
  {
    id: 2,
    title: "Blogs",
    route: "/#",
    icon: "",
  },
]
export const HOME_TOP_NAV_LINK = [
  {
    id: 0,
    title: "Governance",
    route: "/governance",
    icon: "",
  },
  {
    id: 1,
    title: "Market",
    route: "/market",
    icon: "",
  },
  {
    id: 2,
    title: "Docs",
    route: "/docs",
    icon: "",
  },
  {
    id: 3,
    title: "FAQ",
    route: "/#faq",
    icon: "",
  },
]



export const DASHBOARD_TOP_NAV_LINK = [
  {
    id: 0,
    title: "Dashboard",
    route: "/dashboard",
    icon: "",
    alwaysPresent: true
  },
  {
    id: 1,
    title: "Governance",
    route: "/governance",
    icon: "",
    alwaysPresent: true
  },
  {
    id: 2,
    title: "Market",
    route: "/market",
    icon: "",
    alwaysPresent: true
  },
  {
    id: 3,
    title: "Stake",
    route: "/stake",
    icon: "",
    testnet: false
  },
  {
    id: 4,
    title: "Faq",
    route: "/#Faq",
    icon: "",
    testnet: false
  },
  {
    id: 5,
    title: "Faucet",
    route: "/Faucet",
    icon: "",
    testnet: true
  },

]
export const error = [
  {
    id: 0,
    title: "4o4",
    route: "*",
    
  },]
export const MAIN_NAV_LINK = [
  {
    id: 0,
    title: "Supply",
    content: "Supply into the protocol and watch your assets grow as a liquidity provider",
  },
  {
    id: 1,
    title: "Stake",
    content: "Deposit your DFinance into the protocol and earn rewards for securing the protocol",
  },
  {
    id: 2,
    title: "Borrow",
    content: "Borrow against your collateral from across multiple networks and assets",
  },
  {
    id: 3,
    title: "Vote",
    content: "Participate in DFinance governance and vote on new proposals, new assets, and protocol upgrades",
  },
];
export const TAB_CARD_DATA = [
  {
    id: 0,
    title: "ckBTC",
    image: "https://i.ibb.co/WP7FFRH/image-98.png",
    description:
      "Bitcoin is the first decentralized digital currency. It was invented in 2008 by an unknown person or group of people using the name Satoshi Nakamoto and started in 2009 when its source code was released as open-source software.",
  },
  {
    id: 1,
    title: "ckETH",
    image: "https://i.ibb.co/XbHCNpS/image-98-3.png",
    description:
      "Ethereum is a decentralized, open-source blockchain system that features smart contract functionality. It is the second-largest cryptocurrency by market capitalization, after Bitcoin.",
  },
  {
    id: 2,
    title: "Dragginz",
    image: "https://i.ibb.co/xJ8KLK7/image-98-6.png",
    description:
      "Ripple is a digital payment protocol that operates as both a cryptocurrency and a payment network for financial transactions. It is known for its digital payment protocol and native cryptocurrency, XRP.",
  },
  {
    id: 3,
    title: "Internet computer",
    image: "https://i.ibb.co/RzQNb5F/image98.png",
    description:
      "Litecoin is a peer-to-peer cryptocurrency and open-source software project released under the MIT/X11 license. Creation and transfer of coins are based on an open-source cryptographic protocol and is not managed by any central authority.",
  },
  {
    id: 4,
    title: "OpenChat",
    image: "https://i.ibb.co/Lghfh2k/image-98-7.png",
    description:
      "Cardano is a blockchain platform for changemakers, innovators, and visionaries, with the tools and technologies required to create possibility for the many, as well as the few, and bring about positive global change.",
  },
  {
    id: 5,
    title: "Kinic",
    image: "https://i.ibb.co/LQB24Sm/image-98-9.png",
    description:
      "Polkadot is a next-generation blockchain protocol connecting multiple specialized blockchains into one unified network. It aims to enable seamless communication and interoperability between different blockchains.",
  },
  {
    id: 6,
    title: "Hot or Not",
    image: "https://i.ibb.co/vZ5GJ9y/image-98-4.png",
    description:
      "Chainlink is a decentralized oracle network that enables smart contracts to securely interact with real-world data, events, and payments. It aims to bridge the gap between blockchain-based smart contracts and external data sources.",
  },
  {
    id: 7,
    title: "ICX",
    image: "https://i.ibb.co/pbzXtWB/image-98-1.png",
    description:
      "Stellar is an open-source, decentralized protocol for digital currency to fiat currency transfers which allows cross-border transactions between any pair of currencies. It aims to provide low-cost financial services to people in underserved regions.",
  },
  {
    id: 8,
    title: "ICGhost",
    image: "https://i.ibb.co/m6jKZYf/image-98-10.png",
    description:
      "Dogecoin is a cryptocurrency that started as a joke based on the popular 'Doge' meme. Despite its origins, Dogecoin has developed a strong community and is used by some as a tipping system on social media platforms.",
  },
  {
    id: 9,
    title: "Modclub",
    image: "https://i.ibb.co/BZgT6c4/image-98-5.png",
    description:
      "Binance Coin is the native cryptocurrency of the Binance exchange, one of the largest cryptocurrency exchanges in the world. It is used to pay for transaction fees on the Binance exchange and can also be used for various other purposes within the Binance ecosystem.",
  },
  {
    id: 10,
    title: "BOOM DAO",
    image: "https://i.ibb.co/WpP2nJH/image-98-2.png",
    description:
      "Uniswap is a decentralized finance (DeFi) protocol that enables automated trading of decentralized finance tokens on the Ethereum blockchain. It allows users to swap various Ethereum-based tokens without the need for an intermediary.",
  },
  {
    id: 11,
    title: "Catalyze",
    image: "https://i.ibb.co/2vsW2pf/image-98-8.png",
    description:
      "Solana is a high-performance blockchain platform designed for decentralized applications and crypto-currencies. It aims to provide fast, secure, and scalable infrastructure for decentralized applications and crypto-currencies.",
  },
]


export const SECURITY_CONTRIBUTORS_DATA = [
  {
    id: 0,
    title: "Trail of bits",
    image: "https://i.ibb.co/QH6w79v/trail-Of-Bits-svg-fill.png",
  },
  {
    id: 1,
    title: "Certora",
    image: "https://i.ibb.co/tPwwdBV/certora-svg-fill.png",
  },
  {
    id: 2,
    title: "OpenZeppellin",
    image: "https://i.ibb.co/2Nd6d5F/open-Zeppelin-svg.png",
  },
  {
    id: 3,
    title: "Sigma Prime",
    image: "https://i.ibb.co/Fg4hyfP/sigma-Prime-svg-fill.png",
  },
  {
    id: 4,
    title: "Peckshield",
    image: "https://i.ibb.co/Kx0fWXJ/peckshield-logo-svg.png",
  },
  {
    id: 5,
    title: "ABDK",
    image:"https://i.ibb.co/7VC5zYz/abdk-svg.png"
  }
  
]

export const SHOWCASE_SECTION = [
  {
    id: 0,
    title: "ICP Grants DAO",
    description:
      "ICP Grants DAO is a community-led grants program to fund ideas submitted by the ICP protocol's community, with a focus on empowering a wider network of community developers.",
    isICP: true,
  },
  {
    id: 1,
    title: "Security Contributors",
    description:
      "Audited by the world's leading security firms, security of the DFinance Protocol is the highest priority.",
    isICP: false,
  },
]

export const FAQ_QUESTION = [
  {
    id: 0,
    question: "What is DFinance?",
    answer:
      "DFinance is a decentralized lending protocol that allows users to borrow and lend crypto assets. The protocol is designed to be user-friendly, transparent, and easy to use.",
  },
  {
    id: 1,
    question: "How do I borrow?",
    answer:
      "To borrow, users need to deposit their crypto assets into the protocol. Once they deposit, they can choose from a range of borrowing options, including stablecoins, interest-bearing tokens, and other crypto assets.",
  },
  {
    id: 2,
    question: "What platforms does ACME payment gateway support?",
    answer:
      "ACME payment gateway supports all major crypto platforms, including Bitcoin, Ethereum, and other cryptocurrencies.",
  },
  {
    id: 3,
    question: "Does ACME provide international payments support?",
    answer:
      "ACME does not provide international payments support. All payments are made in the country of origin.",
  },
  {
    id: 4,
    question:
      "Is there any setup fee or annual maintainance fee that I need to pay regularly?",
    answer:
      "No, there is no setup fee or annual maintainance fee that I need to pay regularly.",
  },
]

export const WALLET_DETAILS_TABS = [
  {
    id: 0,
    title: "Total Market Size",
    count: "300.76",
  },
  {
    id: 1,
    title: "Total Available",
    count: "400.76",
  },
  {
    id: 2,
    title: "Total Borrows",
    count: "290.76",
  },
]
export const WALLET_DETAIL_TAB = [
  {
    id: 0,
    title: "Net Worth",
    count: "$163.39",
  },
  {
    id: 1,
    title: "Net APY",
    count: "12.26 %",
  },
  {
    id: 2,
    title: "Health Factor",
    count: "12.26 %",
  },
  
  
]

export const WALLET_ASSETS_TABLE_COL = [
  {
    col_id: 0,
    header: "Assest",
  },
  {
    col_id: 1,
    header: "Total Supplied",
  },
  {
    col_id: 2,
    header: "Supply APY",
  },
  {
    col_id: 3,
    header: "Total Borrowing",
  },
  {
    col_id: 4,
    header: "Borrowing APY",
  },
  
]

export const WALLET_ASSETS_TABLE_ROW = [
  {
    row_id: 0,
    asset: "ckBTC",
    image: "https://i.ibb.co/WP7FFRH/image-98.png",
    total_supply_count: 3.19,
    total_supply: 156.51,
    supply_apy: 3.19,
    total_borrow_count: 3.19,
    total_borrow: 156.51,
    borrow_apy: 3.19,
  },
  {
    row_id: 1,
    asset: "ckETH",
    image: "https://i.ibb.co/XbHCNpS/image-98-3.png",
    total_supply_count: 3.19,
    total_supply: 156.51,
    supply_apy: 3.19,
    total_borrow_count: 3.19,
    total_borrow: 156.51,
    borrow_apy: 3.19,
  },
  {
    row_id: 2,
    asset: "Dragginz",
    image: "https://i.ibb.co/xJ8KLK7/image-98-6.png",
    total_supply_count: 3.19,
    total_supply: 156.51,
    supply_apy: 3.19,
    total_borrow_count: 3.19,
    total_borrow: 156.51,
    borrow_apy: 3.19,
  },
  {
    row_id: 3,
    asset: "Internet computer",
    image: "https://i.ibb.co/RzQNb5F/image98.png",
    total_supply_count: 3.19,
    total_supply: 156.51,
    supply_apy: 3.19,
    total_borrow_count: 3.19,
    total_borrow: 156.51,
    borrow_apy: 3.19,
  },
  {
    row_id: 4,
    asset: "OpenChat",
    image: "https://i.ibb.co/Lghfh2k/image-98-7.png",
    total_supply_count: 3.19,
    total_supply: 156.51,
    supply_apy: 3.19,
    total_borrow_count: 3.19,
    total_borrow: 156.51,
    borrow_apy: 3.19,
  },
  {
    row_id: 5,
    asset: "Kinic",
    image: "https://i.ibb.co/LQB24Sm/image-98-9.png",
    total_supply_count: 3.19,
    total_supply: 156.51,
    supply_apy: 3.19,
    total_borrow_count: 3.19,
    total_borrow: 156.51,
    borrow_apy: 3.19,
  },
  {
    row_id: 6,
    image: "https://i.ibb.co/vZ5GJ9y/image-98-4.png",
    asset: "Hot or Not",
    total_supply_count: 3.19,
    total_supply: 156.51,
    supply_apy: 3.19,
    total_borrow_count: 3.19,
    total_borrow: 156.51,
    borrow_apy: 3.19,
  },
  {
    row_id: 7,
    image: "https://i.ibb.co/pbzXtWB/image-98-1.png",
    asset: "ICX",
    total_supply_count: 3.19,
    total_supply: 156.51,
    supply_apy: 3.19,
    total_borrow_count: 3.19,
    total_borrow: 156.51,
    borrow_apy: 3.19,
  },
  {
    row_id: 8,
    asset: "ICGhost",
    image: "https://i.ibb.co/m6jKZYf/image-98-10.png",
    total_supply_count: 3.19,
    total_supply: 156.51,
    supply_apy: 3.19,
    total_borrow_count: 3.19,
    total_borrow: 156.51,
    borrow_apy: 3.19,
  },
  {
    row_id: 9,
    asset: "Modclub",
    image: "https://i.ibb.co/BZgT6c4/image-98-5.png",
    total_supply_count: 3.19,
    total_supply: 156.51,
    supply_apy: 3.19,
    total_borrow_count: 3.19,
    total_borrow: 156.51,
    borrow_apy: 3.19,
  },
  {
    row_id: 10,
    asset: "BOOM DAO",
    image: "https://i.ibb.co/WpP2nJH/image-98-2.png",
    total_supply_count: 3.19,
    total_supply: 156.51,
    supply_apy: 3.19,
    total_borrow_count: 3.19,
    total_borrow: 156.51,
    borrow_apy: 3.19,
  },
  {
    row_id: 11,
    image: "https://i.ibb.co/2vsW2pf/image-98-8.png",
    asset: "Catalyze",
    total_supply_count: 3.19,
    total_supply: 156.51,
    supply_apy: 3.19,
    total_borrow_count: 3.19,
    total_borrow: 156.51,
    borrow_apy: 3.19,
  },
]

export const ASSET_DETAILS = [
  "Supply Info",
  "Borrow Info",
  "E-Mode info",
  "Interest rate model",
]

export const PROPOSALS_DETAILS = [
  "All proposals",
  "Created",
  "Open for voting's",
  "Passed",
  "Failed",
  "Executed",
  "Cancelled",
  "Expired",
]

export const TOP_TEN_PROP = [
  { title: "ckETH", voteCount: 45562, id: 1 },
  { title: "ckBTC", voteCount: 41526, id: 2 },
  { title: "Dragginz", voteCount: 123500, id: 3 },
  { title: "OpenChat", voteCount: 0, id: 4 },
  { title: "Kinic", voteCount: 0, id: 5 },
  { title: "Hot or Not", voteCount: 0, id: 6 },
  { title: "ICGhost", voteCount: 0, id: 7 },
  { title: "BOOM DAO", voteCount: 0, id: 8 },
]
export const TAB_CARD_DESCRIPTION_LENGTH = 300

export const TEMP_HERO_COUNTER_NUMBER = 10000000


export function generateRandomUsername() {
  const adjectives = ["lion", "eagle", "tiger", "hawk", "panther", "bear", "wolf", "fox", "shark", "dragon"];
  const nouns = ["lender", "borrower", "trader", "investor", "spender", "saver", "buyer", "seller", "collector", "enthusiast"];

  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];

  return randomAdjective + "_" + randomNoun;
}


export const MY_SUPPLY_ASSET_TABLE_COL = [
  {
    col_id: 0,
    header: "Assest",
  },
  {
    col_id: 1,
    header: "Wallet Balance",
  },
  {
    col_id: 2,
    header: "APY",
  }, {
    col_id: 3,
    header: "Can be Collateral",
  }
]

export const MY_SUPPLY_ASSET_TABLE_ROWS = [
  {
    row_id: 0,
    asset: "ckETH",
    image: "https://i.ibb.co/XbHCNpS/image-98-3.png",
    wallet_balance_count: 3.19,
    wallet_balance: 156.51,
    apy: 1.50,
    apy_desc: "Eligible for 2.9M$ GHO Community program"
  },
  {
    row_id: 1,
    asset: "ckBTC",
    image: "https://i.ibb.co/WP7FFRH/image-98.png",
    wallet_balance_count: 3.19,
    wallet_balance: 156.51,
    apy: 1.50,
    apy_desc: "Eligible for 2.9M$ GHO Community program"
  },
  
  {
    row_id: 3,
    asset: "Dragginz",
    image: "https://i.ibb.co/xJ8KLK7/image-98-6.png",
    wallet_balance_count: 3.19,
    wallet_balance: 156.51,
    apy: 1.50,
    apy_desc: "Eligible for 2.9M$ GHO Community program"
  },
]

export const MY_ASSET_TO_SUPPLY_TABLE_COL = [
  {
    col_id: 0,
    header: "Assest",
  },
  {
    col_id: 1,
    header: "Available",
  },
  {
    col_id: 2,
    header1: "APY, variable",
    header2: "APY, borrow rate",
  }
]
export const MY_ASSET_TO_BORROW_TABLE_COL = [
  {
    col_id: 0,
    header: "",
  },
  {
    col_id: 1,
    header: "Available",
  },
  {
    col_id: 2,
    header1: "APY, variable",
    header2: "APY, borrow rate",
  }
]
export const MY_ASSET_TO_SUPPLY_TABLE_ROW = [
  {
    row_id: 0,
    asset: "ckETH",
    image: "https://i.ibb.co/XbHCNpS/image-98-3.png",
    wallet_balance_count: 3.19,
    wallet_balance: 156.51,
    apy: 1.50,
    apy_desc: "Eligible for 2.9M$ GHO Community program"
  },
  {
    row_id: 1,
    asset: "ckBTC",
    image: "https://i.ibb.co/WP7FFRH/image-98.png",
    wallet_balance_count: 3.19,
    wallet_balance: 156.51,
    apy: 1.50,
    apy_desc: "Eligible for 2.9M$ GHO Community program"
  },
  
  {
    row_id: 3,
    asset: "Dragginz",
    image: "https://i.ibb.co/xJ8KLK7/image-98-6.png",
    wallet_balance_count: 3.19,
    wallet_balance: 156.51,
    apy: 1.50,
    apy_desc: "Eligible for 2.9M$ GHO Community program"
  },
  {
    row_id: 4,
    asset: "OpenChat",
    image: "https://i.ibb.co/Lghfh2k/image-98-7.png",
    wallet_balance_count: 3.19,
    wallet_balance: 156.51,
    apy: 1.50,
    apy_desc: "Eligible for 2.9M$ GHO Community program"
  },
]
export const MY_ASSET_TO_BORROW_TABLE_ROW = [
  
  {
    row_id: 0,
    asset: "ckETH",
    image: "https://i.ibb.co/XbHCNpS/image-98-3.png",
    wallet_balance_count: 3.19,
    wallet_balance: 156.51,
    apy:" 1.50-2.02%",
    apy_desc: "Eligible for 2.9M$ GHO Community program"
  },
]
export const MY_BORROW_ASSET_TABLE_COL = [
  {
    col_id: 0,
    header: "Assest",
  },
  {
    col_id: 1,
    header: "Debt",
  },
  {
    col_id: 2,
    header: "APY",
  }, {
    col_id: 3,
    header: "APY TYPE",
  }
]

export const MY_BORROW_ASSET_TABLE_ROWS = [
  {
    row_id: 0,
    asset: "ckETH",
    image: "https://i.ibb.co/XbHCNpS/image-98-3.png",
    wallet_balance_count: 3.19,
    wallet_balance: 156.51,
    apy: 1.50,
    apy_desc: "Eligible for 2.9M$ GHO Community program",
    apy_type: "variable"
  },
  {
    row_id: 1,
    asset: "ckBTC",
    image: "https://i.ibb.co/WP7FFRH/image-98.png",
    wallet_balance_count: 3.19,
    wallet_balance: 156.51,
    apy: 1.50,
    apy_desc: "Eligible for 2.9M$ GHO Community program",
    apy_type: "variable"
  },
  
  {
    row_id: 3,
    asset: "Dragginz",
    image: "https://i.ibb.co/xJ8KLK7/image-98-6.png",
    wallet_balance_count: 3.19,
    wallet_balance: 156.51,
    apy: 1.50,
    apy_desc: "Eligible for 2.9M$ GHO Community program",
    apy_type: "variable"
  },
]
// constants.jsx

export const transactionHistory = [
 
    {
      hash: "0x65.125ef1d507...",
      block: "6235698",
      method: "Lend",
      age: "2 hrs ago",
      from: "0x65.125ef1d507...",
      to: "0x65.125ef1d507...",
      value: "0.01256321 ETH",
      fee: "0.00000012",
    },
    {
      hash: "0x65.125ef1d507...",
      block: "6235698",
      method: "Stake",
      age: "2 hrs ago",
      from: "0x65.125ef1d507...",
      to: "0x65.125ef1d507...",
      value: "0.01256321 ETH",
      fee: "0.00000012",
    },
    {
      hash: "0x65.125ef1d507...",
      block: "6235698",
      method: "Borrow",
      age: "2 hrs ago",
      from: "0x65.125ef1d507...",
      to: "0x65.125ef1d507...",
      value: "0.01256321 ETH",
      fee: "0.00000012",
    },
    {
      hash: "0x65.125ef1d507...",
      block: "6235698",
      method: "Collateral",
      age: "2 hrs ago",
      from: "0x65.125ef1d507...",
      to: "0x65.125ef1d507...",
      value: "0.01256321 ETH",
      fee: "0.00000012",
    },
    {
      hash: "0x65.125ef1d507...",
      block: "6235698",
      method: "Repay",
      age: "2 hrs ago",
      from: "0x65.125ef1d507...",
      to: "0x65.125ef1d507...",
      value: "0.01256321 ETH",
      fee: "0.00000012",
    },
    {
      hash: "0x65.125ef1d507...",
      block: "6235698",
      method: "Lend",
      age: "2 hrs ago",
      from: "0x65.125ef1d507...",
      to: "0x65.125ef1d507...",
      value: "0.01256321 ETH",
      fee: "0.00000012",
    },
  ];

// constants.js

// constants.js

export const healthFactorValue = 5.26;
export const healthFactorCutOutPositions = {
    green: 10,
    red: 60
};

export const currentLTVValue = 15.28;
export const currentLTVCutOutPositions = {
    green: 20,
    red: 70
};

export const healthFactorMinValue = 1.00;
export const currentLTVThreshold = "76.5%";
export const liquidationThresholdLabel = "Liquidation Threshold";
   

// constants.js

export const INITIAL_ETH_VALUE = "0.00";
export const INITIAL_1INCH_VALUE = "0.00";

export const FAUCET_ASSETS_TABLE_COL = [
  {
    col_id: 0,
    header: "Assest",
  },
  {
    col_id: 1,
    header: "Wallet Balance",
  },
  
  
]
export const FAUCET_ASSETS_TABLE_ROW = [
  {
    row_id: 0,
    asset: "ckBTC",
    image: "https://i.ibb.co/WP7FFRH/image-98.png",
    WalletBalance: 0,
  },
  {
    row_id: 1,
    asset: "ckETH",
    image: "https://i.ibb.co/XbHCNpS/image-98-3.png",
    WalletBalance: 0,
  },
  {
    row_id: 2,
    asset: "Dragginz",
    image: "https://i.ibb.co/xJ8KLK7/image-98-6.png",
    WalletBalance: 0,
  },
  {
    row_id: 3,
    asset: "Internet computer",
    image: "https://i.ibb.co/RzQNb5F/image98.png",
    WalletBalance: 0,
  },
  {
    row_id: 4,
    asset: "OpenChat",
    image: "https://i.ibb.co/Lghfh2k/image-98-7.png",
    WalletBalance: 0,
  },
  {
    row_id: 5,
    asset: "Kinic",
    image: "https://i.ibb.co/LQB24Sm/image-98-9.png",
    WalletBalance: 0,
  },
  {
    row_id: 6,
    image: "https://i.ibb.co/vZ5GJ9y/image-98-4.png",
    asset: "Hot or Not",
    WalletBalance: 0,
  },
  {
    row_id: 7,
    image: "https://i.ibb.co/pbzXtWB/image-98-1.png",
    asset: "ICX",
    WalletBalance: 0,
  },
  {
    row_id: 8,
    asset: "ICGhost",
    image: "https://i.ibb.co/m6jKZYf/image-98-10.png",
    WalletBalance: 0,
  },
  {
    row_id: 9,
    asset: "Modclub",
    image: "https://i.ibb.co/BZgT6c4/image-98-5.png",
    WalletBalance: 0,
  },
  {
    row_id: 10,
    asset: "BOOM DAO",
    image: "https://i.ibb.co/WpP2nJH/image-98-2.png",
    WalletBalance: 0,
  },
  {
    row_id: 11,
    image: "https://i.ibb.co/2vsW2pf/image-98-8.png",
    asset: "Catalyze",
    WalletBalance: 0,
  },
]


export const STACK_DETAILS_TABS = [
  {
    id: 0,
    title: "Funds In Safety Module",
    count: "488.62",
  },
  {
    id: 1,
    title: "Total Emmision Per Day",
    count: "163.93",
  },
]
