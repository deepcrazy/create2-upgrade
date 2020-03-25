const Springboard = artifacts.require('Springboard');
const Wallet = artifacts.require('Wallet');
const WalletV2 = artifacts.require('WalletV2');
const ethers = require('ethers');
const utils = ethers.utils;

const initcode = "0x6394198df1600052600060006004601c335afa80601b57600080fd5b3d600060203e6040516060f3";
function calculateAddress(creatorAddress, salt, initCode) {
   const initCodeHash = utils.keccak256(initCode);
   return utils.getAddress(utils.hexDataSlice(utils.keccak256(
            utils.concat([
            "0xff",
            creatorAddress,
            salt,
            initCodeHash])), 12));
}

// Springboard contract is a factory of wallet contracts
contract("Springboard", accounts => {
   let springboard;
   before(async() => {
      springboard = await Springboard.deployed(); 
   });

   it("Upgrade wallet v1 to v2 should work", async () => {
      let runtimeCode = Wallet.deployedBytecode;
      let tx = await springboard.execute(runtimeCode);
      assert.equal(tx.logs.length, 1, "should have 1 event log");
      assert.equal(tx.logs[0].event, "ContractCreated", "different event");

      // the new wallet contract address is logged in the event log
      let walletAddress =  tx.logs[0].args[0];
      let salt = utils.keccak256(accounts[0]);
      let expectedAddress = calculateAddress(springboard.address, salt, initcode);
      assert.equal(expectedAddress, walletAddress, "address mismatch");

      // check the contract version
      const walletV1 = await Wallet.at(walletAddress);
      let version = await walletV1.version();

      console.log(walletAddress, version);
      assert.equal(version, "1.0", "version should be 1.0");
         
      // Write you code here....
      // 1) Upgrade wallet to V2
      // 2) verify wallet version == 2.0 after upgrade

      const killWalletV1Status = await walletV1.die();   // Sell destruct the Old Wallet (Wallet.sol) Contract
      console.log(killWalletV1Status.receipt.status);
      assert.equal(killWalletV1Status.receipt.status, true, "WalletV1 Contract not self destructed")  // Check the status of self destruct from the transaction happened
      
      runtimeCode = WalletV2.deployedBytecode;
      tx = await springboard.execute(runtimeCode);
      assert.equal(tx.logs.length, 1, "should have 1 event log");
      assert.equal(tx.logs[0].event, "ContractCreated", "different event");

      // the new wallet contract address is logged in the event log
      walletAddress =  tx.logs[0].args[0];
      salt = utils.keccak256(accounts[0]);
      expectedAddress = calculateAddress(springboard.address, salt, initcode);
      assert.equal(expectedAddress, walletAddress, "address mismatch");

      // check the contract version
      const walletV2 = await WalletV2.at(walletAddress);
      let versionV2 = await walletV2.version();

      console.log(walletAddress, versionV2);    // Logging the wallet address and version returned from WalletV2.sol contract
      assert.equal(versionV2, "2.0", "version should be 2.0");    // Verifying the returned version from WalletV2.sol contract
      
   });
});
