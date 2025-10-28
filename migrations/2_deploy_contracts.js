const AgriculturalSupplyChain = artifacts.require("AgriculturalSupplyChain");

module.exports = function(deployer) {
  deployer.deploy(AgriculturalSupplyChain);
};