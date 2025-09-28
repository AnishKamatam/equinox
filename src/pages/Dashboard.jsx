import React from "react";
import { Package, AlertTriangle, XCircle, DollarSign, CheckCircle } from "lucide-react";


const Dashboard = () => {
 return (
   <div className="page-content">
     {/* Header */}
     <div className="page-header flex justify-between items-center">
       <div className="page-actions">
         <select className="btn-secondary">
           <option>This Month</option>
           <option>Last Month</option>
           <option>This Year</option>
         </select>
       </div>
     </div>


     {/* KPI Cards */}
     <div className="dashboard-grid">
       <div className="dashboard-card">
         <div className="card-title">Total Products</div>
         <div className="card-value">120</div>
       </div>
       <div className="dashboard-card">
         <div className="card-title">Low Stock</div>
         <div className="card-value">15</div>
       </div>
       <div className="dashboard-card">
         <div className="card-title">Out of Stock</div>
         <div className="card-value">3</div>
       </div>
       <div className="dashboard-card">
         <div className="card-title">Inventory Value</div>
         <div className="card-value">$45,600</div>
       </div>
       <div className="dashboard-card">
         <div className="card-title">Paid Invoices</div>
         <div className="card-value">$22,000</div>
       </div>
       <div className="dashboard-card">
         <div className="card-title">Amount Due</div>
         <div className="card-value">$5,400</div>
       </div>
     </div>


     {/* Charts */}
     <div className="trends-section">
       <div className="trends-grid">
         <div className="trend-card">
           <h3 className="trend-card-title">Inventory Health</h3>
           <div className="chart-placeholder">Pie Chart: In Stock vs Low Stock</div>
         </div>
         <div className="trend-card">
           <h3 className="trend-card-title">Financial Summary</h3>
           <div className="chart-placeholder">Line Chart: Sales/Revenue Trends</div>
         </div>
       </div>
     </div>


     {/* Recent Activity */}
     <div className="activity-list mt-8">
       <h3 className="section-title">Recent Activity</h3>
       <div className="activity-item">
         <CheckCircle className="activity-icon text-green-500" />
         <div className="activity-text">Invoice #2023 → Paid ✅</div>
         <div className="activity-time">Today</div>
       </div>
       <div className="activity-item">
         <Package className="activity-icon text-blue-500" />
         <div className="activity-text">Product A restocked (50 units)</div>
         <div className="activity-time">Yesterday</div>
       </div>
       <div className="activity-item">
         <AlertTriangle className="activity-icon text-yellow-500" />
         <div className="activity-text">Product B low stock ⚠️</div>
         <div className="activity-time">2 days ago</div>
       </div>
     </div>


     {/* Recent Invoices */}
     <div className="inventory-table-container mt-8">
       <h3 className="section-title">Recent Invoices</h3>
       <table className="inventory-table">
         <thead>
           <tr>
             <th>#</th>
             <th>Client</th>
             <th>Amount</th>
             <th>Status</th>
             <th>Due Date</th>
           </tr>
         </thead>
         <tbody>
           <tr>
             <td>2023</td>
             <td>Acme Corp</td>
             <td>$2,500</td>
             <td><span className="status-badge status-good">Paid</span></td>
             <td>09/20/2025</td>
           </tr>
           <tr>
             <td>2024</td>
             <td>Globex</td>
             <td>$1,200</td>
             <td><span className="status-badge status-warning">Pending</span></td>
             <td>09/28/2025</td>
           </tr>
           <tr>
             <td>2025</td>
             <td>Umbrella Inc</td>
             <td>$3,800</td>
             <td><span className="status-badge status-critical">Overdue</span></td>
             <td>09/15/2025</td>
           </tr>
         </tbody>
       </table>
     </div>
   </div>
 );
};


export default Dashboard;



