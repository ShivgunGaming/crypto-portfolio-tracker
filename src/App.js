import "./App.css";
import { useEffect, useState } from "react";

function App() {
  const [assets, setAssets] = useState([]);
  const [address, setAddress] = useState("");
  const [selectedChain, setSelectedChain] = useState("eth");
  const [loading, setLoading] = useState(false);

  const fetchAssets = async (address, chain) => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://deep-index.moralis.io/api/v2.2/wallets/${address}/tokens?chain=${chain}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": process.env.REACT_APP_MORALIS_API_KEY,
          },
        }
      );
      const data = await response.json();
      const formattedAssets = data.result.map((asset) => ({
        ...asset,
        chain: chain,
      }));
      setAssets(formattedAssets);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching assets:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets(address, selectedChain);
  }, [address, selectedChain]);

  const handleInputChange = (e) => {
    setAddress(e.target.value);
  };

  const handleButtonClick = () => {
    fetchAssets(address, selectedChain);
  };

  const handleSelectChange = (e) => {
    setSelectedChain(e.target.value);
  };

  return (
    <div className="App">
      <h1>Crypto Tracker</h1>
      <div className="search-container">
        <input
          type="text"
          value={address}
          onChange={handleInputChange}
          placeholder="Enter wallet address"
          className="input-field"
        />
        <select
          value={selectedChain}
          onChange={handleSelectChange}
          className="select-field"
        >
          <option value="eth">Ethereum</option>
          <option value="bsc">Binance Smart Chain</option>
          <option value="matic">Polygon</option>
          <option value="avalanche">Avalanche</option>
        </select>
        <button onClick={handleButtonClick} className="button">
          {loading ? "Loading..." : "Show all my crypto!"}
        </button>
      </div>
      {loading ? (
        <p className="center">Loading assets...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Logo</th>
              <th>Name</th>
              <th>Price</th>
              <th>Value</th>
              <th>24h Change</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <tr key={asset.token_address}>
                <td>
                  <img
                    src={asset.thumbnail}
                    alt={asset.name}
                    className="asset-logo"
                  />
                </td>
                <td>{asset.name}</td>
                <td>{Number(asset.usd_price).toFixed(2)}</td>
                <td>
                  {typeof asset.balance_formatted === "number"
                    ? Number(asset.balance_formatted).toFixed(2)
                    : asset.balance_formatted}
                </td>
                <td
                  className={
                    asset.usd_price_24hr_percent_change < 0
                      ? "negative"
                      : "positive"
                  }
                >
                  {typeof asset.usd_price_24hr_percent_change === "number"
                    ? Number(asset.usd_price_24hr_percent_change).toFixed(2)
                    : asset.usd_price_24hr_percent_change}
                  %
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;
