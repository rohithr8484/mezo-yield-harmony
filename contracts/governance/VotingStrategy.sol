// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title VotingStrategy
 * @dev Computes voting power for a voter on the Mezo governance system.
 *      Aggregates balances from MEZO token, veMEZO locks and delegated power.
 */
interface IVeMezo {
    function balanceOfNFT(uint256 tokenId) external view returns (uint256);
    function ownerOf(uint256 tokenId) external view returns (address);
    function tokensOfOwner(address owner) external view returns (uint256[] memory);
}

contract VotingStrategy is Ownable {
    IERC20 public mezoToken;
    IVeMezo public veMezo;

    uint256 public mezoWeight = 1e18;        // 1x for raw MEZO
    uint256 public veMezoWeight = 3e18;      // 3x for locked MEZO (veNFT)
    uint256 public minimumVotingPower = 1e18;

    mapping(address => address) public delegations; // delegator => delegate
    mapping(address => uint256) public delegatedPower;

    event WeightsUpdated(uint256 mezoWeight, uint256 veMezoWeight);
    event MinimumVotingPowerUpdated(uint256 oldValue, uint256 newValue);
    event DelegateChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate);

    constructor(address _mezoToken, address _veMezo) Ownable(msg.sender) {
        mezoToken = IERC20(_mezoToken);
        veMezo = IVeMezo(_veMezo);
    }

    /**
     * @dev Returns total voting power for a given voter.
     */
    function getVotingPower(address voter) external view returns (uint256) {
        uint256 raw = (mezoToken.balanceOf(voter) * mezoWeight) / 1e18;
        uint256 locked = 0;
        if (address(veMezo) != address(0)) {
            uint256[] memory ids = veMezo.tokensOfOwner(voter);
            for (uint256 i = 0; i < ids.length; i++) {
                locked += veMezo.balanceOfNFT(ids[i]);
            }
            locked = (locked * veMezoWeight) / 1e18;
        }
        return raw + locked + delegatedPower[voter];
    }

    /**
     * @dev Returns whether a voter is eligible to cast votes.
     */
    function isEligible(address voter) external view returns (bool) {
        return this.getVotingPower(voter) >= minimumVotingPower;
    }

    /**
     * @dev Delegate voting power to another address.
     */
    function delegate(address to) external {
        address current = delegations[msg.sender];
        require(to != current, "Already delegated");
        uint256 power = mezoToken.balanceOf(msg.sender);

        if (current != address(0)) {
            delegatedPower[current] -= power;
        }
        delegations[msg.sender] = to;
        if (to != address(0)) {
            delegatedPower[to] += power;
        }

        emit DelegateChanged(msg.sender, current, to);
    }

    function setWeights(uint256 _mezoWeight, uint256 _veMezoWeight) external onlyOwner {
        mezoWeight = _mezoWeight;
        veMezoWeight = _veMezoWeight;
        emit WeightsUpdated(_mezoWeight, _veMezoWeight);
    }

    function setMinimumVotingPower(uint256 _minimum) external onlyOwner {
        emit MinimumVotingPowerUpdated(minimumVotingPower, _minimum);
        minimumVotingPower = _minimum;
    }
}
