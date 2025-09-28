import React, { useState, useEffect } from 'react'
import { Search, Filter, Download, RefreshCw } from 'lucide-react'
import { DatabaseService } from '../services/databaseService'

const Inventory = () => {
  const [inventoryData, setInventoryData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })

  const databaseService = new DatabaseService()

  useEffect(() => {
    fetchInventoryData()
  }, [])

  useEffect(() => {
    filterData()
  }, [searchQuery, inventoryData])

  const fetchInventoryData = async () => {
    try {
      setLoading(true)
      const query = `
        SELECT 
          item_name, 
          category, 
          location_in_store as aisle, 
          quantity as stock, 
          selling_price as price,
          unit_cost,
          margin_percent,
          sales_velocity,
          stock_health,
          last_updated
        FROM Inventory 
        ORDER BY item_name ASC
      `
      const data = await databaseService.executeQuery(query)
      setInventoryData(data || [])
    } catch (error) {
      console.error('Error fetching inventory data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterData = () => {
    if (!searchQuery.trim()) {
      setFilteredData(inventoryData)
      return
    }

    const filtered = inventoryData.filter(item =>
      item.item_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.aisle?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredData(filtered)
  }

  const handleSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })

    const sorted = [...filteredData].sort((a, b) => {
      if (a[key] < b[key]) {
        return direction === 'asc' ? -1 : 1
      }
      if (a[key] > b[key]) {
        return direction === 'asc' ? 1 : -1
      }
      return 0
    })
    setFilteredData(sorted)
  }

  const handleExport = () => {
    const csvContent = [
      ['Item Name', 'Category', 'Aisle', 'Stock', 'Price', 'Unit Cost', 'Margin %', 'Sales Velocity', 'Stock Health', 'Last Updated'],
      ...filteredData.map(item => [
        item.item_name || '',
        item.category || '',
        item.aisle || '',
        item.stock || 0,
        item.price || 0,
        item.unit_cost || 0,
        item.margin_percent || 0,
        item.sales_velocity || 0,
        item.stock_health || '',
        item.last_updated || ''
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'inventory-export.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value || 0)
  }

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US').format(value || 0)
  }

  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(1)}%`
  }

  const getStockHealthColor = (health) => {
    switch (health?.toLowerCase()) {
      case 'excellent': return '#48bb78'
      case 'good': return '#38a169'
      case 'fair': return '#ed8936'
      case 'poor': return '#e53e3e'
      default: return '#718096'
    }
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <h2 className="page-title">Inventory Management</h2>
        <p className="page-subtitle">View and manage your inventory items</p>
      </div>

      {/* Search and Actions Bar */}
      <div className="inventory-controls">
        <div className="search-container">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Search by item name, category, or aisle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
        
        <div className="inventory-actions">
          <button 
            onClick={fetchInventoryData}
            className="action-button secondary"
            disabled={loading}
          >
            <RefreshCw className={loading ? 'spinning' : ''} size={16} />
            Refresh
          </button>
          <button 
            onClick={handleExport}
            className="action-button primary"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="inventory-summary">
        <span className="summary-text">
          Showing {filteredData.length} of {inventoryData.length} items
          {searchQuery && ` for "${searchQuery}"`}
        </span>
      </div>

      {/* Inventory Table */}
      <div className="inventory-table-container">
        {loading ? (
          <div className="loading-state">
            <RefreshCw className="spinning" size={24} />
            <span>Loading inventory data...</span>
          </div>
        ) : (
          <table className="inventory-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('item_name')} className="sortable">
                  Item Name {sortConfig.key === 'item_name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('category')} className="sortable">
                  Category {sortConfig.key === 'category' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('aisle')} className="sortable">
                  Aisle {sortConfig.key === 'aisle' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('stock')} className="sortable">
                  Stock {sortConfig.key === 'stock' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('price')} className="sortable">
                  Price {sortConfig.key === 'price' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('unit_cost')} className="sortable">
                  Unit Cost {sortConfig.key === 'unit_cost' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('margin_percent')} className="sortable">
                  Margin % {sortConfig.key === 'margin_percent' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('sales_velocity')} className="sortable">
                  Sales Velocity {sortConfig.key === 'sales_velocity' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('stock_health')} className="sortable">
                  Stock Health {sortConfig.key === 'stock_health' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((item, index) => (
                  <tr key={index}>
                    <td className="item-name">{item.item_name || 'N/A'}</td>
                    <td className="category">{item.category || 'N/A'}</td>
                    <td className="aisle">{item.aisle || 'N/A'}</td>
                    <td className="stock">{formatNumber(item.stock)}</td>
                    <td className="price">{formatCurrency(item.price)}</td>
                    <td className="unit-cost">{formatCurrency(item.unit_cost)}</td>
                    <td className="margin">{formatPercentage(item.margin_percent)}</td>
                    <td className="velocity">{formatNumber(item.sales_velocity)}</td>
                    <td className="stock-health">
                      <span 
                        className="health-badge"
                        style={{ backgroundColor: getStockHealthColor(item.stock_health) }}
                      >
                        {item.stock_health || 'Unknown'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="no-data">
                    {searchQuery ? 'No items found matching your search.' : 'No inventory data available.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default Inventory
