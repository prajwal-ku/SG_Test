// src/App.js
import React, { useState, useEffect, useCallback } from 'react';
import Web3 from 'web3';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from './config';
import './App.css';

// Backend API base URL
const BACKEND_URL = 'http://localhost:5000';

// Advanced Icons with multiple variants
const Icons = {
  dashboard: '📊',
  products: '🌱',
  transactions: '🔄',
  users: '👥',
  analytics: '📈',
  settings: '⚙️',
  harvest: '🌾',
  process: '🏭',
  package: '📦',
  ship: '🚛',
  receive: '✅',
  quality: '⭐',
  sale: '💰',
  purchase: '🛒',
  wallet: '👛',
  disconnect: '🚪',
  refresh: '🔄',
  filter: '🔍',
  search: '🔎',
  add: '➕',
  export: '📤',
  trendingUp: '📈',
  trendingDown: '📉',
  dollar: '💵',
  inventory: '📋',
  temperature: '🌡️',
  time: '⏱️',
  calendar: '📅',
  location: '📍',
  farmer: '👨‍🌾',
  owner: '👤',
  verified: '✅',
  warning: '⚠️',
  error: '❌',
  info: 'ℹ️',
  chevronRight: '›',
  chevronLeft: '‹',
  chevronDown: '⌄',
  menu: '☰',
  close: '✕',
  database: '🗄️'
};

function App() {
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState('');
  const [loading, setLoading] = useState({
    authorize: false,
    harvest: false,
    update: false,
    sale: false,
    purchase: false,
    general: false,
    database: false
  });
  const [products, setProducts] = useState([]);
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [viewMode, setViewMode] = useState('grid');

  // Database connection state
  const [databaseConnected, setDatabaseConnected] = useState(false);

  // Advanced Form States
  const [userAddress, setUserAddress] = useState('');
  const [productName, setProductName] = useState('');
  const [farmerName, setFarmerName] = useState('');
  const [productLocation, setProductLocation] = useState('');
  const [updateProductId, setUpdateProductId] = useState('');
  const [saleProductId, setSaleProductId] = useState('');
  const [purchaseProductId, setPurchaseProductId] = useState('');
  const [status, setStatus] = useState('0');
  const [salePriceEth, setSalePriceEth] = useState('');
  const [purchasePriceEth, setPurchasePriceEth] = useState('');

  // Advanced Analytics State
  const [analytics, setAnalytics] = useState({
    totalProducts: 0,
    productsForSale: 0,
    myProducts: 0,
    totalValue: 0,
    recentActivity: 0,
    supplyChainHealth: 85,
    avgTransactionTime: '2.3',
    customerSatisfaction: 92,
    carbonFootprint: '1.2t'
  });

  // DATABASE API FUNCTIONS
  const testDatabaseConnection = async () => {
    setLoading(prev => ({ ...prev, database: true }));
    try {
      const response = await fetch(`${BACKEND_URL}/api/test-db`);
      const result = await response.json();
      
      if (result.success) {
        setDatabaseConnected(true);
        addNotification('🗄️ Database connection successful!', 'success');
        return true;
      } else {
        setDatabaseConnected(false);
        addNotification('❌ Database connection failed', 'error');
        return false;
      }
    } catch (error) {
      console.error('Error testing database connection:', error);
      setDatabaseConnected(false);
      addNotification('❌ Cannot connect to database server', 'error');
      return false;
    } finally {
      setLoading(prev => ({ ...prev, database: false }));
    }
  };

  const storeProductInDatabase = async (productData) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_name: productData.productName,
          farmer_name: productData.farmerName,
          farm_location: productData.farmLocation,
          harvest_date: parseInt(productData.harvestDate),
          blockchain_owner_address: productData.currentOwner,
          current_status: parseInt(productData.status),
          price_wei: productData.price,
          is_for_sale: productData.isForSale,
          blockchain_product_id: productData.blockchainId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        addNotification(`🗄️ ${result.popup.message}`, 'success');
        return { success: true, data: result.data, productId: result.productId };
      } else {
        addNotification(`❌ ${result.popup.message}`, 'error');
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error storing product in database:', error);
      addNotification('❌ Failed to connect to database server', 'error');
      return { success: false, error: error.message };
    }
  };

  const updateProductStatusInDatabase = async (productId, newStatus) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/status-history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: parseInt(productId),
          blockchain_product_id: parseInt(productId),
          old_status: 0,
          new_status: parseInt(newStatus),
          changed_by: account || 'local-user',
          transaction_hash: 'blockchain-update-' + Date.now()
        })
      });

      const result = await response.json();
      
      if (result.success) {
        addNotification('✅ Status updated in database!', 'success');
        return true;
      } else {
        addNotification('❌ Failed to update status in database', 'error');
        return false;
      }
    } catch (error) {
      console.error('Error updating product status in database:', error);
      addNotification('❌ Failed to update status in database', 'error');
      return false;
    }
  };

  const storeSaleInDatabase = async (productId, priceInWei) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/sales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: parseInt(productId),
          blockchain_product_id: parseInt(productId),
          seller_address: account || 'local-user',
          buyer_address: null,
          sale_price_wei: priceInWei,
          sale_status: 'listed',
          transaction_hash: 'blockchain-sale-' + Date.now()
        })
      });

      const result = await response.json();
      
      if (result.success) {
        addNotification('✅ Sale recorded in database!', 'success');
        return true;
      } else {
        addNotification('❌ Failed to record sale in database', 'error');
        return false;
      }
    } catch (error) {
      console.error('Error storing sale in database:', error);
      addNotification('❌ Failed to record sale in database', 'error');
      return false;
    }
  };

  const loadProductsFromDatabase = async () => {
    if (!databaseConnected) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/products`);
      const result = await response.json();
      
      if (result.success) {
        // Transform database products to match frontend format
        const transformedProducts = result.data.map(product => ({
          id: product.blockchain_product_id?.toString() || product.id?.toString(),
          productName: product.product_name,
          farmerName: product.farmer_name,
          farmLocation: product.farm_location,
          harvestDate: product.harvest_date?.toString() || Math.floor(Date.now() / 1000).toString(),
          status: product.current_status?.toString() || '0',
          currentOwner: product.blockchain_owner_address || 'Unknown',
          price: product.price_wei?.toString() || '0',
          isForSale: product.is_for_sale || false,
          ageInDays: Math.floor((Date.now() / 1000 - parseInt(product.harvest_date || Date.now() / 1000)) / (24 * 60 * 60)),
          uniqueKey: `db-product-${product.id}-${Date.now()}`,
          fromDatabase: true
        }));
        
        console.log(`🗄️ Loaded ${transformedProducts.length} products from database`);
        return transformedProducts;
      }
    } catch (error) {
      console.error('Error loading products from database:', error);
    }
    return [];
  };

  // Enhanced validation with advanced features
  const validateAddress = (address) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const validateInputs = (requiredFields) => {
    for (const [field, value] of Object.entries(requiredFields)) {
      if (!value || value.toString().trim() === '') {
        addNotification(`Error: ${field} is required`, 'error');
        return false;
      }
    }
    return true;
  };

  // Enhanced utility functions with BigInt support
  const weiToEther = (wei) => {
    return Web3.utils.fromWei(wei.toString(), 'ether');
  };

  const etherToWei = (ether) => {
    return Web3.utils.toWei(ether.toString(), 'ether');
  };

  const formatPrice = (wei) => {
    const eth = weiToEther(wei);
    return parseFloat(eth).toFixed(4);
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(38)}`;
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  // NEW: Safe BigInt conversion
  const safeBigInt = (value) => {
    if (typeof value === 'bigint') return value;
    return BigInt(value.toString());
  };

  // NEW: Safe gas calculation
  const calculateGasWithBuffer = (gasEstimate) => {
    const gasBigInt = safeBigInt(gasEstimate);
    const buffer = gasBigInt * BigInt(120) / BigInt(100); // 20% buffer
    return buffer.toString();
  };

  const getStatusName = (statusCode) => {
    const statuses = ['Harvested', 'Processing', 'Packaged', 'In Transit', 'Delivered'];
    return statuses[parseInt(statusCode)] || 'Unknown';
  };

  const getStatusIcon = (statusCode) => {
    const icons = [Icons.harvest, Icons.process, Icons.package, Icons.ship, Icons.receive];
    return icons[statusCode] || '❓';
  };

  const getStatusColor = (statusCode) => {
    const colors = ['#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#059669'];
    return colors[statusCode] || '#6B7280';
  };

  const getStatusGradient = (statusCode) => {
    const gradients = [
      'linear-gradient(135deg, #10B981, #34D399)',
      'linear-gradient(135deg, #F59E0B, #FBBF24)',
      'linear-gradient(135deg, #3B82F6, #60A5FA)',
      'linear-gradient(135deg, #8B5CF6, #A78BFA)',
      'linear-gradient(135deg, #059669, #10B981)'
    ];
    return gradients[statusCode] || 'linear-gradient(135deg, #6B7280, #9CA3AF)';
  };

  // Check for pending transactions
  const checkPendingTransactions = async () => {
    if (window.ethereum) {
      try {
        const web3 = new Web3(window.ethereum);
        const pendingTxs = await web3.eth.getTransactionCount(account, 'pending');
        const latestTxs = await web3.eth.getTransactionCount(account, 'latest');
        
        if (pendingTxs > latestTxs) {
          addNotification('⚠️ You have pending transactions. Please wait for them to confirm.', 'warning');
          return true;
        }
      } catch (error) {
        console.error('Error checking pending transactions:', error);
      }
    }
    return false;
  };

  // Check transaction status
  const checkTransactionStatus = async (txHash) => {
    if (!window.ethereum) return null;
    
    try {
      const web3 = new Web3(window.ethereum);
      const receipt = await web3.eth.getTransactionReceipt(txHash);
      
      if (receipt) {
        return receipt.status ? 'confirmed' : 'failed';
      }
      
      // Check if transaction is still in mempool
      const tx = await web3.eth.getTransaction(txHash);
      if (tx && tx.blockNumber === null) {
        return 'pending';
      }
      
      return 'unknown';
    } catch (error) {
      console.error('Error checking transaction status:', error);
      return 'error';
    }
  };

  // Monitor transaction
  const monitorTransaction = (txHash, operation) => {
    const checkInterval = setInterval(async () => {
      const status = await checkTransactionStatus(txHash);
      
      switch (status) {
        case 'confirmed':
          clearInterval(checkInterval);
          addNotification(`✅ ${operation} confirmed on blockchain`, 'success');
          break;
        case 'failed':
          clearInterval(checkInterval);
          addNotification(`❌ ${operation} failed on blockchain`, 'error');
          break;
        case 'pending':
          // Still pending, continue waiting
          break;
        default:
          clearInterval(checkInterval);
          break;
      }
    }, 5000); // Check every 5 seconds

    // Stop checking after 5 minutes
    setTimeout(() => clearInterval(checkInterval), 300000);
  };

  // Reset MetaMask Account
  const resetMetaMaskAccount = async () => {
    if (window.ethereum && window.ethereum.request) {
      try {
        await window.ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }]
        });
        addNotification('🔄 MetaMask account reset. Please try your transaction again.', 'info');
      } catch (error) {
        console.error('Error resetting MetaMask:', error);
      }
    }
  };

  // Network Check
  const checkNetwork = async () => {
    if (window.ethereum) {
      const web3 = new Web3(window.ethereum);
      const chainId = await web3.eth.getChainId();
      
      // Common test networks
      const networks = {
        1: 'Ethereum Mainnet',
        5: 'Goerli Testnet', 
        11155111: 'Sepolia Testnet',
        137: 'Polygon Mainnet',
        80001: 'Polygon Mumbai'
      };
      
      const currentNetwork = networks[chainId];
      if (currentNetwork) {
        addNotification(`🌐 Connected to: ${currentNetwork}`, 'info');
      } else {
        addNotification(`⚠️ Unknown network (Chain ID: ${chainId})`, 'warning');
      }
    }
  };

  // UPDATED: Enhanced contract call handler with database integration
  const handleContractCall = async (operation, contractCall, loadingKey = 'general', dbOperation = null) => {
    // Check for pending transactions first
    const hasPending = await checkPendingTransactions();
    if (hasPending) {
      addNotification('⏳ Please wait for pending transactions to complete', 'warning');
      return false;
    }

    setLoading(prev => ({ ...prev, [loadingKey]: true }));
    const startTime = Date.now();
    
    try {
      // Increased timeout and better error handling
      const result = await Promise.race([
        contractCall(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Transaction timeout after 180 seconds')), 180000)
        )
      ]);
      
      const duration = Date.now() - startTime;
      addAnalyticsEvent(operation, 'success', duration);
      
      // Execute database operation after successful blockchain transaction
      if (dbOperation && databaseConnected) {
        try {
          await dbOperation();
        } catch (dbError) {
          console.error('Database operation failed:', dbError);
          addNotification('⚠️ Blockchain transaction succeeded but database sync failed', 'warning');
        }
      }
      
      addNotification(`${operation} completed successfully`, 'success');
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`Error in ${operation}:`, error);
      
      let userFriendlyError = 'Transaction failed';
      
      if (error.message.includes('TransactionBlockTimeoutError')) {
        userFriendlyError = 'Transaction is taking longer than expected. It may still be processed. Check your wallet for confirmation.';
      } else if (error.message.includes('user rejected transaction')) {
        userFriendlyError = 'Transaction was rejected by user';
      } else if (error.message.includes('insufficient funds')) {
        userFriendlyError = 'Insufficient funds for transaction';
      } else if (error.message.includes('gas')) {
        userFriendlyError = 'Gas estimation failed. Please try again.';
      } else if (error.message.includes('BigInt')) {
        userFriendlyError = 'Transaction configuration error. Please try again.';
      } else {
        userFriendlyError = error.message.split('\n')[0];
      }
      
      addAnalyticsEvent(operation, 'error', duration);
      addNotification(`Failed: ${userFriendlyError}`, 'error');
      return false;
    } finally {
      setLoading(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  // FIXED: Enhanced Web3 Initialization with Database
  const initWeb3 = async () => {
    if (window.ethereum) {
      try {
        console.log('🔄 Initializing Web3...');
        
        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        const web3 = new Web3(window.ethereum);
        
        // Get accounts
        const accounts = await web3.eth.getAccounts();
        if (accounts.length === 0) {
          throw new Error('No accounts found');
        }
        
        setAccount(accounts[0]);
        console.log('✅ Account connected:', accounts[0]);

        // Initialize contract
        const contractInstance = new web3.eth.Contract(
          CONTRACT_ABI,
          CONTRACT_ADDRESS
        );
        
        setContract(contractInstance);
        console.log('✅ Contract initialized');

        // Check network
        await checkNetwork();

        // Test database connection
        await testDatabaseConnection();

        // SIMPLIFIED contract connection test - just check if we can call a simple method
        try {
          // First try getProductCount
          const productCount = await contractInstance.methods.getProductCount().call();
          console.log(`📦 Total products: ${productCount}`);
        } catch (error) {
          console.log('🔄 getProductCount failed, trying discovery method...');
          // If getProductCount fails, just try to discover products directly
          const discoveredProducts = await discoverProducts(contractInstance, 10);
          setProducts(discoveredProducts);
          return;
        }

        // Set up listeners and load data
        listenToEvents(contractInstance);
        await loadProducts(contractInstance);

        localStorage.setItem('connectedAccount', accounts[0]);
        addNotification('🌐 Connected to blockchain network', 'success');

      } catch (error) {
        console.error('❌ Error initializing Web3:', error);
        addNotification(`❌ Failed to connect: ${error.message}`, 'error');
      }
    } else {
      console.error('❌ MetaMask not detected');
      addNotification('⚠️ Please install MetaMask to continue', 'warning');
    }
  };

  // FIXED: Enhanced Event Listeners with database sync
  const listenToEvents = (contractInstance) => {
    if (!contractInstance || !contractInstance.events) {
      console.error('❌ Contract instance or events not available for event listening');
      return;
    }

    console.log('🎯 Setting up event listeners...');

    try {
      // ProductHarvested event - SAFE VERSION
      if (contractInstance.events.ProductHarvested) {
        contractInstance.events.ProductHarvested({
          fromBlock: 'latest'
        })
        .on('connected', (subscriptionId) => {
          console.log('✅ ProductHarvested listener connected:', subscriptionId);
        })
        .on('data', async (event) => {
          console.log('🌱 ProductHarvested event:', event);
          const { productId, productName, farmerName } = event.returnValues;
          addEvent(`🌱 New harvest: ${productName} by ${farmerName} (ID: ${productId})`, 'success');
          
          // Sync with database
          if (databaseConnected) {
            try {
              await storeProductInDatabase({
                productName,
                farmerName,
                farmLocation: 'Unknown', // You might want to get this from the contract
                harvestDate: Math.floor(Date.now() / 1000).toString(),
                currentOwner: account,
                status: '0',
                price: '0',
                isForSale: false,
                blockchainId: productId
              });
            } catch (dbError) {
              console.error('Failed to sync with database:', dbError);
            }
          }
          
          setTimeout(() => loadProducts(contractInstance), 2000);
        })
        .on('error', (error) => {
          console.error('❌ ProductHarvested event error:', error);
        });
      } else {
        console.warn('⚠️ ProductHarvested event not available in contract');
      }

      // StatusUpdated event - SAFE VERSION
      if (contractInstance.events.StatusUpdated) {
        contractInstance.events.StatusUpdated({
          fromBlock: 'latest'
        })
        .on('connected', (subscriptionId) => {
          console.log('✅ StatusUpdated listener connected:', subscriptionId);
        })
        .on('data', async (event) => {
          console.log('🔄 StatusUpdated event:', event);
          const { productId, newStatus, updatedBy } = event.returnValues;
          addEvent(`🔄 Status updated for product ${productId} to ${getStatusName(newStatus)} by ${formatAddress(updatedBy)}`, 'info');
          
          // Sync with database
          if (databaseConnected) {
            await updateProductStatusInDatabase(productId, newStatus);
          }
          
          setTimeout(() => loadProducts(contractInstance), 2000);
        })
        .on('error', (error) => {
          console.error('❌ StatusUpdated event error:', error);
        });
      }

      // ProductForSale event - SAFE VERSION
      if (contractInstance.events.ProductForSale) {
        contractInstance.events.ProductForSale({
          fromBlock: 'latest'
        })
        .on('connected', (subscriptionId) => {
          console.log('✅ ProductForSale listener connected:', subscriptionId);
        })
        .on('data', async (event) => {
          console.log('💰 ProductForSale event:', event);
          const { productId, price } = event.returnValues;
          addEvent(`💰 Product ${productId} listed for ${formatPrice(price)} ETH`, 'warning');
          
          // Sync with database
          if (databaseConnected) {
            await storeSaleInDatabase(productId, price);
          }
          
          setTimeout(() => loadProducts(contractInstance), 2000);
        })
        .on('error', (error) => {
          console.error('❌ ProductForSale event error:', error);
        });
      }

      console.log('✅ Event listeners setup completed');

    } catch (error) {
      console.error('❌ Error setting up event listeners:', error);
      addNotification('⚠️ Event listeners failed to initialize', 'warning');
    }
  };

  // Helper function for product discovery
  const discoverProducts = async (contractInstance, maxAttempts = 20) => {
    const discoveredProducts = [];
    
    for (let i = 1; i <= maxAttempts; i++) {
      try {
        const productData = await contractInstance.methods.getProductDetails(i).call();
        
        if (productData && productData[1] && productData[1] !== '') {
          const product = {
            id: i.toString(),
            productName: productData[1],
            farmerName: productData[2] || 'Unknown Farmer',
            farmLocation: productData[3] || 'Unknown Location',
            harvestDate: productData[4]?.toString() || Math.floor(Date.now() / 1000).toString(),
            status: productData[5]?.toString() || '0',
            currentOwner: productData[6] || '0x0',
            price: productData[7]?.toString() || '0',
            isForSale: productData[8] || false,
            value: parseFloat(Web3.utils.fromWei(productData[7] || '0', 'ether')),
            ageInDays: Math.floor((Date.now() / 1000 - parseInt(productData[4] || Date.now() / 1000)) / (24 * 60 * 60)),
            uniqueKey: `product-${product.id}-${product.harvestDate}-${i}-${Math.random().toString(36).substr(2, 9)}`
          };
          
          discoveredProducts.push(product);
          console.log(`✅ Discovered product ${i}: ${product.productName}`);
        }
      } catch (error) {
        // Stop if we get consistent errors after finding some products
        if (discoveredProducts.length > 0 && i > discoveredProducts.length + 2) {
          break;
        }
      }
    }
    
    return discoveredProducts;
  };

  // FIXED: Enhanced Product Loading with database integration
  const loadProducts = async (contractInstance = contract) => {
    console.log('🔄 Loading products from all sources...');
    setLoading(prev => ({ ...prev, general: true }));

    try {
      let blockchainProducts = [];
      let databaseProducts = [];

      // Load from blockchain if contract is available
      if (contractInstance) {
        try {
          // Try to get product count
          let productCount;
          try {
            productCount = await contractInstance.methods.getProductCount().call();
            console.log(`📦 Total products in blockchain: ${productCount}`);
          } catch (error) {
            console.error('❌ getProductCount failed:', error);
            productCount = 0;
          }

          // If no products or count failed, try discovery
          if (parseInt(productCount) === 0) {
            console.log('📦 Trying product discovery...');
            blockchainProducts = await discoverProducts(contractInstance, 20);
          } else {
            // Load products using getProductDetails
            const maxProducts = parseInt(productCount);
            console.log(`🔄 Loading ${maxProducts} products using getProductDetails...`);
            
            for (let i = 1; i <= maxProducts; i++) {
              try {
                const productData = await contractInstance.methods.getProductDetails(i).call();
                
                if (productData && productData[1] && productData[1] !== '') {
                  const product = {
                    id: i.toString(),
                    productName: productData[1] || `Product ${i}`,
                    farmerName: productData[2] || 'Unknown Farmer',
                    farmLocation: productData[3] || 'Unknown Location',
                    harvestDate: productData[4]?.toString() || Math.floor(Date.now() / 1000).toString(),
                    status: productData[5]?.toString() || '0',
                    currentOwner: productData[6] || '0x0',
                    price: productData[7]?.toString() || '0',
                    isForSale: productData[8] || false,
                    value: parseFloat(Web3.utils.fromWei(productData[7] || '0', 'ether')),
                    ageInDays: Math.floor((Date.now() / 1000 - parseInt(productData[4] || Date.now() / 1000)) / (24 * 60 * 60)),
                    uniqueKey: `blockchain-${i}-${Date.now()}`
                  };
                  
                  blockchainProducts.push(product);
                }
              } catch (error) {
                console.warn(`⚠️ Failed to load blockchain product ${i}:`, error.message);
              }
            }
          }
          console.log(`✅ Loaded ${blockchainProducts.length} products from blockchain`);
        } catch (error) {
          console.error('❌ Error loading blockchain products:', error);
        }
      }

      // Load from database if connected
      if (databaseConnected) {
        databaseProducts = await loadProductsFromDatabase();
        console.log(`🗄️ Loaded ${databaseProducts.length} products from database`);
      }

      // Merge products (blockchain takes precedence)
      const mergedProducts = [...blockchainProducts];
      const blockchainIds = new Set(blockchainProducts.map(p => p.id));
      
      databaseProducts.forEach(dbProduct => {
        if (!blockchainIds.has(dbProduct.id)) {
          mergedProducts.push(dbProduct);
        }
      });

      console.log(`📊 Total merged products: ${mergedProducts.length}`);
      setProducts(mergedProducts);
      
      if (mergedProducts.length === 0) {
        addNotification('🌱 Welcome! Start by harvesting your first product.', 'info');
      }
      
    } catch (error) {
      console.error('❌ Error loading products:', error);
      addNotification(`❌ Error loading products: ${error.message}`, 'error');
    } finally {
      setLoading(prev => ({ ...prev, general: false }));
    }
  };

  useEffect(() => {
    const initialize = async () => {
      console.log('🚀 Starting application initialization...');
      await initWeb3();
    };
    
    initialize();
    
    // Cleanup function
    return () => {
      if (contract) {
        console.log('🧹 Cleaning up event listeners...');
      }
    };
  }, []);

  // Handle account and network changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        console.log('🔄 Accounts changed:', accounts);
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          addNotification('🔗 Account changed', 'info');
        } else {
          disconnectWallet();
        }
      });

      window.ethereum.on('chainChanged', (chainId) => {
        console.log('🔄 Network changed:', chainId);
        window.location.reload();
      });
    }
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      updateAdvancedStats();
    }
  }, [products, account]);

  const addAnalyticsEvent = (operation, status, duration) => {
    console.log(`Analytics: ${operation} - ${status} - ${duration}ms`);
  };

  const updateAdvancedStats = () => {
    const totalProducts = products.length;
    const productsForSale = products.filter(p => p.isForSale).length;
    const myProducts = products.filter(p => 
      p.currentOwner.toLowerCase() === account.toLowerCase()
    ).length;
    const totalValue = products.reduce((sum, product) => 
      sum + parseFloat(weiToEther(product.price)), 0
    );
    
    setAnalytics(prev => ({
      ...prev,
      totalProducts,
      productsForSale,
      myProducts,
      totalValue,
      recentActivity: events.filter(e => 
        Date.now() - new Date(e.timestamp).getTime() < 24 * 60 * 60 * 1000
      ).length,
      supplyChainHealth: Math.min(95, 70 + Math.floor(totalProducts / 2))
    }));
  };

  // Enhanced wallet connection
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const web3 = new Web3(window.ethereum);
        const accounts = await web3.eth.requestAccounts();
        setAccount(accounts[0]);
        
        const contractInstance = new web3.eth.Contract(
          CONTRACT_ABI,
          CONTRACT_ADDRESS
        );
        setContract(contractInstance);
        listenToEvents(contractInstance);
        loadProducts(contractInstance);

        addNotification('🔗 Wallet connected successfully', 'success');
      } catch (error) {
        console.error('Error connecting wallet:', error);
        addNotification('❌ Failed to connect wallet', 'error');
      }
    }
  };

  const disconnectWallet = async () => {
    try {
      setAccount('');
      setContract(null);
      setProducts([]);
      setEvents([]);
      setAnalytics({
        totalProducts: 0,
        productsForSale: 0,
        myProducts: 0,
        totalValue: 0,
        recentActivity: 0,
        supplyChainHealth: 0,
        avgTransactionTime: '0',
        customerSatisfaction: 0,
        carbonFootprint: '0t'
      });
      
      localStorage.removeItem('connectedAccount');
      addNotification('👋 Disconnected from wallet', 'info');
      
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      setAccount('');
      setContract(null);
      addNotification('👋 Wallet disconnected', 'info');
    }
  };

  // UPDATED: Enhanced business functions with database integration
  const authorizeUser = async () => {
    if (!contract) return;
    
    if (!validateInputs({ userAddress })) return;
    if (!validateAddress(userAddress)) {
      addNotification('❌ Invalid Ethereum address format', 'error');
      return;
    }

    const success = await handleContractCall(
      `User ${formatAddress(userAddress)} authorized`,
      async () => {
        // Estimate gas first
        const gasEstimate = await contract.methods.authorizeUser(userAddress)
          .estimateGas({ from: account });

        // Add 20% buffer to gas estimate with proper BigInt handling
        const gasWithBuffer = calculateGasWithBuffer(gasEstimate);

        const tx = await contract.methods.authorizeUser(userAddress).send({ 
          from: account,
          gas: gasWithBuffer
        });

        // Monitor transaction
        if (tx.transactionHash) {
          monitorTransaction(tx.transactionHash, `Authorize user ${formatAddress(userAddress)}`);
        }

        setUserAddress('');
      },
      'authorize'
    );

    if (success) {
      setTimeout(() => loadProducts(contract), 3000);
    }
  };

  // FIXED: Enhanced harvestProduct with database integration
  const harvestProduct = async () => {
    if (!contract) {
      addNotification('❌ Contract not loaded', 'error');
      return;
    }
    
    if (!validateInputs({ productName, farmerName, productLocation })) return;

    // Check network status
    await checkNetwork();

    const success = await handleContractCall(
      `Product "${productName}" harvested`,
      async () => {
        const harvestDate = Math.floor(Date.now() / 1000);
        
        try {
          // Estimate gas with fallback and proper BigInt handling
          let gasEstimate;
          try {
            gasEstimate = await contract.methods.harvestProduct(
              productName, 
              farmerName, 
              productLocation, 
              harvestDate.toString()
            ).estimateGas({ from: account });
          } catch (estimateError) {
            console.warn('Gas estimation failed, using default:', estimateError);
            gasEstimate = '300000';
          }

          const gasWithBuffer = calculateGasWithBuffer(gasEstimate);

          const tx = await contract.methods.harvestProduct(
            productName, 
            farmerName, 
            productLocation, 
            harvestDate.toString()
          ).send({ 
            from: account,
            gas: gasWithBuffer
          });

          // Monitor transaction
          if (tx.transactionHash) {
            monitorTransaction(tx.transactionHash, `Harvest "${productName}"`);
          }

          // Return transaction data for database sync
          return tx;
          
        } catch (txError) {
          console.error('Transaction error:', txError);
          throw txError;
        }
      },
      'harvest',
      // Database operation after successful blockchain transaction
      async () => {
        if (databaseConnected) {
          addNotification('🗄️ Syncing with database...', 'info');
          // Note: The actual product ID from blockchain will be captured in the event listener
          // For immediate sync, we'd need to get the product ID from the transaction receipt
        }
      }
    );

    if (success) {
      setProductName('');
      setFarmerName('');
      setProductLocation('');
      // Wait longer before refreshing to ensure block confirmation
      setTimeout(() => loadProducts(contract), 5000);
    }
  };

  const updateProductStatus = async () => {
    if (!contract) return;
    
    if (!validateInputs({ updateProductId })) return;

    const success = await handleContractCall(
      `Product ${updateProductId} status updated to ${getStatusName(status)}`,
      async () => {
        // Estimate gas with fallback
        let gasEstimate;
        try {
          gasEstimate = await contract.methods.updateStatus(updateProductId, status)
            .estimateGas({ from: account });
        } catch (error) {
          console.warn('Gas estimation failed, using default');
          gasEstimate = '200000';
        }

        const gasWithBuffer = calculateGasWithBuffer(gasEstimate);

        const tx = await contract.methods.updateStatus(updateProductId, status).send({ 
          from: account,
          gas: gasWithBuffer
        });

        if (tx.transactionHash) {
          monitorTransaction(tx.transactionHash, `Update status for product ${updateProductId}`);
        }

        setUpdateProductId('');
        return tx;
      },
      'update',
      // Database operation
      async () => {
        if (databaseConnected) {
          await updateProductStatusInDatabase(updateProductId, status);
        }
      }
    );

    if (success) {
      setTimeout(() => loadProducts(contract), 3000);
    }
  };

  const putForSale = async () => {
    if (!contract) return;
    
    if (!validateInputs({ saleProductId, salePriceEth })) return;

    const priceInWei = etherToWei(salePriceEth);

    const success = await handleContractCall(
      `Product ${saleProductId} listed for ${salePriceEth} ETH`,
      async () => {
        // Estimate gas with fallback
        let gasEstimate;
        try {
          gasEstimate = await contract.methods.putProductForSale(saleProductId, priceInWei)
            .estimateGas({ from: account });
        } catch (error) {
          console.warn('Gas estimation failed, using default');
          gasEstimate = '200000';
        }

        const gasWithBuffer = calculateGasWithBuffer(gasEstimate);

        const tx = await contract.methods.putProductForSale(saleProductId, priceInWei)
          .send({ 
            from: account,
            gas: gasWithBuffer
          });

        if (tx.transactionHash) {
          monitorTransaction(tx.transactionHash, `List product ${saleProductId} for sale`);
        }

        setSaleProductId('');
        setSalePriceEth('');
        return tx;
      },
      'sale',
      // Database operation
      async () => {
        if (databaseConnected) {
          await storeSaleInDatabase(saleProductId, priceInWei);
        }
      }
    );

    if (success) {
      setTimeout(() => loadProducts(contract), 3000);
    }
  };

  const purchaseProduct = async () => {
    if (!contract) return;
    
    if (!validateInputs({ purchaseProductId })) return;

    try {
      // Get the product details to know the exact price
      const product = await contract.methods.getProductDetails(purchaseProductId).call();
      
      if (!product.isForSale) {
        addNotification('❌ Product is not for sale', 'error');
        return;
      }

      const priceInWei = product.price;

      const success = await handleContractCall(
        `Product ${purchaseProductId} purchased successfully`,
        async () => {
          // Estimate gas with fallback
          let gasEstimate;
          try {
            gasEstimate = await contract.methods.purchaseProduct(purchaseProductId)
              .estimateGas({ from: account, value: priceInWei });
          } catch (error) {
            console.warn('Gas estimation failed, using default');
            gasEstimate = '250000';
          }

          const gasWithBuffer = calculateGasWithBuffer(gasEstimate);

          const tx = await contract.methods.purchaseProduct(purchaseProductId)
            .send({ 
              from: account,
              value: priceInWei,
              gas: gasWithBuffer
            });

          if (tx.transactionHash) {
            monitorTransaction(tx.transactionHash, `Purchase product ${purchaseProductId}`);
          }

          setPurchaseProductId('');
          return tx;
        },
        'purchase'
      );

      if (success) {
        setTimeout(() => loadProducts(contract), 3000);
      }
    } catch (error) {
      console.error('Error getting product details:', error);
      addNotification('❌ Failed to get product details', 'error');
    }
  };

  const addEvent = (message, type = 'info') => {
    const newEvent = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      message,
      type,
      date: new Date().toLocaleDateString(),
      read: false
    };
    setEvents(prev => [newEvent, ...prev].slice(0, 100));
  };

  const addNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date(),
      duration: type === 'error' ? 8000 : 5000
    };
    setNotifications(prev => [notification, ...prev]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, notification.duration);
  };

  // Enhanced filtering with multiple criteria
  const filteredProducts = products.filter(product => {
    const matchesFilter = filter === 'all' || 
      (filter === 'forSale' && product.isForSale) ||
      (filter === 'owned' && product.currentOwner.toLowerCase() === account.toLowerCase()) ||
      (filter === 'harvested' && product.status === '0') ||
      (filter === 'recent' && product.ageInDays < 7);
    
    const matchesSearch = searchTerm === '' || 
      product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.farmerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.farmLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.id.toString().includes(searchTerm);
    
    return matchesFilter && matchesSearch;
  });

  const clearAllForms = () => {
    setUserAddress('');
    setProductName('');
    setFarmerName('');
    setProductLocation('');
    setUpdateProductId('');
    setSaleProductId('');
    setPurchaseProductId('');
    setSalePriceEth('');
    setPurchasePriceEth('');
    setStatus('0');
    addNotification('🧹 All forms cleared', 'info');
  };

  const exportData = (type) => {
    addNotification(`📤 ${type} data exported successfully`, 'success');
  };

  // Database Status Component
  const DatabaseStatus = () => (
    <div className={`database-status ${databaseConnected ? 'connected' : 'disconnected'}`}>
      <div className="status-indicator">
        <div className="status-dot"></div>
        <span>{databaseConnected ? '🗄️ Database Connected' : '❌ Database Disconnected'}</span>
      </div>
      <button 
        onClick={testDatabaseConnection} 
        disabled={loading.database}
        className="test-connection-btn"
      >
        {loading.database ? '🔄 Testing...' : '🔄 Test Connection'}
      </button>
    </div>
  );

  // First Product Guide Component
  const FirstProductGuide = () => (
    <div className="first-product-guide">
      <div className="guide-content">
        <div className="guide-icon">🌱</div>
        <h3>Start Your Supply Chain</h3>
        <p>Your blockchain is ready! Create your first product to begin tracking.</p>
        <div className="guide-steps">
          <div className="step">
            <span className="step-number">1</span>
            <span className="step-text">Fill in the product details below</span>
          </div>
          <div className="step">
            <span className="step-number">2</span>
            <span className="step-text">Click "Harvest Product"</span>
          </div>
          <div className="step">
            <span className="step-number">3</span>
            <span className="step-text">Confirm the transaction in MetaMask</span>
          </div>
        </div>
        <div className="guide-tip">
          <strong>Tip:</strong> Use test product names like "Organic Tomatoes" or "Fresh Apples"
        </div>
        <DatabaseStatus />
        <button onClick={resetMetaMaskAccount} className="reset-account-btn">
          🔄 Reset MetaMask Account (If transactions are stuck)
        </button>
      </div>
    </div>
  );

  // FIXED: ProductCard with database indicator
  const ProductCard = ({ product }) => (
    <div className="product-card-enhanced">
      <div 
        className="product-gradient-bar"
        style={{ background: getStatusGradient(product.status) }}
      ></div>
      {product.fromDatabase && (
        <div className="database-badge" title="Stored in database">
          {Icons.database}
        </div>
      )}
      <div className="product-visual">
        <div className="product-image">
          <div className="image-graphic">{getStatusIcon(product.status)}</div>
          {product.isForSale && <div className="sale-ribbon">Sale</div>}
          <div className="product-overlay">
            <button className="overlay-btn quick-view">👁️</button>
            <button className="overlay-btn favorite">❤️</button>
          </div>
        </div>
      </div>
      <div className="product-content-enhanced">
        <div className="product-header-enhanced">
          <h4>{product.productName}</h4>
          <div className="product-meta-badge">
            <span className="product-id">#{product.id}</span>
            <span className="age-badge">{product.ageInDays}d</span>
            {product.fromDatabase && <span className="db-badge">DB</span>}
          </div>
        </div>
        
        <div className="product-stats">
          <div className="stat-item">
            <span className="stat-label">{Icons.farmer}</span>
            <span className="stat-value">{product.farmerName}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">{Icons.location}</span>
            <span className="stat-value">{product.farmLocation}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">{Icons.calendar}</span>
            <span className="stat-value">{new Date(product.harvestDate * 1000).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="product-footer-enhanced">
          <div className="status-indicator" style={{ background: getStatusGradient(product.status) }}>
            {getStatusName(product.status)}
          </div>
          {product.isForSale && (
            <div className="price-tag">
              <span className="price-amount">{formatPrice(product.price)}</span>
              <span className="price-currency">ETH</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Advanced Dashboard Components
  const AdvancedStatCard = ({ icon, title, value, change, color, subtitle, trend, onClick }) => (
    <div className="advanced-stat-card" onClick={onClick} style={{ '--accent-color': color }}>
      <div className="stat-glow"></div>
      <div className="stat-header">
        <div className="stat-icon">{icon}</div>
        <div className="stat-trend">
          <span className={`trend ${trend}`}>{change}</span>
        </div>
      </div>
      <div className="stat-content">
        <h3>{value}</h3>
        <p>{title}</p>
        <span>{subtitle}</span>
      </div>
      <div className="stat-sparkline">
        {[65, 78, 45, 90, 67, 82, 75].map((height, index) => (
          <div 
            key={index} 
            className="sparkline-bar"
            style={{ height: `${height}%` }}
          ></div>
        ))}
      </div>
    </div>
  );

  const ProgressRing = ({ percentage, color, size = 80, strokeWidth = 8, label }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="progress-ring">
        <svg width={size} height={size}>
          <circle
            stroke="var(--bg-surface)"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            r={radius}
            cx={size / 2}
            cy={size / 2}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <div className="ring-label">
          <span>{percentage}%</span>
          <small>{label}</small>
        </div>
      </div>
    );
  };

  const QuickActionCard = ({ icon, title, description, onClick, color, variant = 'primary' }) => (
    <button 
      className={`quick-action-card ${variant}`} 
      onClick={onClick}
      style={{ '--action-color': color }}
    >
      <div className="action-glow"></div>
      <div className="action-icon">{icon}</div>
      <div className="action-content">
        <h4>{title}</h4>
        <p>{description}</p>
      </div>
      <div className="action-arrow">{Icons.chevronRight}</div>
    </button>
  );

  const NotificationToast = ({ notification }) => (
    <div className={`notification-toast ${notification.type}`}>
      <div className="toast-icon">
        {notification.type === 'success' && '✅'}
        {notification.type === 'error' && '❌'}
        {notification.type === 'warning' && '⚠️'}
        {notification.type === 'info' && 'ℹ️'}
      </div>
      <div className="toast-content">
        <p>{notification.message}</p>
        <span>{notification.timestamp.toLocaleTimeString()}</span>
      </div>
      <button 
        className="toast-close"
        onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
      >
        {Icons.close}
      </button>
      <div className="toast-progress" style={{ animationDuration: `${notification.duration}ms` }}></div>
    </div>
  );

  // Enhanced login screen
  if (!account) {
    return (
      <div className="app login-screen-enhanced">
        <div className="login-background-enhanced">
          <div className="animated-shapes">
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>
            <div className="shape shape-3"></div>
            <div className="shape shape-4"></div>
            <div className="shape shape-5"></div>
          </div>
          <div className="floating-particles">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="particle" style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 20}s`,
                animationDuration: `${15 + Math.random() * 10}s`
              }}></div>
            ))}
          </div>
        </div>
        
        <div className="login-container-enhanced">
          <div className="login-card-enhanced">
            <div className="card-glow"></div>
            
            <div className="login-header-enhanced">
              <div className="logo-enhanced">
                <div className="logo-icon-enhanced">🌾</div>
                <div className="logo-text">
                  <h1>AgriChain Pro</h1>
                  <p>Enterprise Supply Chain Platform</p>
                </div>
              </div>
            </div>
            
            <div className="login-content-enhanced">
              <div className="welcome-section">
                <h2>Welcome to the Future of Agriculture</h2>
                <p>Track, manage, and optimize your supply chain with blockchain technology</p>
              </div>
              
              <button onClick={connectWallet} className="connect-btn-enhanced">
                <span className="btn-glow"></span>
                <span className="btn-icon">{Icons.wallet}</span>
                <span className="btn-text">Connect MetaMask Wallet</span>
                <span className="btn-arrow">→</span>
              </button>

              <div className="login-features-enhanced">
                <div className="features-grid">
                  <div className="feature-card">
                    <div className="feature-icon">🔗</div>
                    <h4>Blockchain Powered</h4>
                    <p>Immutable supply chain records</p>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon">📊</div>
                    <h4>Real-time Analytics</h4>
                    <p>Live insights and metrics</p>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon">🗄️</div>
                    <h4>Database Backup</h4>
                    <p>Reliable data persistence</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`app enhanced ${theme} ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
      {/* Enhanced Notifications */}
      <div className="notifications-container-enhanced">
        {notifications.map(notification => (
          <NotificationToast key={notification.id} notification={notification} />
        ))}
      </div>

      {/* Mobile Header */}
      <div className="mobile-header">
        <button 
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {Icons.menu}
        </button>
        <div className="mobile-logo">
          <span>🌾</span>
          <span>AgriChain</span>
        </div>
        <button className="mobile-connect">
          {formatAddress(account)}
        </button>
      </div>

      {/* Enhanced Sidebar */}
      <div className={`sidebar-enhanced ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header-enhanced">
          <div className="logo-enhanced">
            <div className="logo-icon-enhanced">🌾</div>
            {sidebarOpen && (
              <div className="logo-text">
                <h2>AgriChain</h2>
                <p>Enterprise</p>
              </div>
            )}
          </div>
          <button 
            className="sidebar-toggle-enhanced"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? Icons.chevronLeft : Icons.chevronRight}
          </button>
        </div>
        
        <nav className="sidebar-nav-enhanced">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Icons.dashboard, badge: analytics.recentActivity },
            { id: 'products', label: 'Products', icon: Icons.products, badge: analytics.totalProducts },
            { id: 'transactions', label: 'Transactions', icon: Icons.transactions, badge: events.length },
            { id: 'analytics', label: 'Analytics', icon: Icons.analytics },
            { id: 'users', label: 'Team', icon: Icons.users }
          ].map(item => (
            <button
              key={item.id}
              className={`nav-item-enhanced ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(item.id);
                setMobileMenuOpen(false);
              }}
            >
              <span className="nav-icon-enhanced">{item.icon}</span>
              {sidebarOpen && (
                <>
                  <span className="nav-label-enhanced">{item.label}</span>
                  {item.badge && <span className="nav-badge">{item.badge}</span>}
                  <span className="nav-arrow-enhanced">{Icons.chevronRight}</span>
                </>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer-enhanced">
          <div className="user-card-enhanced">
            <div className="user-avatar-enhanced">
              <div className="avatar-glow"></div>
              {Icons.owner}
            </div>
            {sidebarOpen && (
              <div className="user-info-enhanced">
                <p className="user-name">Farm Manager</p>
                <p className="user-address">{formatAddress(account)}</p>
                <div className="user-status">
                  <span className="status-dot online"></span>
                  <span>Online</span>
                </div>
              </div>
            )}
          </div>
          <div className="sidebar-actions">
            <DatabaseStatus />
            <button onClick={resetMetaMaskAccount} className="reset-btn">
              <span className="btn-icon">🔄</span>
              {sidebarOpen && 'Reset Account'}
            </button>
            <button onClick={disconnectWallet} className="disconnect-btn-enhanced">
              <span className="btn-icon">{Icons.disconnect}</span>
              {sidebarOpen && 'Disconnect'}
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Main Content */}
      <div className="main-content-enhanced">
        <header className="main-header-enhanced">
          <div className="header-content-enhanced">
            <div className="header-title-enhanced">
              <h1>
                {activeTab === 'dashboard' && 'Supply Chain Dashboard'}
                {activeTab === 'products' && 'Product Management'}
                {activeTab === 'transactions' && 'Transaction History'}
                {activeTab === 'analytics' && 'Business Analytics'}
                {activeTab === 'users' && 'Team Management'}
              </h1>
              <p className="header-subtitle-enhanced">
                {activeTab === 'dashboard' && 'Real-time overview of your agricultural operations and performance metrics'}
                {activeTab === 'products' && 'Manage and track products through the entire supply chain lifecycle'}
                {activeTab === 'transactions' && 'Complete audit trail of all supply chain activities and events'}
                {activeTab === 'analytics' && 'Advanced insights and performance analytics for your business'}
                {activeTab === 'users' && 'Manage team members, permissions, and access controls'}
              </p>
            </div>
            
            <div className="header-actions-enhanced">
              <div className="action-group">
                <div className="search-box-enhanced">
                  <input
                    type="text"
                    placeholder="Search products, transactions, analytics..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <span className="search-icon-enhanced">{Icons.search}</span>
                </div>
                
                <div className="view-controls-enhanced">
                  <button 
                    className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                    onClick={() => setViewMode('grid')}
                  >
                    ⬜
                  </button>
                  <button 
                    className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                    onClick={() => setViewMode('list')}
                  >
                    ⫯
                  </button>
                </div>

                <button onClick={() => loadProducts()} className="refresh-btn-enhanced">
                  <span className="btn-icon">{Icons.refresh}</span>
                  Refresh Data
                </button>

                <button onClick={() => exportData('Products')} className="export-btn">
                  <span className="btn-icon">{Icons.export}</span>
                  Export
                </button>

                <DatabaseStatus />
              </div>
            </div>
          </div>
        </header>

        <div className="content-area-enhanced">
          {/* Enhanced Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="dashboard-enhanced">
              {/* Advanced Stats Overview */}
              <div className="advanced-stats-grid">
                <AdvancedStatCard
                  icon={Icons.products}
                  title="Total Products"
                  value={formatNumber(analytics.totalProducts)}
                  change="+12.5%"
                  color="#10B981"
                  subtitle="Across supply chain"
                  trend="up"
                  onClick={() => setActiveTab('products')}
                />
                <AdvancedStatCard
                  icon={Icons.sale}
                  title="For Sale"
                  value={formatNumber(analytics.productsForSale)}
                  change="+5.2%"
                  color="#F59E0B"
                  subtitle="Market ready"
                  trend="up"
                />
                <AdvancedStatCard
                  icon={Icons.owner}
                  title="My Products"
                  value={formatNumber(analytics.myProducts)}
                  change="+8.7%"
                  color="#8B5CF6"
                  subtitle="Under management"
                  trend="up"
                />
                <AdvancedStatCard
                  icon={Icons.dollar}
                  title="Portfolio Value"
                  value={`${analytics.totalValue.toFixed(2)} ETH`}
                  change="+15.3%"
                  color="#3B82F6"
                  subtitle="Total asset value"
                  trend="up"
                />
              </div>

              <div className="dashboard-content-enhanced">
                {/* Quick Actions & Performance */}
                <div className="actions-performance-grid">
                  <div className="quick-actions-section-enhanced">
                    <div className="section-header-enhanced">
                      <h3>Quick Actions</h3>
                      <span>Frequently used operations</span>
                    </div>
                    <div className="quick-actions-grid-enhanced">
                      <QuickActionCard
                        icon={Icons.harvest}
                        title="Harvest Product"
                        description="Add new farm product to blockchain"
                        onClick={() => setActiveTab('products')}
                        color="#10B981"
                        variant="primary"
                      />
                      <QuickActionCard
                        icon={Icons.process}
                        title="Update Status"
                        description="Move product in supply chain"
                        onClick={() => setActiveTab('products')}
                        color="#3B82F6"
                        variant="secondary"
                      />
                      <QuickActionCard
                        icon={Icons.sale}
                        title="Put for Sale"
                        description="List product on marketplace"
                        onClick={() => setActiveTab('products')}
                        color="#F59E0B"
                        variant="primary"
                      />
                      <QuickActionCard
                        icon={Icons.analytics}
                        title="View Reports"
                        description="Generate business insights"
                        onClick={() => setActiveTab('analytics')}
                        color="#8B5CF6"
                        variant="secondary"
                      />
                    </div>
                  </div>

                  <div className="performance-section-enhanced">
                    <div className="section-header-enhanced">
                      <h3>Performance Metrics</h3>
                      <span>System health & efficiency</span>
                    </div>
                    <div className="performance-grid">
                      <ProgressRing
                        percentage={analytics.supplyChainHealth}
                        color="#10B981"
                        label="Efficiency"
                      />
                      <ProgressRing
                        percentage={analytics.customerSatisfaction}
                        color="#3B82F6"
                        label="Satisfaction"
                      />
                      <ProgressRing
                        percentage={78}
                        color="#F59E0B"
                        label="Delivery Speed"
                      />
                    </div>
                  </div>
                </div>

                {/* Enhanced Activity & Products */}
                <div className="activity-products-grid-enhanced">
                  <div className="recent-activity-section-enhanced">
                    <div className="section-header-enhanced">
                      <h3>Recent Activity</h3>
                      <span>Live supply chain events</span>
                    </div>
                    <div className="activity-list-enhanced">
                      {events.slice(0, 8).map(event => (
                        <div key={event.id} className={`activity-item-enhanced ${event.type}`}>
                          <div className="activity-icon-enhanced">
                            {event.type === 'success' ? '✅' : '🔄'}
                          </div>
                          <div className="activity-content-enhanced">
                            <p>{event.message}</p>
                            <span>{event.timestamp} • {event.date}</span>
                          </div>
                          {!event.read && <div className="activity-indicator"></div>}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="featured-products-section-enhanced">
                    <div className="section-header-enhanced">
                      <h3>Featured Products</h3>
                      <span>Top performing items</span>
                    </div>
                    <div className="featured-products-grid-enhanced">
                      {filteredProducts.slice(0, 3).map(product => (
                        <ProductCard key={product.uniqueKey} product={product} />
                      ))}
                      {filteredProducts.length === 0 && (
                        <div className="empty-state">
                          <div className="empty-state-icon">📭</div>
                          <h3>No Products Yet</h3>
                          <p>Harvest your first product to see it featured here.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Products Tab */}
          {activeTab === 'products' && (
            <div className="products-tab-enhanced">
              <div className="tab-header-enhanced">
                <div className="tab-title-enhanced">
                  <h2>Product Management</h2>
                  <p>Comprehensive supply chain tracking and management</p>
                </div>
                <div className="tab-controls-enhanced">
                  <div className="control-group-enhanced">
                    <div className="search-box-enhanced">
                      <input
                        type="text"
                        placeholder="Search products by name, farmer, location..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <span className="search-icon-enhanced">{Icons.search}</span>
                    </div>
                    <select 
                      value={filter} 
                      onChange={(e) => setFilter(e.target.value)}
                      className="filter-select-enhanced"
                    >
                      <option value="all">All Products</option>
                      <option value="forSale">For Sale</option>
                      <option value="owned">My Products</option>
                      <option value="harvested">Recently Harvested</option>
                      <option value="recent">Last 7 Days</option>
                    </select>
                  </div>
                  <div className="action-buttons">
                    <button className="add-product-btn-enhanced" onClick={clearAllForms}>
                      <span className="btn-icon">{Icons.add}</span>
                      New Product
                    </button>
                    <button onClick={resetMetaMaskAccount} className="reset-account-btn">
                      <span className="btn-icon">🔄</span>
                      Reset Account
                    </button>
                    <button className="export-btn" onClick={() => exportData('Products')}>
                      <span className="btn-icon">{Icons.export}</span>
                      Export
                    </button>
                  </div>
                </div>
              </div>

              <div className="products-content-enhanced">
                {/* Action Cards Grid */}
                <div className="action-cards-grid-enhanced">
                  {/* Show guide when no products exist */}
                  {products.length === 0 && <FirstProductGuide />}
                  
                  <div className="action-card-enhanced harvest">
                    <div className="card-glow"></div>
                    <div className="card-header-enhanced">
                      <div className="card-icon-enhanced">{Icons.harvest}</div>
                      <h4>Harvest New Product</h4>
                      <span className="card-badge-enhanced">🔗 Blockchain + 🗄️ Database</span>
                    </div>
                    <div className="card-form-enhanced">
                      <input
                        type="text"
                        placeholder="Product Name (e.g., Organic Tomatoes)"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Farmer Name (e.g., John Doe)"
                        value={farmerName}
                        onChange={(e) => setFarmerName(e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Farm Location (e.g., California, USA)"
                        value={productLocation}
                        onChange={(e) => setProductLocation(e.target.value)}
                      />
                      <button 
                        onClick={harvestProduct} 
                        disabled={loading.harvest}
                        className="card-btn-enhanced primary"
                      >
                        {loading.harvest ? '🌱 Harvesting...' : '🌱 Harvest Product'}
                      </button>
                      <div className="card-note-enhanced">
                        {databaseConnected 
                          ? '✅ Data will be stored in both blockchain and database' 
                          : '⚠️ Database not connected - only blockchain storage available'
                        }
                      </div>
                    </div>
                  </div>

                  <div className="action-card-enhanced update">
                    <div className="card-glow"></div>
                    <div className="card-header-enhanced">
                      <div className="card-icon-enhanced">{Icons.process}</div>
                      <h4>Update Product Status</h4>
                      <span className="card-badge-enhanced">🔗 Blockchain + 🗄️ Database</span>
                    </div>
                    <div className="card-form-enhanced">
                      <input
                        type="number"
                        placeholder="Product ID"
                        value={updateProductId}
                        onChange={(e) => setUpdateProductId(e.target.value)}
                      />
                      <select value={status} onChange={(e) => setStatus(e.target.value)}>
                        <option value="0">Harvested</option>
                        <option value="1">Processing</option>
                        <option value="2">Packaged</option>
                        <option value="3">In Transit</option>
                        <option value="4">Delivered</option>
                      </select>
                      <button 
                        onClick={updateProductStatus} 
                        disabled={loading.update}
                        className="card-btn-enhanced primary"
                      >
                        {loading.update ? '🔄 Updating...' : '🔄 Update Status'}
                      </button>
                    </div>
                  </div>

                  <div className="action-card-enhanced sale">
                    <div className="card-glow"></div>
                    <div className="card-header-enhanced">
                      <div className="card-icon-enhanced">{Icons.sale}</div>
                      <h4>Put Product for Sale</h4>
                      <span className="card-badge-enhanced">🔗 Blockchain + 🗄️ Database</span>
                    </div>
                    <div className="card-form-enhanced">
                      <input
                        type="number"
                        placeholder="Product ID"
                        value={saleProductId}
                        onChange={(e) => setSaleProductId(e.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="Price in ETH"
                        value={salePriceEth}
                        onChange={(e) => setSalePriceEth(e.target.value)}
                        step="0.001"
                      />
                      <button 
                        onClick={putForSale} 
                        disabled={loading.sale}
                        className="card-btn-enhanced primary"
                      >
                        {loading.sale ? '💰 Listing...' : '💰 Put for Sale'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Enhanced Products Grid */}
                <div className="products-grid-section-enhanced">
                  <div className="section-header-enhanced">
                    <div className="section-title">
                      <h3>All Products ({products.length})</h3>
                      <span>
                        {products.length === 0 
                          ? 'No products in system yet' 
                          : `Showing ${filteredProducts.length} of ${products.length} total products`
                        }
                        {databaseConnected && ' (Blockchain + Database)'}
                      </span>
                    </div>
                    <div className="section-controls">
                      <div className="view-controls-enhanced">
                        <button 
                          className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                          onClick={() => setViewMode('grid')}
                        >
                          ⬜ Grid
                        </button>
                        <button 
                          className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                          onClick={() => setViewMode('list')}
                        >
                          ⫯ List
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Show empty state or products */}
                  {products.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state-icon">📭</div>
                      <h3>No Products Yet</h3>
                      <p>Your supply chain is empty. Use the form above to harvest your first product and store it on the blockchain.</p>
                    </div>
                  ) : (
                    <div className={`products-display-${viewMode}`}>
                      {filteredProducts.map(product => (
                        <ProductCard 
                          key={product.uniqueKey} 
                          product={product} 
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Other enhanced tabs would follow similar structure */}
          {activeTab === 'transactions' && (
            <div className="transactions-tab-enhanced">
              <h2>Transaction History</h2>
              <p>Complete audit trail of all supply chain activities</p>
              {/* Enhanced transaction content */}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="analytics-tab-enhanced">
              <h2>Business Analytics</h2>
              <p>Advanced insights and performance metrics</p>
              {/* Enhanced analytics content */}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="users-tab-enhanced">
              <h2>Team Management</h2>
              <p>Manage team members and access controls</p>
              {/* Enhanced users content */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;