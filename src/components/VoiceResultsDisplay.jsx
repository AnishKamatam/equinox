import React from 'react';
import { BarChart3, Package, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';

const VoiceResultsDisplay = ({ result }) => {
  if (!result) return null;

  const renderSummaryResult = (data) => (
    <div className="voice-results-grid">
      <div className="result-card primary">
        <div className="result-icon">
          <Package size={24} />
        </div>
        <div className="result-content">
          <h3>Total Items</h3>
          <p className="result-number">{data.totalItems}</p>
        </div>
      </div>
      
      <div className="result-card">
        <div className="result-icon">
          <BarChart3 size={24} />
        </div>
        <div className="result-content">
          <h3>Total Value</h3>
          <p className="result-number">${data.totalValue?.toFixed(0) || 0}</p>
        </div>
      </div>
      
      <div className="result-card warning">
        <div className="result-icon">
          <AlertTriangle size={24} />
        </div>
        <div className="result-content">
          <h3>Low Stock</h3>
          <p className="result-number">{data.lowStockCount}</p>
        </div>
      </div>
      
      <div className="result-card danger">
        <div className="result-icon">
          <TrendingDown size={24} />
        </div>
        <div className="result-content">
          <h3>Out of Stock</h3>
          <p className="result-number">{data.outOfStockCount}</p>
        </div>
      </div>
    </div>
  );

  const renderLowStockResult = (data) => (
    <div className="voice-results-table">
      <h3 className="results-title">Low Stock Items</h3>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Brand</th>
              <th>Current</th>
              <th>Threshold</th>
              <th>Category</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 5).map((item, index) => (
              <tr key={index}>
                <td>{item.item_name}</td>
                <td>{item.brand}</td>
                <td className="quantity-current">{item.quantity}</td>
                <td className="quantity-threshold">{item.threshold}</td>
                <td>{item.category}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderExpensiveItemsResult = (data) => (
    <div className="voice-results-table">
      <h3 className="results-title">Most Expensive Items</h3>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Brand</th>
              <th>Price</th>
              <th>Margin</th>
              <th>Category</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 5).map((item, index) => (
              <tr key={index}>
                <td>{item.item_name}</td>
                <td>{item.brand}</td>
                <td className="price">${parseFloat(item.selling_price).toFixed(2)}</td>
                <td className="margin">{parseFloat(item.margin_percent).toFixed(1)}%</td>
                <td>{item.category}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSuppliersResult = (data) => (
    <div className="voice-results-table">
      <h3 className="results-title">Suppliers</h3>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Supplier</th>
              <th>Contact</th>
              <th>Rating</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 5).map((supplier, index) => (
              <tr key={index}>
                <td>{supplier.name}</td>
                <td>{supplier.contact}</td>
                <td className="rating">{supplier.avgRating}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTopSellingResult = (data) => (
    <div className="voice-results-table">
      <h3 className="results-title">Top Selling Items</h3>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Brand</th>
              <th>Sales Velocity</th>
              <th>Sold Today</th>
              <th>Weekly Volume</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 5).map((item, index) => (
              <tr key={index}>
                <td>{item.item_name}</td>
                <td>{item.brand}</td>
                <td className="velocity">{parseFloat(item.sales_velocity).toFixed(2)}</td>
                <td>{item.sold_today}</td>
                <td>{item.weekly_sales_volume}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderResults = () => {
    switch (result.type) {
      case 'summary':
      case 'default':
        return renderSummaryResult(result.data);
      case 'low_stock':
        return renderLowStockResult(result.data);
      case 'expensive':
        return renderExpensiveItemsResult(result.data);
      case 'suppliers':
        return renderSuppliersResult(result.data);
      case 'top_selling':
        return renderTopSellingResult(result.data);
      case 'out_of_stock':
        return renderLowStockResult(result.data); // Same layout
      default:
        return (
          <div className="voice-results-default">
            <p>{result.summary}</p>
          </div>
        );
    }
  };

  return (
    <div className="voice-results-display">
      <div className="results-header">
        <TrendingUp size={20} />
        <span>Query Results</span>
      </div>
      {renderResults()}
    </div>
  );
};

export default VoiceResultsDisplay;