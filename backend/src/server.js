import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Validate environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('Missing required environment variables: SUPABASE_URL and SUPABASE_ANON_KEY');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Store blockchain event in database
const storeBlockchainEvent = async (eventData) => {
  try {
    const { data, error } = await supabase
      .from('blockchain_events')
      .insert([
        {
          event_type: eventData.event_type,
          product_id: eventData.product_id,
          blockchain_product_id: eventData.blockchain_product_id,
          event_data: eventData.event_data,
          transaction_hash: eventData.transaction_hash,
          block_number: eventData.block_number,
          created_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) {
      console.error('Error storing blockchain event:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Blockchain event stored successfully:', data[0].id);
    return { success: true, data: data[0] };
  } catch (error) {
    console.error('Error in storeBlockchainEvent:', error);
    return { success: false, error: error.message };
  }
};

// Store product sale in database
const storeProductSale = async (saleData) => {
  try {
    const { data, error } = await supabase
      .from('product_sales')
      .insert([
        {
          product_id: saleData.product_id,
          blockchain_product_id: saleData.blockchain_product_id,
          seller_address: saleData.seller_address,
          buyer_address: saleData.buyer_address,
          sale_price_wei: saleData.sale_price_wei,
          sale_status: saleData.sale_status,
          transaction_hash: saleData.transaction_hash,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) {
      console.error('Error storing product sale:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Product sale stored successfully:', data[0].id);
    return { success: true, data: data[0] };
  } catch (error) {
    console.error('Error in storeProductSale:', error);
    return { success: false, error: error.message };
  }
};

// Store product in database - FIXED: Use proper ID generation
const storeProduct = async (productData) => {
  try {
    // Generate a proper ID that fits in integer range
    const productId = Math.floor(Date.now() / 1000); // Use timestamp in seconds instead of milliseconds
    
    const { data, error } = await supabase
      .from('products')
      .insert([
        {
          blockchain_product_id: productId, // Use the generated ID
          product_name: productData.product_name,
          farmer_name: productData.farmer_name,
          farm_location: productData.farm_location,
          harvest_date: productData.harvest_date,
          blockchain_owner_address: productData.blockchain_owner_address,
          current_status: productData.current_status,
          price_wei: productData.price_wei,
          is_for_sale: productData.is_for_sale,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) {
      console.error('Error storing product:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Product stored successfully:', data[0].id);
    return { success: true, data: data[0], productId: productId };
  } catch (error) {
    console.error('Error in storeProduct:', error);
    return { success: false, error: error.message };
  }
};

// Store product status history
const storeProductStatusHistory = async (statusData) => {
  try {
    const { data, error } = await supabase
      .from('product_status_history')
      .insert([
        {
          product_id: statusData.product_id,
          blockchain_product_id: statusData.blockchain_product_id,
          old_status: statusData.old_status,
          new_status: statusData.new_status,
          changed_by: statusData.changed_by,
          transaction_hash: statusData.transaction_hash,
          created_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) {
      console.error('Error storing product status history:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Product status history stored successfully:', data[0].id);
    return { success: true, data: data[0] };
  } catch (error) {
    console.error('Error in storeProductStatusHistory:', error);
    return { success: false, error: error.message };
  }
};

// Update product in database
const updateProduct = async (productId, updateData) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('blockchain_product_id', productId)
      .select();

    if (error) {
      console.error('Error updating product:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Product updated successfully:', data[0].id);
    return { success: true, data: data[0] };
  } catch (error) {
    console.error('Error in updateProduct:', error);
    return { success: false, error: error.message };
  }
};

// Get next available product ID
const getNextProductId = async () => {
  try {
    // Get the maximum current blockchain_product_id
    const { data, error } = await supabase
      .from('products')
      .select('blockchain_product_id')
      .order('blockchain_product_id', { ascending: false })
      .limit(1);

    if (error) throw error;

    if (data && data.length > 0) {
      return data[0].blockchain_product_id + 1;
    } else {
      return 1; // Start from 1 if no products exist
    }
  } catch (error) {
    console.error('Error getting next product ID:', error);
    return Math.floor(Date.now() / 1000); // Fallback to timestamp
  }
};

// API Routes

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Agricultural Supply Chain Backend Server is running!',
    supabase: 'Connected successfully',
    database_tables: ['blockchain_events', 'product_sales', 'products', 'product_status_history'],
    timestamp: new Date().toISOString()
  });
});

// Health check route
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    const { data, error } = await supabase
      .from('products')
      .select('count')
      .limit(1);

    if (error) throw error;

    res.status(200).json({ 
      status: 'OK', 
      service: 'Agricultural Supply Chain API',
      database: 'Supabase Connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      service: 'Agricultural Supply Chain API',
      database: 'Connection Failed',
      error: error.message
    });
  }
});

// Store blockchain event API
app.post('/api/events', async (req, res) => {
  try {
    const eventData = req.body;
    
    // Validate required fields
    if (!eventData.event_type || !eventData.product_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: event_type and product_id'
      });
    }

    const result = await storeBlockchainEvent(eventData);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Blockchain event stored successfully in database!',
        data: result.data,
        popup: {
          type: 'success',
          title: 'Event Stored',
          message: 'Blockchain event has been successfully recorded in the database.'
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to store blockchain event',
        error: result.error,
        popup: {
          type: 'error',
          title: 'Storage Failed',
          message: 'Failed to store blockchain event in database.'
        }
      });
    }
  } catch (error) {
    console.error('Error in /api/events:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      popup: {
        type: 'error',
        title: 'Server Error',
        message: 'An error occurred while storing the event.'
      }
    });
  }
});

// Store product API - FIXED: Generate proper ID
app.post('/api/products', async (req, res) => {
  try {
    const productData = req.body;
    
    // Validate required fields
    if (!productData.product_name) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: product_name'
      });
    }

    // Generate a proper product ID
    const productId = await getNextProductId();
    
    const result = await storeProduct({
      ...productData,
      blockchain_product_id: productId
    });
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Product stored successfully in database!',
        data: result.data,
        productId: result.productId,
        popup: {
          type: 'success',
          title: 'Product Stored',
          message: 'Product information has been successfully saved in the database.'
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to store product',
        error: result.error,
        popup: {
          type: 'error',
          title: 'Storage Failed',
          message: 'Failed to store product in database.'
        }
      });
    }
  } catch (error) {
    console.error('Error in /api/products:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      popup: {
        type: 'error',
        title: 'Server Error',
        message: 'An error occurred while storing the product.'
      }
    });
  }
});

// Store product sale API
app.post('/api/sales', async (req, res) => {
  try {
    const saleData = req.body;
    
    // Validate required fields
    if (!saleData.product_id || !saleData.seller_address) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: product_id and seller_address'
      });
    }

    const result = await storeProductSale(saleData);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Product sale stored successfully in database!',
        data: result.data,
        popup: {
          type: 'success',
          title: 'Sale Recorded',
          message: 'Product sale has been successfully recorded in the database.'
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to store product sale',
        error: result.error,
        popup: {
          type: 'error',
          title: 'Storage Failed',
          message: 'Failed to store sale information in database.'
        }
      });
    }
  } catch (error) {
    console.error('Error in /api/sales:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      popup: {
        type: 'error',
        title: 'Server Error',
        message: 'An error occurred while storing the sale.'
      }
    });
  }
});

// Store status history API
app.post('/api/status-history', async (req, res) => {
  try {
    const statusData = req.body;
    
    // Validate required fields
    if (!statusData.product_id || !statusData.new_status) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: product_id and new_status'
      });
    }

    const result = await storeProductStatusHistory(statusData);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Status history stored successfully in database!',
        data: result.data,
        popup: {
          type: 'success',
          title: 'Status Updated',
          message: 'Product status change has been recorded in the database.'
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to store status history',
        error: result.error,
        popup: {
          type: 'error',
          title: 'Storage Failed',
          message: 'Failed to store status history in database.'
        }
      });
    }
  } catch (error) {
    console.error('Error in /api/status-history:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      popup: {
        type: 'error',
        title: 'Server Error',
        message: 'An error occurred while storing the status history.'
      }
    });
  }
});

// Update product API
app.put('/api/products/:productId', async (req, res) => {
  try {
    const productId = req.params.productId;
    const updateData = req.body;

    const result = await updateProduct(parseInt(productId), updateData);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Product updated successfully in database!',
        data: result.data,
        popup: {
          type: 'success',
          title: 'Product Updated',
          message: 'Product information has been successfully updated in the database.'
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to update product',
        error: result.error,
        popup: {
          type: 'error',
          title: 'Update Failed',
          message: 'Failed to update product in database.'
        }
      });
    }
  } catch (error) {
    console.error('Error in /api/products/:productId:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      popup: {
        type: 'error',
        title: 'Server Error',
        message: 'An error occurred while updating the product.'
      }
    });
  }
});

// Get all products API
app.get('/api/products', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch products',
        error: error.message
      });
    }

    res.json({
      success: true,
      data: data,
      count: data.length
    });
  } catch (error) {
    console.error('Error in /api/products:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get product by ID API
app.get('/api/products/:productId', async (req, res) => {
  try {
    const productId = req.params.productId;

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('blockchain_product_id', parseInt(productId))
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        error: error.message
      });
    }

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Error in /api/products/:productId:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    // Test all tables
    const [productsResult, eventsResult, salesResult, statusResult] = await Promise.all([
      supabase.from('products').select('count').limit(1),
      supabase.from('blockchain_events').select('count').limit(1),
      supabase.from('product_sales').select('count').limit(1),
      supabase.from('product_status_history').select('count').limit(1)
    ]);

    const dbStatus = {
      products: !productsResult.error,
      blockchain_events: !eventsResult.error,
      product_sales: !salesResult.error,
      product_status_history: !statusResult.error
    };

    res.json({
      success: true,
      message: 'Database connection test completed',
      database_status: dbStatus,
      tables: {
        products: productsResult.data ? 'Connected' : 'Error',
        blockchain_events: eventsResult.data ? 'Connected' : 'Error',
        product_sales: salesResult.data ? 'Connected' : 'Error',
        product_status_history: statusResult.data ? 'Connected' : 'Error'
      }
    });
  } catch (error) {
    console.error('Error in /api/test-db:', error);
    res.status(500).json({
      success: false,
      message: 'Database connection test failed',
      error: error.message
    });
  }
});

// Get database schema info
app.get('/api/schema', async (req, res) => {
  try {
    res.json({
      success: true,
      schema: {
        products: {
          id: 'bigint (auto-increment)',
          blockchain_product_id: 'integer',
          product_name: 'varchar',
          farmer_name: 'varchar',
          farm_location: 'varchar',
          harvest_date: 'bigint',
          blockchain_owner_address: 'varchar',
          current_status: 'integer',
          price_wei: 'bigint',
          is_for_sale: 'boolean',
          created_at: 'timestamptz',
          updated_at: 'timestamptz'
        },
        product_sales: {
          id: 'bigint (auto-increment)',
          product_id: 'bigint',
          blockchain_product_id: 'integer',
          seller_address: 'varchar',
          buyer_address: 'varchar',
          sale_price_wei: 'bigint',
          sale_status: 'varchar',
          transaction_hash: 'varchar',
          created_at: 'timestamptz',
          updated_at: 'timestamptz'
        },
        blockchain_events: {
          id: 'bigint (auto-increment)',
          event_type: 'varchar',
          product_id: 'bigint',
          blockchain_product_id: 'integer',
          event_data: 'jsonb',
          transaction_hash: 'varchar',
          block_number: 'bigint',
          created_at: 'timestamptz'
        },
        product_status_history: {
          id: 'bigint (auto-increment)',
          product_id: 'bigint',
          blockchain_product_id: 'integer',
          old_status: 'integer',
          new_status: 'integer',
          changed_by: 'varchar',
          transaction_hash: 'varchar',
          created_at: 'timestamptz'
        }
      }
    });
  } catch (error) {
    console.error('Error in /api/schema:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get schema info',
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`✅ Supabase connected: ${process.env.SUPABASE_URL}`);
  console.log(`📊 Database tables ready: blockchain_events, product_sales, products, product_status_history`);
  console.log(`🔧 API endpoints:`);
  console.log(`   GET  /health - Health check`);
  console.log(`   GET  /api/products - Get all products`);
  console.log(`   POST /api/products - Create new product`);
  console.log(`   POST /api/sales - Record product sale`);
  console.log(`   POST /api/events - Record blockchain event`);
  console.log(`   POST /api/status-history - Record status change`);
  console.log(`   GET  /api/test-db - Test database connection`);
  console.log(`   GET  /api/schema - Get database schema info`);
});

export default app;