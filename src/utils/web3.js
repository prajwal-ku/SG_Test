// src/utils/web3.js
import Web3 from 'web3';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../config';

let web3;
let contract;
let account;

// Initialize Web3 with better error handling
export const initWeb3 = async () => {
  try {
    if (window.ethereum) {
      web3 = new Web3(window.ethereum);
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      const accounts = await web3.eth.getAccounts();
      account = accounts[0];
      
      // Initialize contract with error handling
      contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
      
      console.log('✅ Web3 initialized successfully');
      return { web3, contract, account };
    } else {
      throw new Error('MetaMask not detected');
    }
  } catch (error) {
    console.error('❌ Web3 initialization failed:', error);
    throw error;
  }
};

// Safe contract call with simplified error handling
export const safeContractCall = async (method, ...args) => {
  if (!contract) {
    throw new Error('Contract not initialized');
  }

  try {
    console.log(`📞 Calling contract method: ${method._method.name}`, args);
    const result = await method(...args).call({ from: account });
    console.log(`✅ Contract call successful:`, result);
    return result;
  } catch (error) {
    console.error(`❌ Contract call failed:`, error);
    
    // Simplified error messages
    if (error.message.includes('execution reverted')) {
      throw new Error('Transaction failed: Contract execution reverted');
    } else if (error.message.includes('User denied')) {
      throw new Error('Transaction cancelled by user');
    } else {
      throw new Error(`Contract call failed: ${error.message}`);
    }
  }
};

// Safe contract send (for transactions)
export const safeContractSend = async (method, options, ...args) => {
  if (!contract) {
    throw new Error('Contract not initialized');
  }

  try {
    console.log(`📝 Sending transaction: ${method._method.name}`, args);
    const result = await method(...args).send({
      from: account,
      gas: 500000,
      ...options
    });
    console.log(`✅ Transaction successful:`, result);
    return result;
  } catch (error) {
    console.error(`❌ Transaction failed:`, error);
    
    if (error.message.includes('User denied')) {
      throw new Error('Transaction cancelled by user');
    } else {
      throw new Error(`Transaction failed: ${error.message}`);
    }
  }
};

// Get contract instance
export const getContract = () => {
  if (!contract) {
    throw new Error('Contract not initialized');
  }
  return contract;
};

// Get current account
export const getAccount = () => account;

// Check if Web3 is initialized
export const isWeb3Initialized = () => !!contract;

// Utility functions
export const weiToEther = (wei) => Web3.utils.fromWei(wei.toString(), 'ether');
export const etherToWei = (ether) => Web3.utils.toWei(ether.toString(), 'ether');
export const formatAddress = (address) => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(38)}`;
};

// Enhanced product loading
export const loadAllProducts = async () => {
  if (!contract) {
    throw new Error('Contract not initialized');
  }

  try {
    console.log('🔄 Loading products from blockchain...');
    
    // First, get product count
    const productCount = await safeContractCall(contract.methods.getProductCount);
    const count = parseInt(productCount);
    
    console.log(`📦 Found ${count} products in blockchain`);
    
    if (count === 0) {
      return [];
    }

    const products = [];
    
    // Load each product individually
    for (let i = 1; i <= count; i++) {
      try {
        console.log(`🔄 Loading product ${i}...`);
        
        // Use getProductDetails which returns all product data at once
        const productData = await safeContractCall(contract.methods.getProductDetails, i);
        
        // Format the product data
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
          value: parseFloat(weiToEther(productData[7] || '0')),
          ageInDays: Math.floor((Date.now() / 1000 - parseInt(productData[4] || Date.now() / 1000)) / (24 * 60 * 60))
        };

        // Only add valid products
        if (product.productName && product.productName !== '') {
          products.push(product);
          console.log(`✅ Loaded product: ${product.productName}`);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to load product ${i}:`, error.message);
        // Continue loading other products even if one fails
      }
    }

    console.log(`✅ Successfully loaded ${products.length} products`);
    return products;
  } catch (error) {
    console.error('❌ Error loading products:', error);
    throw error;
  }
};

export default {
  initWeb3,
  getContract,
  getAccount,
  isWeb3Initialized,
  safeContractCall,
  safeContractSend,
  weiToEther,
  etherToWei,
  formatAddress,
  loadAllProducts
};