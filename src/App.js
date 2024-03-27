import "./App.css";
import { useEffect, useState } from "react";

function App() {
  const [assets, setAssets] = useState([]);
  const [address, setAddress] = useState("");
  const [selectedChain, setSelectedChain] = useState("eth");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cachedAssets, setCachedAssets] = useState({});
  const [netWorthData, setNetWorthData] = useState({});
  const [totalNetWorth, setTotalNetWorth] = useState(0);

  const fetchAssets = async (address, chain) => {
    if (cachedAssets[chain]) {
      setAssets(cachedAssets[chain]);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `https://deep-index.moralis.io/api/v2.2/wallets/${address}/tokens?chain=${chain}&fields=name,thumbnail,usd_price,usd_price_24hr_percent_change`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": process.env.REACT_APP_MORALIS_API_KEY,
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch assets");
      }
      const data = await response.json();
      const formattedAssets = data.result.map((asset) => ({
        ...asset,
        chain: chain,
      }));
      setAssets(formattedAssets);
      setCachedAssets({ ...cachedAssets, [chain]: formattedAssets });
      setLoading(false);
      setError(null);
    } catch (error) {
      console.error("Error fetching assets:", error);
      setLoading(false);
      setError(
        "Failed to fetch assets. Please check your address and try again."
      );
    }
  };

  const fetchNetWorth = async (address) => {
    try {
      setLoading(true);
      const chains = ["eth", "bsc", "matic", "avalanche"];
      const netWorthData = {};

      await Promise.all(
        chains.map(async (chain) => {
          const response = await fetch(
            `https://deep-index.moralis.io/api/v2.2/wallets/${address}/net-worth?chains=${chain}&exclude_spam=true&exclude_unverified_contracts=true`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                "X-API-Key": process.env.REACT_APP_MORALIS_API_KEY,
              },
            }
          );
          if (!response.ok) {
            throw new Error(`Failed to fetch net worth for ${chain}`);
          }
          const data = await response.json();
          netWorthData[chain] = parseFloat(data.total_networth_usd);
        })
      );

      setNetWorthData(netWorthData);

      const totalNetWorthValue = Object.values(netWorthData).reduce(
        (total, value) => total + value,
        0
      );
      setTotalNetWorth(totalNetWorthValue.toFixed(2));
      setLoading(false);
    } catch (error) {
      console.error("Error fetching net worth:", error);
      setLoading(false);
      setError("Failed to fetch net worth data. Please try again.");
    }
  };

  useEffect(() => {
    if (address.trim() !== "") {
      fetchAssets(address, selectedChain);
      fetchNetWorth(address);
    }
  }, [address, selectedChain]);

  const handleInputChange = (e) => {
    setAddress(e.target.value);
  };

  const handleButtonClick = () => {
    if (address.trim() !== "") {
      fetchAssets(address, selectedChain);
      fetchNetWorth(address);
    }
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
      {error && <p className="error">{error}</p>}
      {loading ? (
        <p className="center">Loading assets...</p>
      ) : (
        <div className="container">
          <div className="chain-wrapper">
            {Object.keys(netWorthData).map((chain) => (
              <div key={chain} className="chain-container">
                <p className="chain-name">{chain.toUpperCase()}</p>
                {/* Using specific image filenames */}
                <img
                  src={`${chain}.png`}
                  alt={chain.toUpperCase()}
                  className="chain-logo"
                  style={{ width: "100px", height: "100px" }} // Adjust width and height as needed
                />
                <p className="net-worth">Net Worth: ${netWorthData[chain]}</p>
              </div>
            ))}
          </div>

          <p className="net-worth">Total Net Worth: ${totalNetWorth}</p>
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
        </div>
      )}
    </div>
  );
}

export default App;
