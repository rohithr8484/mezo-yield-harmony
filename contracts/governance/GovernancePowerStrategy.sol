// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title GovernancePowerStrategy
 * @dev Calculates governance power (proposal + voting) used by the Mezo governance system.
 *      Combines spot balances, locked balances and a time-decay factor for veNFTs.
 */
interface IPowerSource {
    function balanceOf(address account) external view returns (uint256);
}

contract GovernancePowerStrategy is Ownable {
    enum PowerType { Voting, Proposition }

    IERC20 public mezoToken;
    IPowerSource public veMezoPower;

    // Boost multipliers in basis points (10000 = 1x)
    uint256 public votingBoostBps = 12000;       // 1.2x
    uint256 public propositionBoostBps = 15000;  // 1.5x
    uint256 public constant BPS = 10000;

    // Snapshot block storage (snapshot id => account => power)
    mapping(uint256 => mapping(address => uint256)) public snapshots;
    mapping(uint256 => uint256) public snapshotTotals;

    event SnapshotTaken(uint256 indexed snapshotId, address indexed account, uint256 power);
    event BoostUpdated(uint256 votingBoostBps, uint256 propositionBoostBps);

    constructor(address _mezoToken, address _veMezoPower) Ownable(msg.sender) {
        mezoToken = IERC20(_mezoToken);
        veMezoPower = IPowerSource(_veMezoPower);
    }

    /**
     * @dev Get the current governance power for an account by type.
     */
    function getPowerCurrent(address user, PowerType pType) external view returns (uint256) {
        uint256 base = mezoToken.balanceOf(user);
        uint256 locked = address(veMezoPower) != address(0) ? veMezoPower.balanceOf(user) : 0;
        uint256 boost = pType == PowerType.Voting ? votingBoostBps : propositionBoostBps;
        return base + (locked * boost) / BPS;
    }

    /**
     * @dev Get the historical governance power for a snapshot id.
     */
    function getPowerAtSnapshot(address user, uint256 snapshotId) external view returns (uint256) {
        return snapshots[snapshotId][user];
    }

    /**
     * @dev Take a snapshot of an account's current power.
     */
    function snapshot(uint256 snapshotId, address user, PowerType pType) external onlyOwner returns (uint256) {
        uint256 power = this.getPowerCurrent(user, pType);
        snapshots[snapshotId][user] = power;
        snapshotTotals[snapshotId] += power;
        emit SnapshotTaken(snapshotId, user, power);
        return power;
    }

    function setBoosts(uint256 _votingBoostBps, uint256 _propositionBoostBps) external onlyOwner {
        require(_votingBoostBps >= BPS && _propositionBoostBps >= BPS, "Boost must be >= 1x");
        votingBoostBps = _votingBoostBps;
        propositionBoostBps = _propositionBoostBps;
        emit BoostUpdated(_votingBoostBps, _propositionBoostBps);
    }
}
