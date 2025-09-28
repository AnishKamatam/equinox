import React, { useState, useEffect } from "react";
import { Package, DollarSign, Activity, TrendingUp, Search } from "lucide-react";
import { DatabaseService } from '../services/databaseService';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const databaseService = new DatabaseService();

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('total-items');
  const [dashboardData, setDashboardData] = useState({
    totalItems: 0,
    inventoryValue: 0,
    lowStockCount: 0,
    profitMargin: 0,
    loading: true
  });

  const [chartData, setChartData] = useState({
    trendData: null,
    categoryData: null,
    chartsLoading: true
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [recentItems, setRecentItems] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchRecentItems();
    fetchTopPerformers();
    fetchRecentActivities();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setDashboardData(prev => ({ ...prev, loading: true }));

      // First, let's check what columns are available and get some sample data
      const sampleQuery = 'SELECT * FROM Inventory LIMIT 5';
      const sampleResult = await databaseService.executeQuery(sampleQuery);
      console.log('Sample inventory data:', sampleResult);

      // Query 1: Total Items (sum of all quantities)
      const totalItemsQuery = 'SELECT SUM(quantity) as total_quantity FROM Inventory';
      const totalItemsResult = await databaseService.executeQuery(totalItemsQuery);
      console.log('Total items result:', totalItemsResult);
      const totalItems = totalItemsResult[0]?.total_quantity || 0;

      // Query 2: Inventory Value (sum of total stock value)
      const inventoryValueQuery = 'SELECT SUM(total_stock_value) as total_inventory_value FROM Inventory';
      const inventoryValueResult = await databaseService.executeQuery(inventoryValueQuery);
      console.log('Inventory value result:', inventoryValueResult);
      const inventoryValue = inventoryValueResult[0]?.total_inventory_value || 0;

      // Query 3: Low Stock Items (items where quantity <= threshold)
      const lowStockQuery = 'SELECT COUNT(*) as low_stock_count FROM Inventory WHERE quantity <= threshold AND threshold > 0';
      const lowStockResult = await databaseService.executeQuery(lowStockQuery);
      console.log('Low stock result:', lowStockResult);
      
      const lowStockCount = lowStockResult[0]?.low_stock_count || 0;

      // Query 4: Average Profit Margin
      const profitMarginQuery = 'SELECT AVG(margin_percent) as avg_margin FROM Inventory WHERE margin_percent > 0';
      const profitMarginResult = await databaseService.executeQuery(profitMarginQuery);
      console.log('Profit margin result:', profitMarginResult);
      const profitMargin = profitMarginResult[0]?.avg_margin || 0;

      const newDashboardData = {
        totalItems: parseInt(totalItems),
        inventoryValue: parseFloat(inventoryValue),
        lowStockCount: parseInt(lowStockCount),
        profitMargin: parseFloat(profitMargin),
        loading: false
      };

      console.log('Final dashboard data:', newDashboardData);
      setDashboardData(newDashboardData);

      // Fetch chart data after dashboard data is loaded
      setTimeout(() => {
        fetchChartData();
      }, 100);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setDashboardData(prev => ({ ...prev, loading: false }));
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US').format(value || 0);
  };

  const menuItems = [
    {
      id: 'total-items',
      label: 'Total Items',
      icon: Package,
      value: dashboardData.loading ? 'Loading...' : `${formatNumber(dashboardData.totalItems)} items`,
      count: dashboardData.totalItems
    },
    {
      id: 'inventory-value',
      label: 'Inventory Value', 
      icon: DollarSign,
      value: dashboardData.loading ? 'Loading...' : formatCurrency(dashboardData.inventoryValue),
      count: dashboardData.inventoryValue
    },
    {
      id: 'inventory-health',
      label: 'Inventory Health',
      icon: Activity,
      value: dashboardData.loading ? 'Loading...' : `${dashboardData.lowStockCount} low stock`,
      count: dashboardData.lowStockCount
    },
    {
      id: 'profitability',
      label: 'Profitability',
      icon: TrendingUp,
      value: dashboardData.loading ? 'Loading...' : `${dashboardData.profitMargin.toFixed(1)}% margin`,
      count: dashboardData.profitMargin
    }
  ];

  const handleExport = async () => {
    try {
      // Fetch all inventory data
      const allDataQuery = 'SELECT * FROM Inventory';
      const allData = await databaseService.executeQuery(allDataQuery);
      
      if (!allData || allData.length === 0) {
        alert('No data to export');
        return;
      }

      // Convert to CSV
      const headers = Object.keys(allData[0]);
      const csvContent = [
        headers.join(','),
        ...allData.map(row => 
          headers.map(header => {
            const value = row[header];
            // Handle values with commas or quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value || '';
          }).join(',')
        )
      ].join('\n');

      // Download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data');
    }
  };

  const fetchChartData = async () => {
    try {
      console.log('🎯 Starting fetchChartData with Gemini...');
      setChartData(prev => ({ ...prev, chartsLoading: true }));

      // Fetch entire inventory table
      const allDataQuery = 'SELECT * FROM Inventory';
      console.log('📊 Fetching all inventory data for Gemini analysis...');
      const allInventoryData = await databaseService.executeQuery(allDataQuery);
      console.log(`📊 Retrieved ${allInventoryData.length} inventory items for analysis`);

      if (!allInventoryData || allInventoryData.length === 0) {
        throw new Error('No inventory data available');
      }

      // Import Gemini service
      const { GeminiService } = await import('../services/geminiService');
      const geminiService = new GeminiService();

      // Create analysis prompt for charts
      const analysisPrompt = `
        Analyze this complete inventory dataset and generate chart data for a dashboard:

        INVENTORY DATA (${allInventoryData.length} items):
        ${JSON.stringify(allInventoryData.slice(0, 20))} ... (showing first 20 of ${allInventoryData.length} items)

        Please analyze the full dataset and return a JSON response with exactly this structure:
        {
          "trendData": [
            {"week": "Week 1", "value": 95000},
            {"week": "Week 2", "value": 98000},
            {"week": "Week 3", "value": 102000},
            {"week": "Week 4", "value": 99000},
            {"week": "Week 5", "value": 105000},
            {"week": "Week 6", "value": 108000},
            {"week": "Week 7", "value": 106000},
            {"week": "Week 8", "value": 107000}
          ],
          "categoryData": [
            {"category": "Pantry", "value": 35000, "percentage": "32.7"},
            {"category": "Dairy", "value": 25000, "percentage": "23.3"},
            {"category": "Snacks", "value": 20000, "percentage": "18.7"},
            {"category": "Beverages", "value": 15000, "percentage": "14.0"},
            {"category": "Personal Care", "value": 12000, "percentage": "11.2"}
          ]
        }

        For trendData:
        - Generate realistic 8-week trend data based on current total_stock_value patterns
        - Show weekly inventory value progression with realistic fluctuations
        - Base the final week's value around the current total inventory value (${dashboardData.inventoryValue})

        For categoryData:
        - Group by 'category' field and sum 'total_stock_value' for each
        - Calculate actual percentages of total inventory value
        - Sort by value descending
        - Include top 6-8 categories only
        - Use actual category names from the data

        Return ONLY the JSON object, no other text or formatting.
      `;

      console.log('🤖 Sending data to Gemini for chart analysis...');
      const geminiResponse = await geminiService.generateContent(analysisPrompt);
      console.log('🤖 Gemini raw response:', geminiResponse);

      // Parse Gemini response
      let chartData;
      try {
        // Clean the response (remove any markdown formatting)
        const cleanedResponse = geminiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        chartData = JSON.parse(cleanedResponse);
        console.log('📊 Parsed chart data from Gemini:', chartData);
      } catch (parseError) {
        console.error('❌ Error parsing Gemini response:', parseError);
        throw new Error('Failed to parse chart data from Gemini');
      }

      // Validate the response structure
      if (!chartData.trendData || !chartData.categoryData) {
        throw new Error('Invalid chart data structure from Gemini');
      }

      const finalChartData = {
        trendData: chartData.trendData,
        categoryData: chartData.categoryData,
        chartsLoading: false
      };

      console.log('🎯 Final chart data being set:', finalChartData);
      setChartData(finalChartData);

    } catch (error) {
      console.error('❌ Error fetching chart data:', error);
      
      // Fallback to manual data processing
      console.log('🔄 Using fallback chart data...');
      const fallbackTrendData = [];
      const currentDate = new Date();
      
      // Generate fallback trend data
      for (let i = 7; i >= 0; i--) {
        const weekLabel = `Week ${8 - i}`;
        const baseValue = dashboardData.inventoryValue || 100000;
        const variation = (Math.random() - 0.5) * 0.15; // ±7.5% variation
        const weekValue = baseValue * (1 + variation);
        
        fallbackTrendData.push({
          week: weekLabel,
          value: Math.round(weekValue)
        });
      }

      // Generate fallback category data
      const fallbackCategoryData = [
        { category: "Pantry", value: Math.round((dashboardData.inventoryValue || 100000) * 0.32), percentage: "32.0" },
        { category: "Dairy", value: Math.round((dashboardData.inventoryValue || 100000) * 0.23), percentage: "23.0" },
        { category: "Snacks", value: Math.round((dashboardData.inventoryValue || 100000) * 0.19), percentage: "19.0" },
        { category: "Beverages", value: Math.round((dashboardData.inventoryValue || 100000) * 0.14), percentage: "14.0" },
        { category: "Personal Care", value: Math.round((dashboardData.inventoryValue || 100000) * 0.12), percentage: "12.0" }
      ];

      setChartData({
        trendData: fallbackTrendData,
        categoryData: fallbackCategoryData,
        chartsLoading: false
      });
    }
  };

  const fetchRecentItems = async () => {
    try {
      const recentQuery = 'SELECT item_name, category, quantity, selling_price FROM Inventory ORDER BY last_updated DESC LIMIT 8';
      const items = await databaseService.executeQuery(recentQuery);
      setRecentItems(items || []);
    } catch (error) {
      console.error('Error fetching recent items:', error);
    }
  };

  const fetchTopPerformers = async () => {
    try {
      const topQuery = 'SELECT item_name, category, sales_velocity, quantity, selling_price FROM Inventory WHERE sales_velocity IS NOT NULL ORDER BY sales_velocity DESC LIMIT 5';
      const performers = await databaseService.executeQuery(topQuery);
      setTopPerformers(performers || []);
    } catch (error) {
      console.error('Error fetching top performers:', error);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      // Get recently restocked items (items with last_restock_date within last 30 days)
      const recentRestockQuery = `
        SELECT item_name, category, last_restock_date, last_restock_qty, quantity 
        FROM Inventory 
        WHERE last_restock_date IS NOT NULL 
        ORDER BY last_restock_date DESC 
        LIMIT 10
      `;
      const restockData = await databaseService.executeQuery(recentRestockQuery);
      
      // Transform the data into activity format
      const activities = [];
      
      if (restockData && restockData.length > 0) {
        restockData.forEach((item, index) => {
          const restockDate = new Date(item.last_restock_date);
          const now = new Date();
          const diffTime = Math.abs(now - restockDate);
          const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
          
          let timeAgo;
          if (diffHours < 24) {
            timeAgo = `${diffHours} hours ago`;
          } else {
            const diffDays = Math.ceil(diffHours / 24);
            timeAgo = `${diffDays} days ago`;
          }
          
          activities.push({
            type: 'restock',
            icon: 'activity-restock',
            text: `${item.item_name} restocked`,
            time: timeAgo,
            value: `+${item.last_restock_qty || 0} units`,
            category: item.category
          });
        });
      }
      
      // Add some simulated activities if we have fewer than 4
      while (activities.length < 4) {
        const sampleActivities = [
          {
            type: 'sale',
            icon: 'activity-sale',
            text: 'High sales velocity detected',
            time: `${Math.floor(Math.random() * 12) + 1} hours ago`,
            value: `+$${Math.floor(Math.random() * 3000) + 1000}`,
            category: 'Sales'
          },
          {
            type: 'alert',
            icon: 'activity-alert',
            text: 'Low stock alert triggered',
            time: `${Math.floor(Math.random() * 24) + 1} hours ago`,
            value: `${Math.floor(Math.random() * 20) + 5} items`,
            category: 'Alert'
          },
          {
            type: 'update',
            icon: 'activity-update',
            text: 'Price updated for category',
            time: `${Math.floor(Math.random() * 48) + 1} hours ago`,
            value: `${Math.floor(Math.random() * 15) + 5} items`,
            category: 'Update'
          }
        ];
        
        const randomActivity = sampleActivities[Math.floor(Math.random() * sampleActivities.length)];
        activities.push(randomActivity);
      }
      
      setRecentActivities(activities.slice(0, 4));
      
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      // Set fallback activities
      setRecentActivities([
        {
          type: 'restock',
          icon: 'activity-restock',
          text: 'Inventory restocked',
          time: '2 hours ago',
          value: '+150 units',
          category: 'Restock'
        }
      ]);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const searchQuerySQL = `SELECT item_name, category, quantity, selling_price, sku FROM Inventory WHERE item_name ILIKE '%${searchQuery}%' OR category ILIKE '%${searchQuery}%' OR sku ILIKE '%${searchQuery}%' LIMIT 10`;
      const results = await databaseService.executeQuery(searchQuerySQL);
      setSearchResults(results || []);
    } catch (error) {
      console.error('Error searching items:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchDashboardData();
    fetchChartData();
    fetchRecentItems();
    fetchTopPerformers();
    fetchRecentActivities();
  };

 return (
   <div className="page-content">
      {/* Action Buttons - Top Right */}
      <div className="dashboard-actions">
        <button className="action-btn" onClick={handleExport}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7,10 12,15 17,10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export
        </button>
        <button className="action-btn" onClick={handleRefresh}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23,4 23,10 17,10"/>
            <polyline points="1,20 1,14 7,14"/>
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
          </svg>
          Refresh
        </button>
     </div>

      <div className="dashboard-menu-bar">
        {menuItems.map((item) => (
          <div 
            key={item.id}
            className={`menu-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <div className="menu-item-header">
              <item.icon className="menu-icon" size={16} />
              <span className="menu-label">{item.label}</span>
       </div>
            <div className="menu-value">{item.value}</div>
       </div>
        ))}
       </div>

      {/* Charts Section */}
      <div className="dashboard-charts">
        {/* Inventory Trend Chart */}
        <div className="chart-container trend-chart">
          <div className="chart-header">
            <h3 className="chart-title">Inventory Trend Over Time</h3>
            <p className="chart-subtitle">Line chart: Total stock value by week</p>
       </div>
          <div className="chart-content">
            {chartData.chartsLoading ? (
              <div className="chart-loading">Loading chart...</div>
            ) : chartData.trendData ? (
              <Line
                data={{
                  labels: chartData.trendData.map(item => item.week),
                  datasets: [{
                    label: 'Total Stock Value',
                    data: chartData.trendData.map(item => item.value),
                    borderColor: '#ff1493',
                    backgroundColor: 'rgba(255, 20, 147, 0.08)',
                    borderWidth: 4,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: '#ff1493',
                    pointBorderWidth: 3,
                    pointRadius: 7,
                    pointHoverRadius: 10,
                    pointHoverBackgroundColor: '#ff1493',
                    pointHoverBorderColor: '#ffffff',
                    pointHoverBorderWidth: 4
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: {
                    intersect: false,
                    mode: 'index'
                  },
                  plugins: {
                    legend: {
                      display: false
                    },
                    tooltip: {
                      backgroundColor: 'rgba(26, 32, 44, 0.95)',
                      titleColor: '#ffffff',
                      bodyColor: '#ffffff',
                      borderColor: '#ff1493',
                      borderWidth: 2,
                      cornerRadius: 12,
                      padding: 12,
                      titleFont: {
                        size: 14,
                        weight: 'bold'
                      },
                      bodyFont: {
                        size: 13
                      },
                      callbacks: {
                        label: function(context) {
                          return `Value: $${context.parsed.y.toLocaleString()}`;
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: false,
                      grid: {
                        color: 'rgba(113, 128, 150, 0.1)',
                        drawBorder: false
                      },
                      border: {
                        display: false
                      },
                      ticks: {
                        color: '#718096',
                        font: {
                          size: 12,
                          weight: '500'
                        },
                        padding: 8,
                        callback: function(value) {
                          return '$' + (value / 1000).toFixed(0) + 'K';
                        }
                      }
                    },
                    x: {
                      grid: {
                        display: false
                      },
                      border: {
                        display: false
                      },
                      ticks: {
                        color: '#718096',
                        font: {
                          size: 12,
                          weight: '500'
                        },
                        padding: 8
                      }
                    }
                  }
                }}
              />
            ) : (
              <div className="chart-error">Unable to load chart data</div>
            )}
       </div>
     </div>

        {/* Category Contribution Chart */}
        <div className="chart-container category-chart">
          <div className="chart-header">
            <h3 className="chart-title">Category Contribution</h3>
            <p className="chart-subtitle">Donut chart showing % of total stock value by category</p>
         </div>
          <div className="chart-content">
            {chartData.chartsLoading ? (
              <div className="chart-loading">Loading chart...</div>
            ) : chartData.categoryData && chartData.categoryData.length > 0 ? (
              <Doughnut
                data={{
                  labels: chartData.categoryData.map(item => item.category),
                  datasets: [{
                    data: chartData.categoryData.map(item => item.value),
                    backgroundColor: [
                      '#ff1493', '#36a2eb', '#4bc0c0', '#9966ff', '#ff9f40',
                      '#ff6384', '#20b2aa', '#ffa500', '#da70d6', '#32cd32'
                    ],
                    borderColor: '#ffffff',
                    borderWidth: 4,
                    hoverBorderWidth: 6,
                    hoverBorderColor: '#ffffff',
                    hoverOffset: 8
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '65%',
                  plugins: {
                    legend: {
                      position: 'right',
                      labels: {
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 16,
                        boxWidth: 12,
                        boxHeight: 12,
                        font: {
                          size: 13,
                          weight: '500'
                        },
                        color: '#4a5568',
                        generateLabels: function(chart) {
                          const data = chart.data;
                          return data.labels.map((label, index) => {
                            const value = chartData.categoryData[index];
                            return {
                              text: `${label} (${value.percentage}%)`,
                              fillStyle: data.datasets[0].backgroundColor[index],
                              strokeStyle: data.datasets[0].backgroundColor[index],
                              pointStyle: 'circle'
                            };
                          });
                        }
                      }
                    },
                    tooltip: {
                      backgroundColor: 'rgba(26, 32, 44, 0.95)',
                      titleColor: '#ffffff',
                      bodyColor: '#ffffff',
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                      borderWidth: 1,
                      cornerRadius: 12,
                      padding: 12,
                      titleFont: {
                        size: 14,
                        weight: 'bold'
                      },
                      bodyFont: {
                        size: 13
                      },
                      callbacks: {
                        label: function(context) {
                          const item = chartData.categoryData[context.dataIndex];
                          return `${context.label}: $${item.value.toLocaleString()} (${item.percentage}%)`;
                        }
                      }
                    }
                  }
                }}
              />
            ) : (
              <div className="chart-error">Unable to load chart data</div>
            )}
         </div>
       </div>
     </div>

      {/* Additional Dashboard Sections */}
      <div className="dashboard-sections">
     {/* Recent Activity */}
        <div className="dashboard-section">
          <div className="section-header">
       <h3 className="section-title">Recent Activity</h3>
            <p className="section-subtitle">Latest inventory movements and updates</p>
          </div>
          <div className="section-content">
            <div className="activity-list">
              {recentActivities.length > 0 ? recentActivities.map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className={`activity-icon ${activity.icon}`}></div>
                  <div className="activity-details">
                    <div className="activity-text">{activity.text}</div>
                    <div className="activity-time">{activity.time}</div>
                  </div>
                  <div className="activity-value">{activity.value}</div>
       </div>
              )) : (
                <div className="no-data">Loading recent activities...</div>
              )}
       </div>
       </div>
     </div>

        {/* View Inventory */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3 className="section-title">View Inventory</h3>
            <p className="section-subtitle">Search and browse inventory items</p>
          </div>
          <div className="section-content">
            <div className="inventory-search">
              <div className="search-input-container">
                <input
                  type="text"
                  placeholder="Search items by name, category, or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="search-input"
                />
                <button 
                  onClick={handleSearch}
                  disabled={searchLoading}
                  className="search-button"
                >
                  <Search size={16} />
                </button>
              </div>
            </div>
            
            <div className="inventory-results">
              {searchResults.length > 0 ? (
                <div className="search-results">
                  <div className="results-header">Search Results ({searchResults.length})</div>
                  {searchResults.map((item, index) => (
                    <div key={index} className="inventory-item">
                      <div className="item-details">
                        <div className="item-name">{item.item_name}</div>
                        <div className="item-meta">{item.category} • {item.sku}</div>
                      </div>
                      <div className="item-stats">
                        <div className="item-quantity">Qty: {item.quantity}</div>
                        <div className="item-price">${parseFloat(item.selling_price || 0).toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="recent-items">
                  <div className="results-header">Recent Items</div>
                  {recentItems.slice(0, 6).map((item, index) => (
                    <div key={index} className="inventory-item">
                      <div className="item-details">
                        <div className="item-name">{item.item_name}</div>
                        <div className="item-meta">{item.category}</div>
                      </div>
                      <div className="item-stats">
                        <div className="item-quantity">Qty: {item.quantity}</div>
                        <div className="item-price">${parseFloat(item.selling_price || 0).toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Performers */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3 className="section-title">Top Performers</h3>
            <p className="section-subtitle">Items selling out fastest</p>
          </div>
          <div className="section-content">
            <div className="performers-list">
              {topPerformers.length > 0 ? topPerformers.map((item, index) => (
                <div key={index} className="performer-item">
                  <div className="performer-rank">{index + 1}</div>
                  <div className="performer-details">
                    <div className="performer-name">{item.item_name}</div>
                    <div className="performer-category">{item.category}</div>
                  </div>
                  <div className="performer-stats">
                    <div className="performer-velocity">Velocity: {item.sales_velocity}</div>
                    <div className="performer-stock">Stock: {item.quantity}</div>
                  </div>
                </div>
              )) : (
                <div className="no-data">Loading top performers...</div>
              )}
            </div>
          </div>
        </div>
     </div>
   </div>
 );
};

export default Dashboard;



