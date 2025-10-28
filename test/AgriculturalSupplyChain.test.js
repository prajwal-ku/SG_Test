const AgriculturalSupplyChain = artifacts.require("AgriculturalSupplyChain");

contract("AgriculturalSupplyChain", (accounts) => {
  let supplyChain;
  const [owner, farmer, processor, distributor, retailer] = accounts;

  beforeEach(async () => {
    supplyChain = await AgriculturalSupplyChain.new({ from: owner });
    
    // Authorize the farmer since only authorized users can harvest products
    await supplyChain.authorizeUser(farmer, { from: owner });
  });

  it("should deploy successfully", async () => {
    assert(supplyChain.address !== '');
  });

  it("should have owner authorized by default", async () => {
    const isOwnerAuthorized = await supplyChain.authorizedUsers(owner);
    assert.equal(isOwnerAuthorized, true, "Owner should be authorized by default");
  });

  it("should authorize farmer", async () => {
    const isFarmerAuthorized = await supplyChain.authorizedUsers(farmer);
    assert.equal(isFarmerAuthorized, true, "Farmer should be authorized");
  });

  it("should harvest a product", async () => {
    const harvestTime = Math.floor(Date.now() / 1000);
    
    const result = await supplyChain.harvestProduct(
      "Organic Tomatoes",
      "John Doe",
      "California, USA",
      harvestTime,
      { from: farmer }
    );

    // Check event emission
    assert.equal(result.logs[0].event, 'ProductHarvested');
    assert.equal(result.logs[0].args.productId.toString(), '1');
    assert.equal(result.logs[0].args.productName, 'Organic Tomatoes');
    assert.equal(result.logs[0].args.farmerName, 'John Doe');

    // Check product details using individual getter functions
    const productName = await supplyChain.getProductName(1);
    const farmerName = await supplyChain.getProductFarmer(1);
    const location = await supplyChain.getProductLocation(1);
    const harvestDate = await supplyChain.getProductHarvestDate(1);
    const status = await supplyChain.getProductStatus(1);
    const productOwner = await supplyChain.getProductOwner(1);

    assert.equal(productName, "Organic Tomatoes");
    assert.equal(farmerName, "John Doe");
    assert.equal(location, "California, USA");
    assert.equal(harvestDate.toString(), harvestTime.toString());
    assert.equal(status.toString(), '0'); // Harvested status = 0
    assert.equal(productOwner, farmer);
  });

  it("should update product status", async () => {
    // First harvest a product
    await supplyChain.harvestProduct(
      "Organic Apples",
      "Jane Smith",
      "Washington, USA",
      Math.floor(Date.now() / 1000),
      { from: farmer }
    );

    // Update status to Processed (status 1)
    await supplyChain.updateStatus(1, 1, { from: farmer }); // productId 1, status 1 (Processed)

    const status = await supplyChain.getProductStatus(1);
    assert.equal(status.toString(), '1', "Status should be updated to Processed");
  });

  it("should put product for sale", async () => {
    // Harvest a product first
    await supplyChain.harvestProduct(
      "Carrots",
      "Bob Farmer",
      "Texas, USA",
      Math.floor(Date.now() / 1000),
      { from: farmer }
    );

    const price = web3.utils.toWei('0.1', 'ether');
    
    // Put product for sale
    await supplyChain.putProductForSale(1, price, { from: farmer });

    // Check product sale status
    const isForSale = await supplyChain.getProductForSaleStatus(1);
    const productPrice = await supplyChain.getProductPrice(1);
    const status = await supplyChain.getProductStatus(1);

    assert.equal(isForSale, true, "Product should be for sale");
    assert.equal(productPrice.toString(), price, "Price should be set correctly");
    assert.equal(status.toString(), '3', "Status should be ForSale"); // ForSale status = 3
  });

  it("should purchase a product", async () => {
    // Harvest and put product for sale
    await supplyChain.harvestProduct(
      "Lettuce",
      "Alice Farmer",
      "Arizona, USA",
      Math.floor(Date.now() / 1000),
      { from: farmer }
    );

    const price = web3.utils.toWei('0.05', 'ether');
    await supplyChain.putProductForSale(1, price, { from: farmer });

    // Authorize retailer for purchase (not strictly needed for purchase, but good practice)
    await supplyChain.authorizeUser(retailer, { from: owner });

    // Purchase the product
    const initialOwnerBalance = await web3.eth.getBalance(farmer);
    await supplyChain.purchaseProduct(1, { from: retailer, value: price });

    // Check ownership transfer
    const newOwner = await supplyChain.getProductOwner(1);
    const isForSale = await supplyChain.getProductForSaleStatus(1);
    const status = await supplyChain.getProductStatus(1);

    assert.equal(newOwner, retailer, "Product should be owned by retailer after purchase");
    assert.equal(isForSale, false, "Product should not be for sale after purchase");
    assert.equal(status.toString(), '4', "Status should be Sold"); // Sold status = 4
  });

  it("should not allow unauthorized user to harvest product", async () => {
    try {
      await supplyChain.harvestProduct(
        "Unauthorized Product",
        "Hacker",
        "Nowhere",
        Math.floor(Date.now() / 1000),
        { from: processor } // processor is not authorized
      );
      assert.fail("Should have reverted");
    } catch (error) {
      assert.include(error.message, "Not authorized", "Should revert with authorization error");
    }
  });

  it("should get product count", async () => {
    // Harvest multiple products
    await supplyChain.harvestProduct(
      "Product 1",
      "Farmer 1",
      "Location 1",
      Math.floor(Date.now() / 1000),
      { from: farmer }
    );

    await supplyChain.harvestProduct(
      "Product 2",
      "Farmer 2",
      "Location 2",
      Math.floor(Date.now() / 1000),
      { from: farmer }
    );

    const count = await supplyChain.getProductCount();
    assert.equal(count.toString(), '2', "Should have 2 products");
  });

  it("should get all product IDs", async () => {
    // Harvest some products
    await supplyChain.harvestProduct("Product A", "Farmer A", "Location A", Math.floor(Date.now() / 1000), { from: farmer });
    await supplyChain.harvestProduct("Product B", "Farmer B", "Location B", Math.floor(Date.now() / 1000), { from: farmer });

    const allProductIds = await supplyChain.getAllProductIds();
    assert.equal(allProductIds.length, 2, "Should return 2 product IDs");
    assert.equal(allProductIds[0].toString(), '1', "First product ID should be 1");
    assert.equal(allProductIds[1].toString(), '2', "Second product ID should be 2");
  });
});