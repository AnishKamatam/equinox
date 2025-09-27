import React from 'react'

const Features = () => {
  return (
    <section className="features">
      <div className="container">
        <div className="features-header">
          <span className="features-badge">Feature Cards</span>
          <h2 className="features-title">
            The AI Native inventory system that runs itself
          </h2>
          <p className="features-description">
            Smart automation that tracks every product, forecasts demand, and keeps your stock levels balanced. Equinox learns from your operations and adapts as your needs change.
          </p>
        </div>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon blue-purple-gradient"></div>
            <h3 className="feature-title">Know your stock at every moment.</h3>
            <ul className="feature-list">
              <li>Real-time item tracking</li>
              <li>Low-stock and restock alerts</li>
              <li>Instant valuation of current inventory</li>
            </ul>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon yellow-orange-gradient"></div>
            <h3 className="feature-title">Forecast what you'll need next.</h3>
            <ul className="feature-list">
              <li>Demand prediction based on sales trends</li>
              <li>Smart reorder recommendations</li>
              <li>Automatic supplier scheduling</li>
            </ul>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon cyan-blue-gradient"></div>
            <h3 className="feature-title">Turn data into decisions.</h3>
            <ul className="feature-list">
              <li>Weekly and monthly AI reports</li>
              <li>Spend and margin analysis</li>
              <li>Category and performance insights</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Features
