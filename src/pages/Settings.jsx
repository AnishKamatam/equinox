import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import AddProductModal from "./AddProductModal";

const Settings = () => {
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [user, setUser] = useState(null);
  const [inventoryStats, setInventoryStats] = useState({
    totalProducts: 0,
    categories: 0,
    lowStock: 0,
  });

  // Change password state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error("Error fetching user:", error.message);
      } else {
        setUser(user);
      }
    };

    const fetchInventoryStats = async () => {
      try {
        // Total Products
        const { count: totalProducts } = await supabase
          .from("Inventory")
          .select("*", { count: "exact", head: true });

        // Low Stock (quantity < 10)
        const { count: lowStock } = await supabase
          .from("Inventory")
          .select("*", { count: "exact", head: true })
          .lt("quantity", 10);

        // Categories (distinct count)
        const { data: categoriesData } = await supabase
          .from("Inventory")
          .select("category")
          .not("category", "is", null);
        
        const uniqueCategories = new Set(categoriesData?.map(item => item.category) || []);
        const categories = uniqueCategories.size;

        setInventoryStats({
          totalProducts: totalProducts || 0,
          categories: categories,
          lowStock: lowStock || 0,
        });
      } catch (error) {
        console.error("Error fetching inventory stats:", error.message);
      }
    };

    fetchUser();
    fetchInventoryStats();
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordSuccess("Password updated successfully ✅");
      setTimeout(() => {
        setShowChangePassword(false);
        setPassword("");
        setConfirmPassword("");
        setPasswordError("");
        setPasswordSuccess("");
      }, 1500);
    }
  };

  return (
    <div className="page-content">
      {/* Page Header */}
      <div className="page-header">
        <h2 className="page-title">Settings</h2>
        <p className="page-subtitle">
          Manage your account, preferences, security, and inventory
        </p>
      </div>

      <div className="settings-sections">
        {/* Account Settings */}
        <div className="settings-section">
          <div className="section-header">
            <h3 className="section-title">Account Settings</h3>
            <p className="section-description">
              Manage your personal information and preferences
            </p>
          </div>

          <div className="settings-grid">
            {/* Profile Info */}
            <div className="settings-card profile-card">
              <div className="card-header">
                <div className="profile-avatar">
                  <span className="avatar-text">
                    {user?.user_metadata?.full_name
                      ? user.user_metadata.full_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                      : "?"}
                  </span>
                </div>
                <div className="profile-info">
                  <h4>Profile Information</h4>
                  <p className="profile-role">
                    {user?.user_metadata?.role || "Administrator"}
                  </p>
                </div>
              </div>
               <div className="profile-details">
                 <div className="detail-item">
                   <span className="detail-label">Email Address</span>
                   <span className="detail-value">{user?.email || "Not set"}</span>
                 </div>
                 <div className="detail-item">
                   <span className="detail-label">Account Status</span>
                   <span className="status-badge active">Active</span>
                 </div>
               </div>
              <button className="btn-primary btn-edit">Edit Profile</button>
            </div>

            {/* Notification Preferences */}
            <div className="settings-card preferences-card">
              <div className="card-header">
                <h4>Notification Preferences</h4>
                <p className="card-description">
                  Choose how you want to be notified
                </p>
              </div>
              <div className="preferences-list">
                <div className="preference-item">
                  <div className="preference-info">
                    <span className="preference-title">Email Notifications</span>
                    <span className="preference-desc">Receive updates via email</span>
                  </div>
                  <label className="switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider round"></span>
                  </label>
                </div>

                <div className="preference-item">
                  <div className="preference-info">
                    <span className="preference-title">SMS Notifications</span>
                    <span className="preference-desc">Receive updates via SMS</span>
                  </div>
                  <label className="switch">
                    <input type="checkbox" />
                    <span className="slider round"></span>
                  </label>
                </div>

                <div className="preference-item">
                  <div className="preference-info">
                    <span className="preference-title">Push Notifications</span>
                    <span className="preference-desc">
                      Receive browser notifications
                    </span>
                  </div>
                  <label className="switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider round"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="settings-section">
          <div className="section-header">
            <h3 className="section-title">Security & Privacy</h3>
            <p className="section-description">
              Manage your account security settings
            </p>
          </div>

          <div className="settings-grid">
            <div className="settings-card security-card">
              <div className="card-header">
                <h4>Password & Authentication</h4>
                <p className="card-description">Keep your account secure</p>
              </div>
              <div className="security-actions">
                <button
                  className="btn-secondary btn-security"
                  onClick={() => setShowChangePassword(true)}
                >
                  Change Password
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Inventory Management */}
        <div className="settings-section">
          <div className="section-header">
            <h3 className="section-title">Inventory Management</h3>
            <p className="section-description">
              Configure your inventory and product settings
            </p>
          </div>

          <div className="settings-grid">
            <div className="settings-card inventory-card">
              <div className="card-header">
                <h4>Product Management</h4>
                <p className="card-description">Add and manage your products</p>
              </div>
                <div className="inventory-stats">
                  <div className="stat-item">
                    <span className="stat-number">{inventoryStats.totalProducts.toLocaleString()}</span>
                    <span className="stat-label">Total Products</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{inventoryStats.categories}</span>
                    <span className="stat-label">Categories</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{inventoryStats.lowStock}</span>
                    <span className="stat-label">Low Stock</span>
                  </div>
                </div>
              <div className="inventory-actions">
                <button
                  className="btn-primary btn-inventory"
                  onClick={() => setShowAddProduct(true)}
                >
                  Add New Product
                </button>
                <button className="btn-secondary btn-inventory">
                  Bulk Import
                </button>
              </div>
            </div>

            <div className="settings-card categories-card">
              <div className="card-header">
                <h4>Categories & Organization</h4>
                <p className="card-description">Organize your inventory</p>
              </div>
              <div className="category-actions">
                <button className="btn-secondary btn-category">
                  Manage Categories
                </button>
                <button className="btn-secondary btn-category">Manage Tags</button>
                <button className="btn-secondary btn-category">
                  Auto-Categorization
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Add Product Modal */}
        {showAddProduct && (
          <AddProductModal 
            onClose={() => setShowAddProduct(false)}
          />
        )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Change Password</h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowChangePassword(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handlePasswordChange} className="modal-form">
              {passwordError && (
                <div className="auth-error">{passwordError}</div>
              )}
              {passwordSuccess && (
                <div className="status-badge active">{passwordSuccess}</div>
              )}

              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Enter new password"
                />
              </div>

              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Confirm new password"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowChangePassword(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
