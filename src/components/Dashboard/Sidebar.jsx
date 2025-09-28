import React from 'react'
import { NavLink } from 'react-router-dom'
import { Home, Package, DollarSign, BarChart3, Settings } from 'lucide-react'

const Sidebar = () => {
  const navItems = [
    { path: '/home', label: 'Home', subheading: 'Overview & Key Insights', icon: Home },
    { path: '/inventory', label: 'Inventory', subheading: 'Stock Levels & Product Data', icon: Package },
    { path: '/finances', label: 'Finances', subheading: 'Revenue, Costs & Margins', icon: DollarSign },
    { path: '/insights', label: 'Insights', subheading: 'Trends & Reports', icon: BarChart3 },
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-logo">EQUINOX</h2>
      </div>
      
      <nav className="sidebar-nav">
        <ul className="nav-list">
          {navItems.map((item) => (
            <li key={item.path} className="nav-item">
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'active' : ''}`
                }
              >
                <item.icon className="nav-icon" size={18} />
                <div className="nav-content">
                  <span className="nav-label">{item.label}</span>
                  <span className="nav-subheading">{item.subheading}</span>
                </div>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="sidebar-footer">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `nav-link settings-link ${isActive ? 'active' : ''}`
          }
        >
          <Settings className="nav-icon" size={18} />
          <div className="nav-content">
            <span className="nav-label">Settings</span>
            <span className="nav-subheading">System Configuration</span>
          </div>
        </NavLink>
      </div>
    </aside>
  )
}

export default Sidebar
