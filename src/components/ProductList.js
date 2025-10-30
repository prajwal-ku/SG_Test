// src/components/ProductList.js
import React, { useState, useEffect } from 'react';
import { 
  getContract, 
  safeContractCall, 
  isWeb3Initialized, 
  weiToEther,
  formatAddress 
} from '../utils/web3';
import './ProductList.css';

// Status configuration
const STATUS_CONFIG = {
  0: { text: 'Harvested', color: '#10B981', icon: '🌱' },
  1: { text: 'Processing', color: '#F59E0B', icon: '🏭' },
  2: { text: 'Packaged', color: '#3B82F6', icon: '📦' },
  3: { text: 'In Transit', color: '#8B5CF6', icon: '🚛' },
  4: { text: 'Delivered', color: '#059669', icon: '✅' }
};

const ProductList = ({ account, onStatusUpdate, refreshTrigger }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Generate unique key for each product
  const generateProductKey = (product) => {
    return `product-${product.id}-${product.harvestDate}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Format harvest date
  const formatHarvestDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status display info
  const getStatusInfo = (statusCode) => {
    return STATUS_CONFIG[statusCode] || { text: 'Unknown', color: '#6B7280', icon: '❓' };
  };

  // Calculate product age in days
  const getProductAge = (harvestDate) => {
    if (!harvestDate) return 0;
    const harvestTime = parseInt(harvestDate) * 1000;
    const now = Date.now();
    return Math.floor((now - harvestTime) / (1000 * 60 * 60 * 24));
  };

  // Enhanced product loading with error handling
  const loadProducts = async () => {
    if (!isWeb3Initialized()) {
      setError('Please connect your wallet to view products');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const contract = getContract();
      
      // Use the enhanced loadAllProducts from web3 utils
      const productsData = await loadAllProducts();
      
      // Ensure each product has a unique key
      const productsWithUniqueKeys = productsData.map(product => ({
        ...product,
        uniqueKey: generateProductKey(product),
        ageInDays: getProductAge(product.harvestDate),
        statusInfo: getStatusInfo(parseInt(product.status || '0'))
      }));

      console.log(`✅ Successfully loaded ${productsWithUniqueKeys.length} products`);
      setProducts(productsWithUniqueKeys);

    } catch (error) {
      console.error('❌ Error loading products:', error);
      
      // Enhanced error messages
      if (error.message.includes('ABI mismatch')) {
        setError('Contract configuration issue. Please check contract ABI and address.');
      } else if (error.message.includes('circuit breaker')) {
        setError('Blockchain node temporarily unavailable. Please try again later.');
      } else {
        setError(`Failed to load products: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Mock function - replace with actual import from web3.js
  const loadAllProducts = async () => {
    // This should be imported from your web3.js
    // For now, using a mock implementation
    const contract = getContract();
    let products = [];
    
    try {
      // Try different methods to load products
      const productCount = await safeContractCall(contract.methods.getProductCount);
      const count = parseInt(productCount);
      
      for (let i = 0; i < count; i++) {
        try {
          const product = await safeContractCall(contract.methods.getProduct, i + 1);
          if (product && product.productName) {
            products.push({
              ...product,
              id: (i + 1).toString()
            });
          }
        } catch (e) {
          console.warn(`Failed to load product ${i + 1}:`, e.message);
        }
      }
    } catch (error) {
      console.error('Failed to load products:', error);
      throw error;
    }
    
    return products;
  };

  // Update product status
  const updateProductStatus = async (productId, newStatus) => {
    if (!isWeb3Initialized()) {
      alert('Please connect your wallet first!');
      return;
    }

    try {
      const contract = getContract();
      
      await contract.methods.updateStatus(productId, newStatus).send({ 
        from: account,
        gas: 300000 
      });

      if (onStatusUpdate) {
        onStatusUpdate(`Product ${productId} status updated successfully!`);
      }

      // Reload products to reflect changes
      await loadProducts();

    } catch (error) {
      console.error('Error updating status:', error);
      const errorMessage = error.message.includes('User denied') 
        ? 'Transaction cancelled' 
        : `Failed to update status: ${error.message}`;
      
      if (onStatusUpdate) {
        onStatusUpdate(errorMessage, 'error');
      }
    }
  };

  // Filter and search products
  const filteredProducts = products.filter(product => {
    const matchesFilter = filter === 'all' || 
      (filter === 'forSale' && product.isForSale) ||
      (filter === 'owned' && product.currentOwner && account && 
       product.currentOwner.toLowerCase() === account.toLowerCase()) ||
      (filter === 'harvested' && product.status === '0');
    
    const matchesSearch = searchTerm === '' || 
      product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.farmerName && product.farmerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.farmLocation && product.farmLocation.toLowerCase().includes(searchTerm.toLowerCase())) ||
      product.id.toString().includes(searchTerm);
    
    return matchesFilter && matchesSearch;
  });

  // Load products on component mount and when refreshTrigger changes
  useEffect(() => {
    loadProducts();
  }, [refreshTrigger]);

  // Product Card Component with unique key
  const ProductCard = ({ product }) => (
    <div className="product-card-enhanced" key={product.uniqueKey}>
      <div 
        className="product-gradient-bar"
        style={{ background: `linear-gradient(135deg, ${product.statusInfo.color}, ${product.statusInfo.color}99)` }}
      ></div>
      
      <div className="product-content-enhanced">
        <div className="product-header-enhanced">
          <h4>{product.productName}</h4>
          <div className="product-meta-badge">
            <span className="product-id">#{product.id}</span>
            <span className="age-badge">{product.ageInDays}d</span>
          </div>
        </div>
        
        <div className="product-stats">
          <div className="stat-item">
            <span className="stat-label">👨‍🌾</span>
            <span className="stat-value">{product.farmerName}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">📍</span>
            <span className="stat-value">{product.farmLocation}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">📅</span>
            <span className="stat-value">{formatHarvestDate(product.harvestDate)}</span>
          </div>
        </div>

        <div className="product-footer-enhanced">
          <div 
            className="status-indicator" 
            style={{ background: `linear-gradient(135deg, ${product.statusInfo.color}, ${product.statusInfo.color}99)` }}
          >
            <span className="status-icon">{product.statusInfo.icon}</span>
            {product.statusInfo.text}
          </div>
          
          {product.isForSale && (
            <div className="price-tag">
              <span className="price-amount">{product.value.toFixed(4)}</span>
              <span className="price-currency">ETH</span>
            </div>
          )}
        </div>

        {/* Owner Actions */}
        {product.currentOwner && account && 
         product.currentOwner.toLowerCase() === account.toLowerCase() && (
          <div className="owner-actions">
            <div className="action-buttons">
              {parseInt(product.status) < 1 && (
                <button 
                  onClick={() => updateProductStatus(product.id, 1)}
                  className="action-btn primary"
                >
                  Start Processing
                </button>
              )}
              {parseInt(product.status) < 2 && (
                <button 
                  onClick={() => updateProductStatus(product.id, 2)}
                  className="action-btn primary"
                >
                  Mark Packaged
                </button>
              )}
              {parseInt(product.status) < 3 && (
                <button 
                  onClick={() => updateProductStatus(product.id, 3)}
                  className="action-btn primary"
                >
                  Ship Product
                </button>
              )}
              {parseInt(product.status) < 4 && (
                <button 
                  onClick={() => updateProductStatus(product.id, 4)}
                  className="action-btn success"
                >
                  Mark Delivered
                </button>
              )}
            </div>
          </div>
        )}

        {/* Owner Info */}
        <div className="owner-info">
          <span className="owner-label">Owner:</span>
          <span className="owner-address">
            {product.currentOwner ? formatAddress(product.currentOwner) : 'Unknown'}
          </span>
          {product.currentOwner && account && 
           product.currentOwner.toLowerCase() === account.toLowerCase() && (
            <span className="owner-badge">You</span>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="product-list-loading">
        <div className="loading-spinner"></div>
        <p>Loading products from blockchain...</p>
      </div>
    );
  }

  return (
    <div className="product-list-component">
      <div className="product-list-header">
        <div className="header-content">
          <h2>📦 Products in Supply Chain</h2>
          <p>Manage and track all products in the agricultural supply chain</p>
        </div>
        
        <div className="header-actions">
          <button 
            onClick={loadProducts} 
            disabled={loading}
            className="refresh-btn"
          >
            {loading ? '🔄 Refreshing...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="product-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search products by name, farmer, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>
        
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Products</option>
          <option value="forSale">For Sale</option>
          <option value="owned">My Products</option>
          <option value="harvested">Recently Harvested</option>
        </select>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <span className="error-icon">❌</span>
          {error}
        </div>
      )}

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3>No Products Found</h3>
          <p>
            {products.length === 0 
              ? 'No products have been added to the supply chain yet. Harvest some products to get started!'
              : 'No products match your current filters. Try adjusting your search or filter criteria.'
            }
          </p>
        </div>
      ) : (
        <>
          <div className="products-summary">
            Showing {filteredProducts.length} of {products.length} products
          </div>
          
          <div className="products-grid">
            {filteredProducts.map(product => (
              <ProductCard key={product.uniqueKey} product={product} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ProductList;