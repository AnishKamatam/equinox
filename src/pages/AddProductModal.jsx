import React, { useState } from "react";
import { supabase } from "../lib/supabase";

const AddProductModal = ({ onClose }) => {
  const [formData, setFormData] = useState({
    item_name: "",
    sku: "",
    brand: "",
    barcode: "",
    category: "",
    subcategory: "",
    status: "Active",
    description: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.item_name.trim())
      newErrors.item_name = "Product name is required";
    if (!formData.sku.trim()) newErrors.sku = "SKU is required";
    if (!formData.category.trim())
      newErrors.category = "Category is required";
    if (formData.barcode && !/^\d{8,13}$/.test(formData.barcode)) {
      newErrors.barcode = "Barcode must be 8–13 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});
    setSuccess("");

    const { error } = await supabase.from("Inventory").insert([
      {
        item_name: formData.item_name,
        sku: formData.sku,
        brand: formData.brand || null,
        barcode: formData.barcode || null,
        category: formData.category,
        subcategory: formData.subcategory || null,
        status: formData.status,
        description: formData.description || null,
      },
    ]);

    setLoading(false);

    if (error) {
      console.error("Error inserting product:", error.message);
      setErrors({ general: error.message });
    } else {
      setSuccess("✅ Product added successfully!");
      setTimeout(onClose, 1500);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <div className="modal-header">
          <h3>Basic Information</h3>
          <button className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <p className="modal-subtitle">
          Product identification and classification
        </p>

        <form onSubmit={handleSubmit} className="modal-form">
          {errors.general && <div className="auth-error">{errors.general}</div>}
          {success && <div className="status-badge active">{success}</div>}

          {/* Product Name + SKU */}
          <div className="form-row">
            <div className="form-group">
              <label>Product Name *</label>
              <input
                type="text"
                name="item_name"
                value={formData.item_name}
                onChange={handleInputChange}
                className={`form-input ${errors.item_name ? "error" : ""}`}
                placeholder="Enter product name"
              />
              {errors.item_name && (
                <span className="error-message">{errors.item_name}</span>
              )}
            </div>

            <div className="form-group">
              <label>SKU *</label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
                className={`form-input ${errors.sku ? "error" : ""}`}
                placeholder="Enter SKU"
              />
              {errors.sku && (
                <span className="error-message">{errors.sku}</span>
              )}
            </div>
          </div>

          {/* Brand + Barcode */}
          <div className="form-row">
            <div className="form-group">
              <label>Brand</label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter brand name"
              />
            </div>

            <div className="form-group">
              <label>Barcode</label>
              <input
                type="text"
                name="barcode"
                value={formData.barcode}
                onChange={handleInputChange}
                className={`form-input ${errors.barcode ? "error" : ""}`}
                placeholder="Enter barcode (8–13 digits)"
              />
              {errors.barcode && (
                <span className="error-message">{errors.barcode}</span>
              )}
            </div>
          </div>

          {/* Category + Subcategory */}
          <div className="form-row">
            <div className="form-group">
              <label>Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={`form-input ${errors.category ? "error" : ""}`}
              >
                <option value="">Select category</option>
                <option value="Electronics">Electronics</option>
                <option value="Clothing">Clothing</option>
                <option value="Books">Books</option>
                <option value="Home & Garden">Home & Garden</option>
                <option value="Sports">Sports</option>
                <option value="Health & Beauty">Health & Beauty</option>
                <option value="Automotive">Automotive</option>
                <option value="Other">Other</option>
              </select>
              {errors.category && (
                <span className="error-message">{errors.category}</span>
              )}
            </div>

            <div className="form-group">
              <label>Subcategory</label>
              <input
                type="text"
                name="subcategory"
                value={formData.subcategory}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter subcategory"
              />
            </div>
          </div>

          {/* Status */}
          <div className="form-group">
            <label>Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="form-input"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          {/* Description */}
          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Enter product description..."
              rows="3"
            />
          </div>

          {/* Actions */}
          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Saving..." : "Next →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;
