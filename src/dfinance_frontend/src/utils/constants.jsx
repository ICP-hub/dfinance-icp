import ckBTC from "../../public/assests-icon/ckBTC.png";
import cekTH from "../../public/assests-icon/cekTH.png";
import Dragginz from "../../public/assests-icon/Dragginz.png";
import icp from "../../public/assests-icon/ICP.svg";
import openChat from "../../public/assests-icon/openChat.png";
import Kinic from "../../public/assests-icon/Kinic.png";
import HotOrNot from "../../public/assests-icon/HotOrNot.png";
import icx from "../../public/assests-icon/ICX.png";
import ICGGhost from "../../public/assests-icon/ICGGhost.png";
import Modclub from "../../public/assests-icon/Modclub.png";
import BooMDao from "../../public/assests-icon/BooMDao.png";
import catalyze from "../../public/assests-icon/catalyze.png";
import ckusdc from "../../public/assests-icon/ckusdc.svg";
import ckusdt from "../../public/assests-icon/ckUSDT.svg";

import trailofbits from "../../public/assests-icon/trail-Of-Bits-svg-fill.png";
import certora from "../../public/assests-icon/certora-svg-fill.png";
import openZeppelinsvg from "../../public/assests-icon/open-Zeppelin-svg.png";
import sigmaprime from "../../public/assests-icon/sigma-Prime-svg-fill.png";
import Peckshield from "../../public/assests-icon/peckshield-logo-svg.png";
import abdk from "../../public/assests-icon/abdk-svg.png";

const TabPanel = ({ items }) => {
  return (
    <div className="flex flex-wrap justify-center gap-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="max-w-xs w-full p-4 border rounded-lg shadow-md"
        >
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-48 object-cover rounded-md"
          />
          <h2 className="mt-4 text-lg font-semibold text-[#0C5A74]">
            {item.title}
          </h2>
          <p className="mt-2 text-sm text-gray-600">{item.description}</p>
        </div>
      ))}
    </div>
  );
};

export const FOOTER_LINK_1 = [
  {
    id: 1,
    title: "Liquidation",
    route: "/Liquidate",
    icon: "",
  },

  {
    id: 4,
    title: "FAQ",
    route: "/#faq",
    icon: "",
  },
];

export const FOOTER_LINK_2 = [
  {
    id: 0,
    title: "Dev Forum",
    route: "https://forum.dfinity.org/t/dfinance-showcase/37942",
    icon: "",
    target: "_blank",
  },
  {
    id: 1,
    title: "Telegram",
    route: "https://t.me/Dfinance_app",
    icon: "",
    target: "_blank",
  },
];

export const HOME_TOP_NAV_LINK = [
  {
    id: 0,
    title: "Market",
    route: "/market",
    icon: "",
  },
  {
    id: 1,
    title: "Docs",
    route:
      "https://dfinance.notion.site/bbe01eaf7d414148bc4b9843675a532f?v=8b792ba254da44ecab1c0c016331c8af&pvs=4",
    icon: "",
    target: "_blank",
  },
  {
    id: 2,
    title: "FAQ",
    route: "/#faq",
    icon: "",
  },
];

export const DASHBOARD_TOP_NAV_LINK = [
  {
    id: 0,
    title: "Dashboard",
    route: "/dashboard",
    icon: "",
    alwaysPresent: true,
  },

  {
    id: 1,
    title: "Market",
    route: "/market",
    icon: "",
    alwaysPresent: true,
  },

  {
    id: 3,
    title: "Faq",
    route: "/#Faq",
    icon: "",
    testnet: false,
  },
  {
    id: 4,
    title: "Faucet",
    route: "/Faucet",
    icon: "",
    testnet: true,
  },
];
export const error = [
  {
    id: 0,
    title: "4o4",
    route: "*",
  },
];
export const MAIN_NAV_LINK = [
  {
    id: 0,
    title: "Supply",
    content: "Supply assets to earn yield and to use as collateral",
  },
  {
    id: 1,
    title: "Liquidity",
    content:
      "Provide Liquidity with $DFIN and earn exponential rewards (phase 2)",
  },
  {
    id: 2,
    title: "Borrow",
    content: "Borrow assets against your supplied collateral",
  },
  {
    id: 3,
    title: "Stake",
    content:
      "Deposit your DFinance into the protocol and earn rewards for securing the protocol (phase 3)",
  },
  {
    id: 4,
    title: "Vote",
    content:
      "Participate in DFinance governance and vote on new proposals, new assets, and protocol upgrades Once DFIN token is live",
  },
];
export const TAB_CARD_DATA = [
  {
    id: 0,
    title: "ckBTC",
    image: ckBTC,
    description:
      "ckBTC — a multi-chain bitcoin twin, trustlessly created by chain-key cryptography and Internet Computer smart contracts that directly hold raw bitcoin. Send and receive ckBTC with 1-2 second finality and negligible fees. ",
  },
  {
    id: 1,
    title: "ckETH",
    image: cekTH,
    description:
      "ckETH, or chain-key Ether, is an ICP-native token representing Ethereum’s ETH on the Internet Computer blockchain. It improves usability and reduces transaction costs for Ethereum users.",
  },

  {
    id: 3,
    title: "Internet computer",
    image: icp,
    description:
      "ICP, developed by the DFINITY Foundation, is a blockchain technology enabling smart contracts and decentralized apps to run directly on the internet, bypassing traditional servers.",
  },

  {
    id: 4,
    title: "ckUSDC",
    image: ckusdc,
    description:
      "ckUSDC is an ICRC-1-compliant token on the Internet Computer, backed 1:1 by USDC. It allows seamless minting and redemption of ckUSDC for USDC through the ckETH minter canister.",
  },
  {
    id: 5,
    title: "ckUSDT",
    image: ckusdt,
    description:
      "ckUSDT is a canister smart contract on the Internet Computer (ICP) enabling fast, gas-free USDT transfers while remaining fully backed 1:1 by USDT on Ethereum. It supports ICRC-1 and ICRC-2 standards, ensuring seamless integration with ICP wallets.",
  },
];

export const SECURITY_CONTRIBUTORS_DATA = [
  {
    id: 0,
    title: "Trail of bits",
    image: trailofbits,
  },
  {
    id: 1,
    title: "Certora",
    image: certora,
  },
  {
    id: 2,
    title: "OpenZeppellin",
    image: openZeppelinsvg,
  },
  {
    id: 3,
    title: "Sigma Prime",
    image: sigmaprime,
  },
  {
    id: 4,
    title: "Peckshield",
    image: Peckshield,
  },
  {
    id: 5,
    title: "ABDK",
    image: abdk,
  },
];

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
];

export const FAQ_QUESTION = [
  {
    id: 0,
    question: "What is DFinance?",
    answer:
      "DFinance is the first decentralized lending protocol on ICP that allows users to borrow and lend crypto assets. The protocol is designed to be user-friendly, transparent, and easy to use.",
  },
  {
    id: 1,
    question: "How do I borrow?",
    answer:
      "To borrow, users need to deposit their crypto assets into the protocol. Once they deposit, they can choose from the available market assets, including stablecoins, ICP, ckBTC, ckETH, and other crypto assets.",
  },
  {
    id: 2,
    question: "Will there be an airdrop?",
    answer:
      "Yes, phase 1, before the official $DFIN token is live, users can accumulate points according to our points system. ",
  },
  {
    id: 3,
    question: "What is the planned full functionality of the platform?",
    answer:
      "The platform will role out carefully, with security as our number 1 priority. For a full understanding of our phased roll out, take a look at the road map here. ",
  },
  {
    id: 4,
    question: "Why are you launching on ICP?",
    answer:
      "ICP is long overdue for a robust DeFi ecosystem. DFinance will be the first borrow lend protocol on ICP and will be a key player in unlocking new opportunities for yield as well as attracting liquidity from outside ICP through innovative incentive structures that take the best from other successful borrow and lend protocols and improve upon them with ICP infrastructure. For a full understanding of the DFinance economy.",
  },
];

export const WALLET_DETAILS_TABS = [
  {
    id: 0,
    title: "Total Market Size",
    count: "300.76",
  },
  {
    id: 1,
    title: "Total Supplies",
    count: "400.76",
  },
  {
    id: 2,
    title: "Total Borrows",
    count: "290.76",
  },
];
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
];

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
];

export const WALLET_ASSETS_TABLE_ROW = [
  {
    row_id: 0,
    asset: "ckBTC",
    image: ckBTC,
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
    image: cekTH,
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
    image: Dragginz,
    total_supply_count: 3.19,
    total_supply: 156.51,
    supply_apy: 3.19,
    total_borrow_count: 3.19,
    total_borrow: 156.51,
    borrow_apy: 3.19,
  },
  {
    row_id: 3,
    asset: "ICP",
    image: icp,
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
    image: openChat,
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
    image: Kinic,
    total_supply_count: 3.19,
    total_supply: 156.51,
    supply_apy: 3.19,
    total_borrow_count: 3.19,
    total_borrow: 156.51,
    borrow_apy: 3.19,
  },
  {
    row_id: 6,
    image: HotOrNot,
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
    image: icx,
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
    image: ICGGhost,
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
    image: Modclub,
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
    image: BooMDao,
    total_supply_count: 3.19,
    total_supply: 156.51,
    supply_apy: 3.19,
    total_borrow_count: 3.19,
    total_borrow: 156.51,
    borrow_apy: 3.19,
  },
  {
    row_id: 11,
    image: catalyze,
    asset: "Catalyze",
    total_supply_count: 3.19,
    total_supply: 156.51,
    supply_apy: 3.19,
    total_borrow_count: 3.19,
    total_borrow: 156.51,
    borrow_apy: 3.19,
  },
];

export const LIQUIDATION_USERLIST_COL = [
  {
    col_id: 0,
    header: "User Principle",
  },
  {
    col_id: 1,
    header: "Debt Amount",
  },
  {
    col_id: 2,
    header: "Debt assets",
  },
  {
    col_id: 3,
    header: "Collateral Assets",
  },
];

export const LIQUIDATION_USERLIST_ROW = [
  {
    row_id: 0,
    user_principle: "2tv4x-wgo7x-a7wst-3yfjwnfkh2iug8738fhbi2k2bijfbj l ",
    debt_amount: 156.51,
    debt_assets: [{ image: ckBTC }, { image: cekTH }],
    collateral_assets: [{ image: ckBTC }, { image: cekTH }, { image: cekTH }],
  },
  {
    row_id: 1,
    user_principle: "2tv4x-wgo7x-a7wst-3y...",
    debt_amount: 156.51,
    debt_assets: [{ image: ckBTC }, { image: cekTH }],
    collateral_assets: [{ image: ckBTC }, { image: cekTH }, { image: cekTH }],
  },
  {
    row_id: 2,
    user_principle: "2tv4x-wgo7x-a7wst-3y...",
    debt_amount: 156.51,
    debt_assets: [{ image: ckBTC }, { image: cekTH }],
    collateral_assets: [{ image: ckBTC }, { image: cekTH }, { image: cekTH }],
  },
];

export const ASSET_DETAILS = ["Supply Info", "Borrow Info"];

export const PROPOSALS_DETAILS = [
  "All proposals",
  "Created",
  "Open for voting's",
  "Passed",
  "Failed",
  "Executed",
  "Cancelled",
  "Expired",
];

export const TOP_TEN_PROP = [
  { title: "ckETH", voteCount: 45562, id: 1 },
  { title: "ckBTC", voteCount: 41526, id: 2 },
  { title: "Dragginz", voteCount: 123500, id: 3 },
  { title: "OpenChat", voteCount: 0, id: 4 },
  { title: "Kinic", voteCount: 0, id: 5 },
  { title: "Hot or Not", voteCount: 0, id: 6 },
  { title: "ICGhost", voteCount: 0, id: 7 },
  { title: "BOOM DAO", voteCount: 0, id: 8 },
];
export const TAB_CARD_DESCRIPTION_LENGTH = 300;

export const TEMP_HERO_COUNTER_NUMBER = 10000000;

export function generateRandomUsername() {
  const adjectives = [
    "lion",
    "eagle",
    "tiger",
    "hawk",
    "panther",
    "bear",
    "wolf",
    "fox",
    "shark",
    "dragon",
  ];
  const nouns = [
    "lender",
    "borrower",
    "trader",
    "investor",
    "spender",
    "saver",
    "buyer",
    "seller",
    "collector",
    "enthusiast",
  ];

  const randomAdjective =
    adjectives[Math.floor(Math.random() * adjectives.length)];
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
  },
  {
    col_id: 3,
    header: "Can be Collateral",
  },
];

export const MY_SUPPLY_ASSET_TABLE_ROWS = [
  {
    row_id: 0,
    asset: "ckETH",
    image: cekTH,
    wallet_balance_count: 3.19,
    wallet_balance: 156.51,
    apy: 1.5,
    apy_desc: "Eligible for 2.9M$ GHO Community program",
  },
  {
    row_id: 1,
    asset: "ckBTC",
    image: ckBTC,
    wallet_balance_count: 3.19,
    wallet_balance: 156.51,
    apy: 1.5,
    apy_desc: "Eligible for 2.9M$ GHO Community program",
  },
];

export const MY_ASSET_TO_SUPPLY_TABLE_COL = [
  {
    col_id: 0,
    header: "Asset",
  },
  {
    col_id: 1,
    header: "Available",
  },
  {
    col_id: 2,
    header1: "APY",
  },
];
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
    header1: "APY",
    header2: "APY, borrow rate",
  },
];
export const MY_ASSET_TO_SUPPLY_TABLE_ROW = [
  {
    row_id: 0,
    asset: "ckETH",
    image: cekTH,
    wallet_balance_count: 3.19,
    wallet_balance: 156.51,
    apy: 1.5,
    apy_desc: "Eligible for 2.9M$ GHO Community program",
  },
  {
    row_id: 1,
    asset: "ckBTC",
    image: ckBTC,
    wallet_balance_count: 3.19,
    wallet_balance: 156.51,
    apy: 1.5,
    apy_desc: "Eligible for 2.9M$ GHO Community program",
  },

  {
    row_id: 3,
    asset: "Dragginz",
    image: Dragginz,
    wallet_balance_count: 3.19,
    wallet_balance: 156.51,
    apy: 1.5,
    apy_desc: "Eligible for 2.9M$ GHO Community program",
  },
  {
    row_id: 4,
    asset: "OpenChat",
    image: openChat,
    wallet_balance_count: 3.19,
    wallet_balance: 156.51,
    apy: 1.5,
    apy_desc: "Eligible for 2.9M$ GHO Community program",
  },
  {
    row_id: 5,
    asset: "OpenChat",
    image: openChat,
    wallet_balance_count: 3.19,
    wallet_balance: 156.51,
    apy: 1.5,
    apy_desc: "Eligible for 2.9M$ GHO Community program",
  },
];
export const MY_ASSET_TO_BORROW_TABLE_ROW = [
  {
    row_id: 0,
    asset: "ckETH",
    image: cekTH,
    wallet_balance_count: 3.19,
    wallet_balance: 156.51,
    apy: " 1.50-2.02%",
    apy_desc: "Eligible for 2.9M$ GHO Community program",
  },
];
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
  },
  {
    col_id: 3,
    header: "APY TYPE",
  },
];

export const MY_BORROW_ASSET_TABLE_ROWS = [
  {
    row_id: 0,
    asset: "ckETH",
    image: cekTH,
    wallet_balance_count: 3.19,
    wallet_balance: 156.51,
    apy: 1.5,
    apy_desc: "Eligible for 2.9M$ GHO Community program",
    apy_type: "variable",
  },
  {
    row_id: 1,
    asset: "ckBTC",
    image: ckBTC,
    wallet_balance_count: 3.19,
    wallet_balance: 156.51,
    apy: 1.5,
    apy_desc: "Eligible for 2.9M$ GHO Community program",
    apy_type: "variable",
  },
];

export const transactionHistory = [
  {
    hash: "0x65.125ef1d507468968590909400",
    block: "6235698",
    status: "Complete",
    method: "Lend",
    age: "2 hrs ago",
    from: "0x65.125ef1d507",
    to: "0x65.125ef1d507",
    value: "0.01256321 ETH",
    fee: "0.00000012",
    timestamp: "Just Now [20/07/2024, 22:25:58]",
  },
  {
    hash: "0x65.125ef1d507",
    block: "6235698",
    status: "Complete",
    method: "Stake",
    age: "2 hrs ago",
    from: "0x65.125ef1d507",
    to: "0x65.125ef1d5078739279e037939y709",
    value: "0.01256321 ETH",
    fee: "0.00000012",
    timestamp: "Just Now [20/07/2024, 22:25:58]",
  },
  {
    hash: "0x65.125ef1d507",
    block: "6235698",
    status: "Pending",
    method: "Borrow",
    age: "2 hrs ago",
    from: "0x65.125ef1d507",
    to: "0x65.125ef1d507",
    value: "0.01256321 ETH",
    fee: "0.00000012",
    timestamp: "Just Now [20/07/2024, 22:25:58]",
  },
  {
    hash: "0x65.125ef1d507",
    block: "6235698",
    status: "Complete",
    method: "Collateral",
    age: "2 hrs ago",
    from: "0x65.125ef1d507",
    to: "0x65.125ef1d507",
    value: "0.01256321 ETH",
    fee: "0.00000012",
    timestamp: "Just Now [20/07/2024, 22:25:58]",
  },
  {
    hash: "0x65.125ef1d507",
    block: "6235698",
    status: "progress",
    method: "Repay",
    age: "2 hrs ago",
    from: "0x65.125ef1d507",
    to: "0x65.125ef1d507",
    value: "0.01256321 ETH",
    fee: "0.00000012",
    timestamp: "Just Now [20/07/2024, 22:25:58]",
  },
  {
    hash: "0x65.125ef1d507",
    block: "6235698",
    status: "failed",
    method: "Lend",
    age: "2 hrs ago",
    from: "0x65.125ef1d507",
    to: "0x65.125ef1d507",
    value: "0.01256321 ETH",
    fee: "0.00000012",
    timestamp: "Just Now [20/07/2024, 22:25:58]",
  },
  {
    hash: "0x65.125ef1d507",
    block: "6235698",
    status: "progress",
    method: "Repay",
    age: "2 hrs ago",
    from: "0x65.125ef1d507",
    to: "0x65.125ef1d507",
    value: "0.01256321 ETH",
    fee: "0.00000012",
    timestamp: "Just Now [20/07/2024, 22:25:58]",
  },
  {
    hash: "0x65.125ef1d507",
    block: "6235698",
    status: "progress",
    method: "Repay",
    age: "2 hrs ago",
    from: "0x65.125ef1d507",
    to: "0x65.125ef1d507",
    value: "0.01256321 ETH",
    fee: "0.00000012",
    timestamp: "Just Now [20/07/2024, 22:25:58]",
  },
  {
    hash: "0x65.125ef1d507",
    block: "6235698",
    status: "progress",
    method: "Repay",
    age: "2 hrs ago",
    from: "0x65.125ef1d507",
    to: "0x65.125ef1d507",
    value: "0.01256321 ETH",
    fee: "0.00000012",
    timestamp: "Just Now [20/07/2024, 22:25:58]",
  },
  {
    hash: "0x65.125ef1d507",
    block: "6235698",
    status: "progress",
    method: "Repay",
    age: "2 hrs ago",
    from: "0x65.125ef1d507",
    to: "0x65.125ef1d507",
    value: "0.01256321 ETH",
    fee: "0.00000012",
    timestamp: "Just Now [20/07/2024, 22:25:58]",
  },
  {
    hash: "0x65.125ef1d507",
    block: "6235698",
    status: "progress",
    method: "Repay",
    age: "2 hrs ago",
    from: "0x65.125ef1d507",
    to: "0x65.125ef1d507",
    value: "0.01256321 ETH",
    fee: "0.00000012",
    timestamp: "Just Now [20/07/2024, 22:25:58]",
  },
  {
    hash: "0x65.125ef1d507",
    block: "6235698",
    status: "progress",
    method: "Repay",
    age: "2 hrs ago",
    from: "0x65.125ef1d507",
    to: "0x65.125ef1d507",
    value: "0.01256321 ETH",
    fee: "0.00000012",
    timestamp: "Just Now [20/07/2024, 22:25:58]",
  },
  {
    hash: "0x65.125ef1d507",
    block: "6235698",
    status: "progress",
    method: "Repay",
    age: "2 hrs ago",
    from: "0x65.125ef1d507",
    to: "0x65.125ef1d507",
    value: "0.01256321 ETH",
    fee: "0.00000012",
    timestamp: "Just Now [20/07/2024, 22:25:58]",
  },
  {
    hash: "0x65.125ef1d507",
    block: "6235698",
    status: "progress",
    method: "Repay",
    age: "2 hrs ago",
    from: "0x65.125ef1d507",
    to: "0x65.125ef1d507",
    value: "0.01256321 ETH",
    fee: "0.00000012",
    timestamp: "Just Now [20/07/2024, 22:25:58]",
  },
  {
    hash: "0x65.125ef1d507",
    block: "6235698",
    status: "progress",
    method: "Repay",
    age: "2 hrs ago",
    from: "0x65.125ef1d507",
    to: "0x65.125ef1d507",
    value: "0.01256321 ETH",
    fee: "0.00000012",
    timestamp: "Just Now [20/07/2024, 22:25:58]",
  },
  {
    hash: "0x65.125ef1d507",
    block: "6235698",
    status: "progress",
    method: "Repay",
    age: "2 hrs ago",
    from: "0x65.125ef1d507",
    to: "0x65.125ef1d507",
    value: "0.01256321 ETH",
    fee: "0.00000012",
    timestamp: "Just Now [20/07/2024, 22:25:58]",
  },
  {
    hash: "0x65.125ef1d507",
    block: "6235698",
    status: "progress",
    method: "Repay",
    age: "2 hrs ago",
    from: "0x65.125ef1d507",
    to: "0x65.125ef1d507",
    value: "0.01256321 ETH",
    fee: "0.00000012",
    timestamp: "Just Now [20/07/2024, 22:25:58]",
  },
  {
    hash: "0x65.125ef1d507",
    block: "6235698",
    status: "progress",
    method: "Repay",
    age: "2 hrs ago",
    from: "0x65.125ef1d507",
    to: "0x65.125ef1d507",
    value: "0.01256321 ETH",
    fee: "0.00000012",
    timestamp: "Just Now [20/07/2024, 22:25:58]",
  },
  {
    hash: "0x65.125ef1d507",
    block: "6235698",
    status: "progress",
    method: "Repay",
    age: "2 hrs ago",
    from: "0x65.125ef1d507",
    to: "0x65.125ef1d507",
    value: "0.01256321 ETH",
    fee: "0.00000012",
    timestamp: "Just Now [20/07/2024, 22:25:58]",
  },
  {
    hash: "0x65.125ef1d507",
    block: "6235698",
    status: "progress",
    method: "Repay",
    age: "2 hrs ago",
    from: "0x65.125ef1d507",
    to: "0x65.125ef1d507",
    value: "0.01256321 ETH",
    fee: "0.00000012",
    timestamp: "Just Now [20/07/2024, 22:25:58]",
  },
  {
    hash: "0x65.125ef1d507",
    block: "6235698",
    status: "progress",
    method: "Repay",
    age: "2 hrs ago",
    from: "0x65.125ef1d507",
    to: "0x65.125ef1d507",
    value: "0.01256321 ETH",
    fee: "0.00000012",
    timestamp: "Just Now [20/07/2024, 22:25:58]",
  },
  {
    hash: "0x65.125ef1d507",
    block: "6235698",
    status: "progress",
    method: "Repay",
    age: "2 hrs ago",
    from: "0x65.125ef1d507",
    to: "0x65.125ef1d507",
    value: "0.01256321 ETH",
    fee: "0.00000012",
    timestamp: "Just Now [20/07/2024, 22:25:58]",
  },
  {
    hash: "0x65.125ef1d507",
    block: "6235698",
    status: "progress",
    method: "Repay",
    age: "2 hrs ago",
    from: "0x65.125ef1d507",
    to: "0x65.125ef1d507",
    value: "0.01256321 ETH",
    fee: "0.00000012",
    timestamp: "Just Now [20/07/2024, 22:25:58]",
  },
  {
    hash: "0x65.125ef1d507",
    block: "6235698",
    status: "progress",
    method: "Repay",
    age: "2 hrs ago",
    from: "0x65.125ef1d507",
    to: "0x65.125ef1d507",
    value: "0.01256321 ETH",
    fee: "0.00000012",
    timestamp: "Just Now [20/07/2024, 22:25:58]",
  },
  {
    hash: "0x65.125ef1d507",
    block: "6235698",
    status: "progress",
    method: "Repay",
    age: "2 hrs ago",
    from: "0x65.125ef1d507",
    to: "0x65.125ef1d507",
    value: "0.01256321 ETH",
    fee: "0.00000012",
    timestamp: "Just Now [20/07/2024, 22:25:58]",
  },

  {
    hash: "0x65.125ef1d507",
    block: "6235698",
    status: "progress",
    method: "Repay",
    age: "2 hrs ago",
    from: "0x65.125ef1d507",
    to: "0x65.125ef1d507",
    value: "0.01256321 ETH",
    fee: "0.00000012",
    timestamp: "Just Now [20/07/2024, 22:25:58]",
  },
  {
    hash: "0x65.125ef1d507",
    block: "6235698",
    status: "progress",
    method: "Repay",
    age: "2 hrs ago",
    from: "0x65.125ef1d507",
    to: "0x65.125ef1d507",
    value: "0.01256321 ETH",
    fee: "0.00000012",
    timestamp: "Just Now [20/07/2024, 22:25:58]",
  },
  {
    hash: "0x65.125ef1d507",
    block: "6235698",
    status: "progress",
    method: "Repay",
    age: "2 hrs ago",
    from: "0x65.125ef1d507",
    to: "0x65.125ef1d507",
    value: "0.01256321 ETH",
    fee: "0.00000012",
    timestamp: "Just Now [20/07/2024, 22:25:58]",
  },
  {
    hash: "0x65.125ef1d507",
    block: "6235698",
    status: "progress",
    method: "Repay",
    age: "2 hrs ago",
    from: "0x65.125ef1d507",
    to: "0x65.125ef1d507",
    value: "0.01256321 ETH",
    fee: "0.00000012",
    timestamp: "Just Now [20/07/2024, 22:25:58]",
  },
  {
    hash: "0x65.125ef1d507",
    block: "6235698",
    status: "progress",
    method: "Repay",
    age: "2 hrs ago",
    from: "0x65.125ef1d507",
    to: "0x65.125ef1d507",
    value: "0.01256321 ETH",
    fee: "0.00000012",
    timestamp: "Just Now [20/07/2024, 22:25:58]",
  },
  {
    hash: "0x65.125ef1d507",
    block: "6235698",
    status: "progress",
    method: "Repay",
    age: "2 hrs ago",
    from: "0x65.125ef1d507",
    to: "0x65.125ef1d507",
    value: "0.01256321 ETH",
    fee: "0.00000012",
    timestamp: "Just Now [20/07/2024, 22:25:58]",
  },

  {
    hash: "0x65.125ef1d507",
    block: "6235698",
    status: "progress",
    method: "Repay",
    age: "2 hrs ago",
    from: "0x65.125ef1d507",
    to: "0x65.125ef1d507",
    value: "0.01256321 ETH",
    fee: "0.00000012",
    timestamp: "Just Now [20/07/2024, 22:25:58]",
  },
  {
    hash: "0x65.125ef1d507",
    block: "6235698",
    status: "progress",
    method: "Repay",
    age: "2 hrs ago",
    from: "0x65.125ef1d507",
    to: "0x65.125ef1d507",
    value: "0.01256321 ETH",
    fee: "0.00000012",
    timestamp: "Just Now [20/07/2024, 22:25:58]",
  },
  {
    hash: "0x65.125ef1d507",
    block: "6235698",
    status: "progress",
    method: "Repay",
    age: "2 hrs ago",
    from: "0x65.125ef1d507",
    to: "0x65.125ef1d507",
    value: "0.01256321 ETH",
    fee: "0.00000012",
    timestamp: "Just Now [20/07/2024, 22:25:58]",
  },

  {
    hash: "0x65.125ef1d507",
    block: "6235698",
    status: "progress",
    method: "Repay",
    age: "2 hrs ago",
    from: "0x65.125ef1d507",
    to: "0x65.125ef1d507",
    value: "0.01256321 ETH",
    fee: "0.00000012",
    timestamp: "Just Now [20/07/2024, 22:25:58]",
  },

  {
    hash: "0x65.125ef1d507",
    block: "6235698",
    status: "progress",
    method: "Repay",
    age: "2 hrs ago",
    from: "0x65.125ef1d507",
    to: "0x65.125ef1d507",
    value: "0.01256321 ETH",
    fee: "0.00000012",
    timestamp: "Just Now [20/07/2024, 22:25:58]",
  },
  {
    hash: "0x65.125ef1d507",
    block: "6235698",
    status: "progress",
    method: "Repay",
    age: "2 hrs ago",
    from: "0x65.125ef1d507",
    to: "0x65.125ef1d507",
    value: "0.01256321 ETH",
    fee: "0.00000012",
    timestamp: "Just Now [20/07/2024, 22:25:58]",
  },
  {
    hash: "0x65.125ef1d507",
    block: "6235698",
    status: "progress",
    method: "Repay",
    age: "2 hrs ago",
    from: "0x65.125ef1d507",
    to: "0x65.125ef1d507",
    value: "0.01256321 ETH",
    fee: "0.00000012",
    timestamp: "Just Now [20/07/2024, 22:25:58]",
  },
  {
    hash: "0x65.125ef1d507",
    block: "6235698",
    status: "progress",
    method: "Repay",
    age: "2 hrs ago",
    from: "0x65.125ef1d507",
    to: "0x65.125ef1d507",
    value: "0.01256321 ETH",
    fee: "0.00000012",
    timestamp: "Just Now [20/07/2024, 22:25:58]",
  },
  {
    hash: "0x65.125ef1d507",
    block: "6235698",
    status: "progress",
    method: "Repay",
    age: "2 hrs ago",
    from: "0x65.125ef1d507",
    to: "0x65.125ef1d507",
    value: "0.01256321 ETH",
    fee: "0.00000012",
    timestamp: "Just Now [20/07/2024, 22:25:58]",
  },
  {
    hash: "0x65.125ef1d507",
    block: "6235698",
    status: "progress",
    method: "Repay",
    age: "2 hrs ago",
    from: "0x65.125ef1d507",
    to: "0x65.125ef1d507",
    value: "0.01256321 ETH",
    fee: "0.00000012",
    timestamp: "Just Now [20/07/2024, 22:25:58]",
  },
];

export const healthFactorValue = 0.5;
export const healthFactorCutOutPositions = {
  green: 10,
};

export const currentLTVValue = 50;
export const currentLTVCutOutPositions = {};

export const healthFactorMinValue = 1.0;
export const currentLTVThreshold = "76.5%";
export const liquidationThresholdLabel = "Liquidation Threshold";

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
];
export const FAUCET_ASSETS_TABLE_ROW = [
  {
    row_id: 0,
    asset: "ckBTC",
    image: ckBTC,
    WalletBalance: 0,
  },
  {
    row_id: 1,
    asset: "ckETH",
    image: cekTH,
    WalletBalance: 0,
  },

  {
    row_id: 3,
    asset: "ICP",
    image: icp,
    WalletBalance: 0,
  },
  {
    row_id: 4,
    asset: "ckUSDC",
    image: ckusdc,
    WalletBalance: 0,
  },
];

export const STACK_DETAILS_TABS = [
  {
    id: 0,
    title: "Funds In Safety Module",
    count: "0",
  },
  {
    id: 1,
    title: "Total Emmision Per Day",
    count: "0",
  },
];
