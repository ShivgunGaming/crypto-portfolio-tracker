import "./App.css";
import { useEffect, useState } from "react";

function App() {
  const [assets, setAssets] = useState([]);
  const [collections, setCollections] = useState([]);
  const [walletHistory, setWalletHistory] = useState([]); // New state for wallet history
  const [address, setAddress] = useState("");
  const [selectedChain, setSelectedChain] = useState("eth");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cachedAssets, setCachedAssets] = useState({});
  const [netWorthData, setNetWorthData] = useState({});
  const [totalNetWorth, setTotalNetWorth] = useState(0);
  const [darkMode, setDarkMode] = useState(false);


  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [darkMode]);

  const fetchAssets = async (address, chain) => {
    if (cachedAssets[address] && cachedAssets[address][chain]) {
      setAssets(cachedAssets[address][chain]);
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

      const collectionsResponse = await fetch(
        `https://deep-index.moralis.io/api/v2.2/${address}/nft/collections?chain=${chain}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": process.env.REACT_APP_MORALIS_API_KEY,
          },
        }
      );
      if (!collectionsResponse.ok) {
        throw new Error("Failed to fetch collections");
      }
      const collectionsData = await collectionsResponse.json();
      setCollections(collectionsData.result);

      setCachedAssets({
        ...cachedAssets,
        [address]: {
          ...cachedAssets[address],
          [chain]: formattedAssets,
        },
      });

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

  const fetchWalletHistory = async (address) => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://deep-index.moralis.io/api/v2.2/wallets/${address}/history`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": process.env.REACT_APP_MORALIS_API_KEY,
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch wallet history");
      }
      const data = await response.json();
      setWalletHistory(data.result);
      setLoading(false);
      setError(null);
    } catch (error) {
      console.error("Error fetching wallet history:", error);
      setLoading(false);
      setError("Failed to fetch wallet history. Please try again.");
    }
  };

  useEffect(() => {
    if (address.trim() !== "") {
      fetchAssets(address, selectedChain);
      fetchNetWorth(address);
      fetchWalletHistory(address); // Fetch wallet history when address changes
    }
  }, [address, selectedChain]);

  const handleInputChange = (e) => {
    setAddress(e.target.value);
  };

  const handleButtonClick = () => {
    if (address.trim() !== "") {
      fetchAssets(address, selectedChain);
      fetchNetWorth(address);
      fetchWalletHistory(address);
    }
  };

  const handleSelectChange = (e) => {
    setSelectedChain(e.target.value);
  };

  return (
    <div className={`App ${darkMode ? "dark-mode" : ""}`}>
      <h1 style={{ color: darkMode ? "#FF1493" : "#333" }}>Crypto Tracker</h1>
      <div className="button-container">
        <button className="dark-theme" onClick={toggleDarkMode}>
          {darkMode ? "☀️" : "🌙"}
        </button>
      </div>

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
                <p
                  className="chain-name"
                  style={{ color: darkMode ? "#FF1493" : "#333" }}
                >
                  {chain.toUpperCase()}
                </p>
                <img
                  src={`${chain}.png`}
                  alt={chain.toUpperCase()}
                  className="chain-logo"
                  style={{ width: "100px", height: "100px" }}
                />
                <p
                  style={{ color: darkMode ? "#FF1493" : "#333" }}
                  className="chain-worth"
                >
                  Net Worth: ${netWorthData[chain]}
                </p>
              </div>
            ))}
          </div>

          <p
            className="net-worth"
            style={{
              fontSize: "20px",
              color: darkMode ? "#FF1493" : "#333",
              fontWeight: "bold",
              textAlign: "center",
            }}
          >
            Total Net Worth: ${totalNetWorth}
          </p>

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
                  <td>${Number(asset.usd_price).toFixed(2)}</td>
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

          {/* NFT Collections */}
          <div className="collection-container">
            <h2
              style={{
                fontSize: "20px",
                color: darkMode ? "#FF1493" : "#333",
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              NFT Collections
            </h2>
            <div className="collection-list">
              {collections.map((collection) => (
                <div key={collection.token_address} className="collection-item">
                  {collection.collection_logo ? (
                    <img
                      src={collection.collection_logo}
                      alt={collection.name}
                      className="collection-image"
                    />
                  ) : (
                    <img
                      src="/question.webp"
                      alt="Placeholder"
                      className="collection-image"
                    />
                  )}
                  <p>{collection.name}</p>
                  <p>Symbol: {collection.symbol}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="wallet-history">
            <h2
              style={{
                fontSize: "20px",
                color: darkMode ? "#FF1493" : "#333",
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              Wallet History
            </h2>
            <ul>
              {walletHistory.map((transaction, index) => (
                <li key={index}>
                  <p>Transaction Hash: {transaction.hash}</p>
                  <p>From: {transaction.from_address}</p>
                  <p>To: {transaction.to_address}</p>
                  {/* Display transaction type */}
                  {transaction.nft_transfers &&
                    transaction.nft_transfers.length > 0 && (
                      <p>Transaction Type: NFT Transfer</p>
                    )}
                  {transaction.erc20_transfer &&
                    transaction.erc20_transfer.length > 0 && (
                      <p>Transaction Type: ERC-20 Transfer</p>
                    )}
                  {transaction.native_transfers &&
                    transaction.native_transfers.length > 0 && (
                      <p>Transaction Type: Native Transfer</p>
                    )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
