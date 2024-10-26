import express from 'express';
import axios from 'axios';
import cors from 'cors';

const app = express();

// CORS configuration
const corsOptions = {
  origin: ['https://ooya4-zqaaa-aaaam-admba-cai.icp0.io', 'http://localhost:3000'],
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400,
  preflightContinue: false,
};

app.use(cors(corsOptions));

// API list with fallback options
const apis = [
  {
    name: 'CoinGecko',
    url: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,usd-coin,internet-computer,tether&vs_currencies=usd'
  },
  {
    name: 'CoinCap',
    url: 'https://api.coincap.io/v2/assets?ids=bitcoin,ethereum,usd-coin,internet-computer,tether'
  },
  {
    name: 'CryptoCompare',
    url: 'https://min-api.cryptocompare.com/data/pricemulti?fsyms=BTC,ETH,USDC,ICP,USDT&tsyms=USD'
  }
];

// Caching setup
let cachedRates = null;
let lastFetchedTime = 0;

// Function to fetch conversion rates from multiple APIs with fallback
const fetchConversionRates = async () => {
  for (const api of apis) {
    try {
      const response = await axios.get(api.url);
      console.log(`Successfully fetched from ${api.name}`);
      return response.data;  // Return the data on the first successful response
    } catch (error) {
      console.error(`Error fetching from ${api.name}:`, error.message);
      continue;  // If there's an error, try the next API
    }
  }
  throw new Error('All APIs failed to fetch conversion rates');
};

// API endpoint to get conversion rates with caching
app.get('/conversion-rates', async (req, res) => {
  const currentTime = Date.now();

  // Fetch new data if cache is stale (older than 60 seconds)
  if (!cachedRates || currentTime - lastFetchedTime > 60000) {
    try {
      cachedRates = await fetchConversionRates();
      lastFetchedTime = currentTime;
    } catch (error) {
      return res.status(500).json({ error: 'All APIs failed to fetch conversion rates' });
    }
  }

  res.json(cachedRates);  // Return cached or newly fetched data
});

// Server setup
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// import express from 'express';
// import axios from 'axios';
// import cors from 'cors';

// const app = express();
// const corsOptions = {
//   origin: ['https://ooya4-zqaaa-aaaam-admba-cai.icp0.io', 'http://localhost:3000'],
//   optionsSuccessStatus: 200,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
//   credentials: true,
//   maxAge: 86400,
//   preflightContinue: false
// };


// app.use(cors(corsOptions));

// let cachedRates = null;
// let lastFetchedTime = 0;

// app.get('/conversion-rates', async (req, res) => {
//   const currentTime = Date.now();

 
//   if (!cachedRates || currentTime - lastFetchedTime > 60000) {
//     try {
//       const response = await axios.get(
//         'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,usd-coin,internet-computer&vs_currencies=usd'
//       );
//       cachedRates = response.data;
//       lastFetchedTime = currentTime;
//     } catch (error) {
//       return res.status(500).json({ error: 'Error fetching conversion rates' });
//     }
//   }

//   res.json(cachedRates); 
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
