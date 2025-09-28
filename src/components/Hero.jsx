import React from 'react'

const Hero = () => {
  return (
    <section className="hero">
      <div className="container">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              An Inventory System That Works for You, Not the Other Way Around
            </h1>
            <p className="hero-description">
              Replace dozens of spreadsheets and manual processes with one autonomous system that works like a full-time team.
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
