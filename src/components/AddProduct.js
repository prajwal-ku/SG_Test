// src/components/AddProduct.js
import React, { useState, useEffect } from 'react';
import { getContract, safeContractSend, isWeb3Initialized, getAccount } from '../utils/web3';
import './AddProduct.css';

const AddProduct = ({ account, onProductAdded, loading, setLoading }) => {
  const [formData, setFormData] = useState({
    productName: '',
    farmerName: '',
    farmLocation: '',
    harvestDate: ''
  });
  const [localLoading, setLocalLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Check connection status on mount and when account changes
  useEffect(() => {
    const checkConnection = () => {
      const connected = isWeb3Initialized();
      setIsConnected(connected);
    };

    checkConnection();
    
    // Set up interval to check connection status
    const interval = setInterval(checkConnection, 2000);
    
    return () => clearInterval(interval);
  }, [account]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const harvestProduct = async (e) => {
    e.preventDefault();
    
    if (!isWeb3Initialized()) {
      if (onProductAdded) {
        onProductAdded('Please connect to MetaMask first!', 'error');
      } else {
        alert('Please connect to MetaMask first!');
      }
      return;
    }

    // Validate form data
    if (!formData.productName.trim() || !formData.farmerName.trim() || !formData.farmLocation.trim()) {
      const errorMsg = 'Please fill in all required fields!';
      if (onProductAdded) {
        onProductAdded(errorMsg, 'error');
      } else {
        alert(errorMsg);
      }
      return;
    }

    // Use local loading state to prevent conflicts
    setLocalLoading(true);
    if (setLoading) {
      setLoading(true);
    }

    try {
      const contract = getContract();
      const currentAccount = getAccount();
      
      if (!currentAccount) {
        throw new Error('No account connected');
      }

      // Convert date to timestamp (use current time if no date provided)
      const harvestTimestamp = formData.harvestDate 
        ? Math.floor(new Date(formData.harvestDate).getTime() / 1000)
        : Math.floor(Date.now() / 1000);
      
      console.log('🌱 Harvesting product with data:', {
        ...formData,
        harvestTimestamp,
        account: currentAccount
      });

      // Use safeContractSend for better error handling
      const result = await safeContractSend(
        contract.methods.harvestProduct,
        { 
          from: currentAccount,
          gas: 500000,
          gasPrice: undefined // Let web3 determine optimal gas price
        },
        formData.productName.trim(),
        formData.farmerName.trim(),
        formData.farmLocation.trim(),
        harvestTimestamp.toString()
      );

      console.log('✅ Harvest transaction successful:', result);

      // Success notification
      const successMessage = `Product "${formData.productName}" harvested successfully!`;
      if (onProductAdded) {
        onProductAdded(successMessage, 'success');
      } else {
        alert(successMessage);
      }
      
      // Reset form
      setFormData({
        productName: '',
        farmerName: '',
        farmLocation: '',
        harvestDate: ''
      });
      
    } catch (error) {
      console.error('❌ Error harvesting product:', error);
      
      // Enhanced error messages
      let errorMessage = 'Failed to harvest product';
      
      if (error.code === 4001) {
        errorMessage = 'Transaction was cancelled by user';
      } else if (error.message.includes('User denied transaction signature')) {
        errorMessage = 'Transaction was cancelled';
      } else if (error.message.includes('execution reverted')) {
        // Extract revert reason if available
        const revertMatch = error.message.match(/revert (.+)/);
        errorMessage = revertMatch 
          ? `Contract execution failed: ${revertMatch[1]}`
          : 'Contract execution failed. You may not have permission to harvest products.';
      } else if (error.message.includes('out of gas')) {
        errorMessage = 'Transaction ran out of gas. Please try again with higher gas limit.';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient ETH for transaction gas fees. Please add ETH to your wallet.';
      } else if (error.message.includes('nonce too low')) {
        errorMessage = 'Transaction error. Please try again.';
      } else if (error.message.includes('Contract not initialized')) {
        errorMessage = 'Wallet not connected. Please connect your wallet first.';
      } else if (error.message.includes('No account connected')) {
        errorMessage = 'No account connected. Please connect your wallet.';
      } else {
        errorMessage = error.message || 'Unknown error occurred';
      }
      
      if (onProductAdded) {
        onProductAdded(errorMessage, 'error');
      } else {
        alert(`Error: ${errorMessage}`);
      }
    } finally {
      setLocalLoading(false);
      if (setLoading) {
        setLoading(false);
      }
    }
  };

  // Set default harvest date to today
  const setDefaultDate = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormData(prev => ({
      ...prev,
      harvestDate: today
    }));
  };

  // Auto-set today's date when component mounts
  useEffect(() => {
    setDefaultDate();
  }, []);

  const isFormValid = formData.productName.trim() && 
                     formData.farmerName.trim() && 
                     formData.farmLocation.trim() &&
                     formData.harvestDate;

  const isLoading = localLoading || loading;

  return (
    <div className="add-product-component">
      <div className="component-header">
        <h2>🌱 Harvest New Product</h2>
        <p>Add a new agricultural product to the blockchain supply chain</p>
        
        {!isConnected && (
          <div className="connection-warning">
            <div className="warning-icon">⚠️</div>
            <div className="warning-text">
              <strong>Wallet Not Connected</strong>
              <span>Please connect your MetaMask wallet to harvest products</span>
            </div>
          </div>
        )}
      </div>
      
      <form onSubmit={harvestProduct} className="product-form">
        <div className="form-group">
          <label htmlFor="productName">
            Product Name *
            {formData.productName && (
              <span className="char-count">{formData.productName.length}/100</span>
            )}
          </label>
          <input
            type="text"
            id="productName"
            name="productName"
            placeholder="e.g., Organic Apples, Premium Wheat, Fresh Tomatoes"
            value={formData.productName}
            onChange={handleInputChange}
            required
            maxLength={100}
            disabled={isLoading}
          />
          <small>Enter a descriptive name for your product</small>
        </div>
        
        <div className="form-group">
          <label htmlFor="farmerName">
            Farmer Name *
            {formData.farmerName && (
              <span className="char-count">{formData.farmerName.length}/100</span>
            )}
          </label>
          <input
            type="text"
            id="farmerName"
            name="farmerName"
            placeholder="e.g., John Doe Farm, Green Valley Agriculture"
            value={formData.farmerName}
            onChange={handleInputChange}
            required
            maxLength={100}
            disabled={isLoading}
          />
          <small>Name of the farmer or farming organization</small>
        </div>
        
        <div className="form-group">
          <label htmlFor="farmLocation">
            Farm Location *
            {formData.farmLocation && (
              <span className="char-count">{formData.farmLocation.length}/150</span>
            )}
          </label>
          <input
            type="text"
            id="farmLocation"
            name="farmLocation"
            placeholder="e.g., California, USA or Specific farm address"
            value={formData.farmLocation}
            onChange={handleInputChange}
            required
            maxLength={150}
            disabled={isLoading}
          />
          <small>Location where the product was harvested</small>
        </div>
        
        <div className="form-group">
          <label htmlFor="harvestDate">Harvest Date *</label>
          <div className="date-input-group">
            <input
              type="date"
              id="harvestDate"
              name="harvestDate"
              value={formData.harvestDate}
              onChange={handleInputChange}
              required
              disabled={isLoading}
              max={new Date().toISOString().split('T')[0]} // Can't select future dates
            />
            <button 
              type="button" 
              className="date-helper-btn"
              onClick={setDefaultDate}
              disabled={isLoading}
            >
              Today
            </button>
          </div>
          <small>Date when the product was harvested</small>
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className={`submit-btn ${isLoading ? 'loading' : ''} ${!isConnected ? 'disabled' : ''}`}
            disabled={isLoading || !isConnected || !isFormValid}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Harvesting Product...
                <span className="loading-dots">
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                </span>
              </>
            ) : (
              <>
                <span className="btn-icon">🌱</span>
                Harvest Product
                <span className="btn-subtext">Add to Blockchain</span>
              </>
            )}
          </button>
          
          {!isConnected && (
            <div className="warning-message">
              <div className="warning-content">
                <span className="warning-icon">🔗</span>
                <div>
                  <strong>Wallet Disconnected</strong>
                  <p>Connect your MetaMask wallet to start harvesting products</p>
                </div>
              </div>
            </div>
          )}

          {isConnected && !isFormValid && (
            <div className="info-message">
              <span className="info-icon">ℹ️</span>
              Please fill in all required fields to continue
            </div>
          )}
        </div>
      </form>

      <div className="form-info">
        <h4>📋 How It Works</h4>
        <div className="info-steps">
          <div className="info-step">
            <span className="step-number">1</span>
            <div className="step-content">
              <strong>Fill Product Details</strong>
              <p>Enter the product name, farmer information, and harvest location</p>
            </div>
          </div>
          <div className="info-step">
            <span className="step-number">2</span>
            <div className="step-content">
              <strong>Blockchain Recording</strong>
              <p>Product details are permanently recorded on the blockchain</p>
            </div>
          </div>
          <div className="info-step">
            <span className="step-number">3</span>
            <div className="step-content">
              <strong>Supply Chain Tracking</strong>
              <p>Track your product through processing, packaging, and delivery</p>
            </div>
          </div>
        </div>

        <div className="info-features">
          <h5>✨ Features</h5>
          <ul>
            <li>✅ Immutable product record on blockchain</li>
            <li>✅ Transparent supply chain tracking</li>
            <li>✅ Automatic ownership assignment</li>
            <li>✅ Real-time status updates</li>
            <li>✅ Secure and tamper-proof</li>
          </ul>
        </div>

        <div className="gas-notice">
          <span className="notice-icon">⛽</span>
          <div>
            <strong>Gas Fees Apply</strong>
            <p>This transaction requires gas fees. Make sure you have sufficient ETH in your wallet.</p>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner-large"></div>
            <h3>Processing Transaction</h3>
            <p>Please wait while we add your product to the blockchain...</p>
            <div className="transaction-steps">
              <div className="transaction-step active">
                <span className="step-indicator"></span>
                <span>Signing Transaction</span>
              </div>
              <div className="transaction-step">
                <span className="step-indicator"></span>
                <span>Confirming on Blockchain</span>
              </div>
              <div className="transaction-step">
                <span className="step-indicator"></span>
                <span>Product Added</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddProduct;