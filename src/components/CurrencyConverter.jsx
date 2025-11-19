import React, { useState, useEffect, useMemo } from "react";
import "./CurrencyConverter.css";

/**
 * CurrencyConverter Component - Consolidated version
 * 
 * Props:
 * - exchangeRates: object (optional) - if provided, uses these rates (for CountryDashboard)
 * - defaultTo: string (optional) - default currency to convert to
 * - defaultToSymbol: string (optional) - symbol for default currency
 * - standalone: boolean (optional) - if true, shows additional features like history and notes
 */
const CurrencyConverter = ({ 
  exchangeRates: externalRates = null, 
  defaultTo = "USD", 
  defaultToSymbol = "$",
  standalone = false 
}) => {
  const [currencies, setCurrencies] = useState([]);
  const [fromCurrency, setFromCurrency] = useState(standalone ? "USD" : "INR");
  const [toCurrency, setToCurrency] = useState(defaultTo || "USD");
  const [amount, setAmount] = useState(standalone ? 1 : 100);
  const [result, setResult] = useState(null);
  const [rate, setRate] = useState(null);
  
  // Standalone features
  const [history, setHistory] = useState([]);
  const [logNote, setLogNote] = useState("");
  const [logList, setLogList] = useState([]);

  // For CountryDashboard mode
  const rates = externalRates?.rates || null;
  const base = externalRates?.base || "EUR";

  // Update toCurrency when defaultTo changes (CountryDashboard mode)
  useEffect(() => {
    if (!standalone) {
      setToCurrency(defaultTo || "USD");
    }
  }, [defaultTo, standalone]);

  // Fetch currencies for standalone mode
  useEffect(() => {
    if (standalone) {
      fetch("https://open.er-api.com/v6/latest/USD")
        .then(res => res.json())
        .then(data => setCurrencies(Object.keys(data.rates)))
        .catch(err => console.error("Error fetching currencies:", err));
    }
  }, [standalone]);

  // Currency options for CountryDashboard mode
  const options = useMemo(() => {
    if (standalone) return currencies;
    
    if (!rates) return ["INR", "USD", "EUR", "GBP", "JPY", "CNY", defaultTo].filter((v, i, a) => a.indexOf(v) === i);
    
    const allCodes = Object.keys(rates).sort();
    const priorityCodes = ["INR", "USD", "EUR", "GBP", "JPY", "CNY", defaultTo];
    const uniquePriority = priorityCodes.filter((v, i, a) => a.indexOf(v) === i && (allCodes.includes(v) || v === base));
    
    return [...uniquePriority, ...allCodes.filter(c => !uniquePriority.includes(c))].slice(0, 100);
  }, [rates, base, defaultTo, standalone, currencies]);

  // Conversion logic for standalone mode (using open.er-api.com)
  const convertStandalone = async () => {
    try {
      const res = await fetch(`https://open.er-api.com/v6/latest/${fromCurrency}`);
      const data = await res.json();
      const rateValue = data.rates[toCurrency];
      setRate(rateValue);
      const converted = (amount * rateValue).toFixed(2);
      setResult(converted);
      setHistory([{ fromCurrency, toCurrency, amount, converted }, ...history.slice(0, 4)]);
    } catch (err) {
      console.error("Conversion error:", err);
    }
  };

  // Conversion logic for CountryDashboard mode (using provided exchangeRates)
  useEffect(() => {
    if (!standalone && rates) {
      try {
        const rateFrom = fromCurrency === base ? 1 : (rates[fromCurrency] || null);
        const rateTo = toCurrency === base ? 1 : (rates[toCurrency] || null);
        
        if (rateFrom === null || rateTo === null) {
          setResult(null);
          return;
        }
        
        const converted = ((amount / rateFrom) * rateTo);
        setResult(isFinite(converted) ? converted : null);
      } catch (err) {
        console.warn("Currency conversion error:", err);
        setResult(null);
      }
    } else if (!standalone && !rates) {
      setResult(null);
    }
  }, [amount, fromCurrency, toCurrency, rates, base, standalone]);

  const handleSwap = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };

  const handleConvert = () => {
    if (standalone) {
      convertStandalone();
    }
  };

  const handleLogSubmit = (e) => {
    e.preventDefault();
    if (logNote.trim() !== "") {
      setLogList([...logList, logNote]);
      setLogNote("");
    }
  };

  // Render for CountryDashboard (compact version)
  if (!standalone) {
    return (
      <div className="card">
        <div className="card-header">Currency Converter</div>
        <div className="card-body conv">
          {!rates && (
            <div className="muted" style={{ marginBottom: '12px', padding: '10px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '8px', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
              ⚠️ Exchange rates unavailable. API may be rate-limited.
            </div>
          )}
          
          <div className="conv-row">
            <div>
              <label>From</label>
              <select value={fromCurrency} onChange={(e)=>setFromCurrency(e.target.value)} disabled={!rates}>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label>To</label>
              <select value={toCurrency} onChange={(e)=>setToCurrency(e.target.value)} disabled={!rates}>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          <div className="conv-row">
            <div>
              <label>Amount</label>
              <input 
                type="number" 
                value={amount} 
                min="0" 
                step="any"
                onChange={(e)=>setAmount(Number(e.target.value))} 
                disabled={!rates}
              />
            </div>
            <div>
              <label>Result</label>
              <div className="conv-result-value">
                {result !== null && rates ? `${result.toFixed(2)} ${toCurrency}` : "—"}
              </div>
            </div>
          </div>

          <div className="muted small">
            {rates ? `Base: ${base} • ${Object.keys(rates).length} currencies` : "Rates from exchangerate.host"}
          </div>
        </div>
      </div>
    );
  }

  // Render for standalone page (full version)
  return (
    <div className="converter-card">
      <h2>💱 Currency Converter</h2>

      <div className="input-group">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <select
          value={fromCurrency}
          onChange={(e) => setFromCurrency(e.target.value)}
        >
          {options.map((cur) => (
            <option key={cur} value={cur}>{cur}</option>
          ))}
        </select>

        <button onClick={handleSwap}>🔁</button>

        <select
          value={toCurrency}
          onChange={(e) => setToCurrency(e.target.value)}
        >
          {options.map((cur) => (
            <option key={cur} value={cur}>{cur}</option>
          ))}
        </select>
      </div>

      <button onClick={handleConvert}>Convert</button>

      {result && (
        <div className="result-section">
          <p className="result">
            {amount} {fromCurrency} = <strong>{result} {toCurrency}</strong>
          </p>
          {rate && <p>1 {fromCurrency} = {rate} {toCurrency}</p>}
        </div>
      )}

      {/* Conversion History */}
      {history.length > 0 && (
        <div className="history">
          <h4>Recent Conversions</h4>
          <ul>
            {history.map((h, i) => (
              <li key={i}>
                {h.amount} {h.fromCurrency} → {h.converted} {h.toCurrency}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Transaction Form: Currency Log */}
      <div className="currency-log-form">
        <h3>🗒️ Conversion Notes</h3>
        <form onSubmit={handleLogSubmit}>
          <input
            type="text"
            placeholder="Add a note for this conversion"
            value={logNote}
            onChange={(e) => setLogNote(e.target.value)}
          />
          <button type="submit">Add Log</button>
        </form>
        <ul>
          {logList.map((log, i) => (
            <li key={i}>• {log}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CurrencyConverter;