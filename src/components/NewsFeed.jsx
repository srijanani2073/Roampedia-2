import React, { useEffect, useState } from "react";
import "./NewsFeed.css";

/**
 * NewsFeed Component - Consolidated version
 * 
 * Props:
 * - articles: array (optional) - if provided, displays these articles (for CountryDashboard)
 * - standalone: boolean (optional) - if true, shows filters and fetches its own news
 * - country: string (optional) - country code for standalone mode
 */
const NewsFeed = ({ articles: externalArticles = null, standalone = false, country: initialCountry = "in" }) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(!externalArticles);
  const [country, setCountry] = useState(initialCountry);
  const [category, setCategory] = useState("top");
  const [language, setLanguage] = useState("en");

  // Transaction form (News Interest) - only for standalone
  const [interest, setInterest] = useState("");
  const [savedInterests, setSavedInterests] = useState([]);

  const NEWSDATA_API_KEY = "pub_9eeba8abf7fc48a681df8f921c969433";

  const fetchNews = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://newsdata.io/api/1/news?apikey=${NEWSDATA_API_KEY}&country=${country}&language=${language}&category=${category}`
      );
      const data = await response.json();
      setArticles(data.results || []);
    } catch (error) {
      console.error("Error fetching news:", error);
    } finally {
      setLoading(false);
    }
  };

  // If external articles provided (CountryDashboard mode), use them
  useEffect(() => {
    if (externalArticles !== null) {
      setArticles(externalArticles);
      setLoading(false);
    }
  }, [externalArticles]);

  // If standalone mode, fetch news on mount and when filters change
  useEffect(() => {
    if (standalone && externalArticles === null) {
      fetchNews();
    }
  }, [country, category, language, standalone]);

  const handleInterestSubmit = (e) => {
    e.preventDefault();
    if (interest.trim() !== "") {
      setSavedInterests([...savedInterests, interest]);
      setInterest("");
    }
  };

  // Render for CountryDashboard (compact version)
  if (!standalone) {
    return (
      <div className="card">
        <div className="card-header">Top News</div>
        <div className="card-body news-body">
          {(!articles || articles.length === 0) && (
            <div className="muted" style={{ padding: '20px', textAlign: 'center' }}>
              📰 No recent news available
            </div>
          )}
          {articles.slice(0, 4).map((a, i) => {
            const title = a.title || "Untitled";
            const description = a.description || (a.content ? a.content.slice(0, 120) + "..." : "No description available");
            const date = a.pubDate ? new Date(a.pubDate).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) : "";
            
            return (
              <a 
                key={i} 
                className="news-item" 
                href={a.link || "#"} 
                target="_blank" 
                rel="noreferrer"
                onClick={(e) => {
                  if (!a.link || a.link === "#") {
                    e.preventDefault();
                  }
                }}
              >
                <div className="news-thumb">
                  {a.image_url ? (
                    <img src={a.image_url} alt={title} onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = '<div class="no-thumb">📰</div>';
                    }} />
                  ) : (
                    <div className="no-thumb">📰</div>
                  )}
                </div>
                <div className="news-info">
                  <h4>{title}</h4>
                  <p>{description}</p>
                  {date && <div className="muted small">🕒 {date}</div>}
                </div>
              </a>
            );
          })}
        </div>
      </div>
    );
  }

  // Render for standalone page (full version with filters)
  return (
    <div className="news-card">
      <h2>📰 Live News Feed</h2>

      {/* Filter Section */}
      <div className="filter-bar">
        <select value={country} onChange={(e) => setCountry(e.target.value)}>
          <option value="in">India</option>
          <option value="us">USA</option>
          <option value="uk">UK</option>
          <option value="jp">Japan</option>
          <option value="au">Australia</option>
        </select>

        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="top">Top</option>
          <option value="business">Business</option>
          <option value="sports">Sports</option>
          <option value="technology">Technology</option>
          <option value="entertainment">Entertainment</option>
          <option value="science">Science</option>
          <option value="world">World</option>
        </select>

        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
        </select>

        <button onClick={fetchNews}>Search</button>
      </div>

      {/* News List */}
      {loading ? (
        <p>Loading news...</p>
      ) : (
        <div className="news-list">
          {articles.slice(0, 8).map((article, index) => (
            <div key={index} className="news-item">
              {article.image_url && (
                <img src={article.image_url} alt={article.title} />
              )}
              <div className="news-content">
                <h3>{article.title}</h3>
                <p>{article.description || "No description available."}</p>
                <a
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Read more →
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transaction Form: News Interest */}
      <div className="news-interest-form">
        <h3>🗒️ Save News Interests</h3>
        <form onSubmit={handleInterestSubmit}>
          <input
            type="text"
            placeholder="Enter a news topic or keyword"
            value={interest}
            onChange={(e) => setInterest(e.target.value)}
          />
          <button type="submit">Add Interest</button>
        </form>
        <ul>
          {savedInterests.map((topic, i) => (
            <li key={i}>• {topic}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default NewsFeed;