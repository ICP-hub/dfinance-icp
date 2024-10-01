import express from 'express';
import axios from 'axios';
import cors from 'cors'; 

const app = express();
app.use(cors()); 
let cachedRates = null;
let lastFetchedTime = 0;

app.get('/conversion-rates', async (req, res) => {
  const currentTime = Date.now();

  if (!cachedRates || currentTime - lastFetchedTime > 60000) {
    try {
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,usd-coin,internet-computer&vs_currencies=usd'
      );
      cachedRates = response.data;
      lastFetchedTime = currentTime;
    } catch (error) {
      return res.status(500).json({ error: 'Error fetching conversion rates' });
    }
  }

  res.json(cachedRates);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
