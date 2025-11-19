import React from "react";

/**
 * NewsFeed Component
 * Displays news articles with thumbnail, title, description, and date
 * 
 * Props:
 * - articles: array from newsdata.io (may be empty)
 */
export default function NewsFeed({ articles = [] }) {
  // Debug logging
  React.useEffect(() => {
    if (articles && articles.length > 0) {
      console.log("📰 News articles received:", articles.length);
      console.log("First article structure:", articles[0]);
    }
  }, [articles]);

  return (
    <div className="card news-card">
      <div className="card-header">📰 Top News</div>
      <div className="card-body news-body">
        {(!articles || articles.length === 0) && (
          <div className="muted" style={{ padding: '20px', textAlign: 'center' }}>
            📰 No recent news available
          </div>
        )}
        {articles.slice(0, 4).map((article, index) => {
          // Extract article data with fallbacks
          const title = article.title || article.name || "Untitled Article";
          const description = article.description || 
                            (article.content ? article.content.slice(0, 120) + "..." : "") ||
                            "No description available";
          
          // Format date
          let formattedDate = "";
          if (article.pubDate) {
            try {
              formattedDate = new Date(article.pubDate).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });
            } catch (e) {
              console.warn("Date parsing error:", e);
            }
          }
          
          return (
            <a 
              key={`news-${index}-${article.article_id || index}`}
              className="news-item" 
              href={article.link || article.url || "#"} 
              target="_blank" 
              rel="noreferrer"
              onClick={(e) => {
                if (!article.link && !article.url) {
                  e.preventDefault();
                }
              }}
            >
              {/* Thumbnail */}
              <div className="news-thumb">
                {article.image_url ? (
                  <img 
                    src={article.image_url} 
                    alt={title}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const parent = e.target.parentElement;
                      if (parent && !parent.querySelector('.no-thumb')) {
                        const placeholder = document.createElement('div');
                        placeholder.className = 'no-thumb';
                        placeholder.textContent = '📰';
                        parent.appendChild(placeholder);
                      }
                    }} 
                  />
                ) : (
                  <div className="no-thumb">📰</div>
                )}
              </div>
              
              {/* News Content */}
              <div className="news-info">
                <h4 title={title}>{title}</h4>
                <p title={description}>{description}</p>
                {formattedDate && (
                  <div className="muted small news-date">
                    🕒 {formattedDate}
                  </div>
                )}
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}