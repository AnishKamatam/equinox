import React from 'react'

const Hero = () => {
  return (
    <section className="hero">
      <div className="container">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              The Smarter Way to Manage Your Inventory
            </h1>
            <p className="hero-description">
              Equinox tracks every item, predicts shortages, and automates reorders so you can focus on what matters most: running your business.
            </p>
            <button className="btn-cta">Request Demo</button>
          </div>
          <div className="hero-visual">
            <div className="gradient-blob"></div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
