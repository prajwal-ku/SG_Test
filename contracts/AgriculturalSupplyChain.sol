// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AgriculturalSupplyChain {
    address public owner;
    
    enum ProductStatus { 
        Harvested, 
        Processed, 
        Packed, 
        ForSale, 
        Sold, 
        Shipped, 
        Received, 
        Purchased 
    }
    
    struct Product {
        uint productId;
        string productName;
        string farmerName;
        string farmLocation;
        uint256 harvestDate;
        ProductStatus status;
        address currentOwner;
        uint256 price;
        bool isForSale;
    }
    
    mapping(uint => Product) public products;
    mapping(address => bool) public authorizedUsers;
    uint public productCount;
    
    event ProductHarvested(uint productId, string productName, string farmerName);
    event StatusUpdated(uint productId, ProductStatus newStatus, address updatedBy);
    event ProductForSale(uint productId, uint256 price);
    event OwnershipTransferred(uint productId, address previousOwner, address newOwner);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }
    
    modifier onlyAuthorized() {
        require(authorizedUsers[msg.sender] || msg.sender == owner, "Not authorized");
        _;
    }
    
    modifier productExists(uint _productId) {
        require(_productId > 0 && _productId <= productCount, "Product does not exist");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        productCount = 0;
        authorizedUsers[msg.sender] = true;
    }
    
    function authorizeUser(address _user) public onlyOwner {
        authorizedUsers[_user] = true;
    }
    
    function revokeAuthorization(address _user) public onlyOwner {
        authorizedUsers[_user] = false;
    }
    
    function harvestProduct(
        string memory _productName,
        string memory _farmerName,
        string memory _farmLocation,
        uint256 _harvestDate
    ) public onlyAuthorized returns (uint) {
        productCount++;
        
        products[productCount] = Product({
            productId: productCount,
            productName: _productName,
            farmerName: _farmerName,
            farmLocation: _farmLocation,
            harvestDate: _harvestDate,
            status: ProductStatus.Harvested,
            currentOwner: msg.sender,
            price: 0,
            isForSale: false
        });
        
        emit ProductHarvested(productCount, _productName, _farmerName);
        return productCount;
    }
    
    function updateStatus(uint _productId, ProductStatus _newStatus) 
        public 
        onlyAuthorized 
        productExists(_productId) 
    {
        Product storage product = products[_productId];
        require(msg.sender == product.currentOwner, "Only current owner can update status");
        
        product.status = _newStatus;
        product.currentOwner = msg.sender;
        
        emit StatusUpdated(_productId, _newStatus, msg.sender);
    }
    
    function putProductForSale(uint _productId, uint256 _price) 
        public 
        onlyAuthorized 
        productExists(_productId) 
    {
        Product storage product = products[_productId];
        require(msg.sender == product.currentOwner, "Only owner can put product for sale");
        
        product.price = _price;
        product.isForSale = true;
        product.status = ProductStatus.ForSale;
        
        emit ProductForSale(_productId, _price);
    }
    
    function purchaseProduct(uint _productId) public payable productExists(_productId) {
        Product storage product = products[_productId];
        require(product.isForSale, "Product is not for sale");
        require(msg.value >= product.price, "Insufficient payment");
        require(msg.sender != product.currentOwner, "Cannot purchase your own product");
        
        // Store previous owner before transfer
        address previousOwner = product.currentOwner;
        
        // Transfer payment to current owner
        payable(previousOwner).transfer(product.price);
        
        // Return excess payment
        if (msg.value > product.price) {
            payable(msg.sender).transfer(msg.value - product.price);
        }
        
        // Transfer ownership
        product.currentOwner = msg.sender;
        product.isForSale = false;
        product.status = ProductStatus.Sold;
        
        emit StatusUpdated(_productId, ProductStatus.Sold, msg.sender);
        emit OwnershipTransferred(_productId, previousOwner, msg.sender);
    }
    
    // Simple individual getters that won't cause stack issues
    function getProductName(uint _productId) public view productExists(_productId) returns (string memory) {
        return products[_productId].productName;
    }
    
    function getProductFarmer(uint _productId) public view productExists(_productId) returns (string memory) {
        return products[_productId].farmerName;
    }
    
    function getProductLocation(uint _productId) public view productExists(_productId) returns (string memory) {
        return products[_productId].farmLocation;
    }
    
    function getProductHarvestDate(uint _productId) public view productExists(_productId) returns (uint256) {
        return products[_productId].harvestDate;
    }
    
    function getProductStatus(uint _productId) public view productExists(_productId) returns (ProductStatus) {
        return products[_productId].status;
    }
    
    function getProductOwner(uint _productId) public view productExists(_productId) returns (address) {
        return products[_productId].currentOwner;
    }
    
    function getProductPrice(uint _productId) public view productExists(_productId) returns (uint256) {
        return products[_productId].price;
    }
    
    function getProductForSaleStatus(uint _productId) public view productExists(_productId) returns (bool) {
        return products[_productId].isForSale;
    }
    
    function getProductCount() public view returns (uint) {
        return productCount;
    }
    
    function getAllProductIds() public view returns (uint[] memory) {
        uint[] memory allProducts = new uint[](productCount);
        
        for (uint i = 0; i < productCount; i++) {
            allProducts[i] = i + 1;
        }
        
        return allProducts;
    }
    
    function getProductsByOwner(address _owner) public view returns (uint[] memory) {
        uint count = 0;
        
        // First, count how many products this owner has
        for (uint i = 1; i <= productCount; i++) {
            if (products[i].currentOwner == _owner) {
                count++;
            }
        }
        
        // Then, create array and populate it
        uint[] memory ownedProducts = new uint[](count);
        uint index = 0;
        
        for (uint i = 1; i <= productCount; i++) {
            if (products[i].currentOwner == _owner) {
                ownedProducts[index] = i;
                index++;
            }
        }
        
        return ownedProducts;
    }
    
    // Additional function to get product details in a single call (if needed)
    function getProductDetails(uint _productId) public view productExists(_productId) returns (
        uint productId,
        string memory productName,
        string memory farmerName,
        string memory farmLocation,
        uint256 harvestDate,
        ProductStatus status,
        address currentOwner,
        uint256 price,
        bool isForSale
    ) {
        Product storage product = products[_productId];
        return (
            product.productId,
            product.productName,
            product.farmerName,
            product.farmLocation,
            product.harvestDate,
            product.status,
            product.currentOwner,
            product.price,
            product.isForSale
        );
    }
}