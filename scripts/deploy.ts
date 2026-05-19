import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log(
    "Account balance:",
    (await deployer.provider.getBalance(deployer.address)).toString()
  );

  // ================================
  // Token Addresses
  // ================================
  const MUSD_ADDRESS = "0xdD468A1DDc392dcdbEf6db6e34E89AA338F9F186";
  const LP_TOKEN_ADDRESS = "0x52e604c44417233b6CcEDDDc0d640A405Caacefb";
  const MATS_TOKEN_ADDRESS = "0x0000000000000000000000000000000000000000";
  const FEE_COLLECTOR = deployer.address;

  // ================================
  // Deploy Governance
  // ================================
  console.log("\nDeploying MezoGovernance...");
  const MezoGovernance = await ethers.getContractFactory("MezoGovernance");
  const governance = await MezoGovernance.deploy(MATS_TOKEN_ADDRESS);
  await governance.waitForDeployment();
  const governanceAddress = await governance.getAddress();
  console.log("MezoGovernance:", governanceAddress);

  // ================================
  // Deploy VotingDataHelper
  // ================================
  console.log("\nDeploying VotingDataHelper...");
  const VotingDataHelper = await ethers.getContractFactory("VotingDataHelper");
  const votingDataHelper = await VotingDataHelper.deploy(governanceAddress);
  await votingDataHelper.waitForDeployment();
  const votingDataHelperAddress = await votingDataHelper.getAddress();
  console.log("VotingDataHelper:", votingDataHelperAddress);

  // ================================
  // Deploy MarketplaceAdmin
  // ================================
  console.log("\nDeploying MarketplaceAdmin...");
  const MarketplaceAdmin = await ethers.getContractFactory("MarketplaceAdmin");
  const marketplaceAdmin = await MarketplaceAdmin.deploy(deployer.address, true);
  await marketplaceAdmin.waitForDeployment();
  const marketplaceAdminAddress = await marketplaceAdmin.getAddress();
  console.log("MarketplaceAdmin:", marketplaceAdminAddress);

  // ================================
  // Deploy GovernanceDataHelper
  // ================================
  console.log("\nDeploying GovernanceDataHelper...");
  const GovernanceDataHelper = await ethers.getContractFactory("GovernanceDataHelper");
  const governanceDataHelper = await GovernanceDataHelper.deploy(governanceAddress);
  await governanceDataHelper.waitForDeployment();
  const governanceDataHelperAddress = await governanceDataHelper.getAddress();
  console.log("GovernanceDataHelper:", governanceDataHelperAddress);

  // ================================
  // Deploy Locks
  // ================================
  console.log("\nDeploying MezoLocks...");
  const MezoLocks = await ethers.getContractFactory("MezoLocks");
  const locks = await MezoLocks.deploy(MATS_TOKEN_ADDRESS, governanceAddress);
  await locks.waitForDeployment();
  const locksAddress = await locks.getAddress();
  console.log("MezoLocks:", locksAddress);

  // ================================
  // Deployment Summary
  // ================================
  console.log("\n========================================");
  console.log("Deployment Summary");
  console.log("========================================");
  console.log("MezoGovernance:", governanceAddress);
  console.log("VotingDataHelper:", votingDataHelperAddress);
  console.log("MarketplaceAdmin:", marketplaceAdminAddress);
  console.log("GovernanceDataHelper:", governanceDataHelperAddress);
  console.log("MezoLocks:", locksAddress);
  console.log("========================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
