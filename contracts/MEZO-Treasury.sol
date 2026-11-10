// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract MEZODepositVault is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Address taken from the MEZO interface code supplied for this project.
    // Verify that this is the correct MEZO token precompile on the target network.
    address public constant MEZO_ADDRESS =
        0x7B7c000000000000000000000000000000000001;

    IERC20 public immutable mezo;

    mapping(address => uint256) public depositedBalance;
    uint256 public totalDeposits;

    event MEZODeposited(address indexed user, uint256 amount);
    event MEZOWithdrawn(address indexed user, uint256 amount);

    constructor() {
        mezo = IERC20(MEZO_ADDRESS);
    }

    // READ: return the configured MEZO token/precompile address.
    function getMEZOAddress() external pure returns (address) {
        return MEZO_ADDRESS;
    }

    // READ: user's recorded vault claim.
    function balanceOf(address user) external view returns (uint256) {
        return depositedBalance[user];
    }

    // READ: aggregate user deposits recorded by this vault.
    function getTotalDeposits() external view returns (uint256) {
        return totalDeposits;
    }

    // READ: actual MEZO token balance held at this vault address.
    function getVaultBalance() external view returns (uint256) {
        return mezo.balanceOf(address(this));
    }

    // WRITE: user must first approve this vault directly on the MEZO token.
    function depositMEZO(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than zero");

        uint256 beforeBalance = mezo.balanceOf(address(this));

        mezo.safeTransferFrom(msg.sender, address(this), amount);

        uint256 received = mezo.balanceOf(address(this)) - beforeBalance;
        require(received == amount, "Unexpected MEZO amount received");

        depositedBalance[msg.sender] += received;
        totalDeposits += received;

        emit MEZODeposited(msg.sender, received);
    }

    // WRITE: user can withdraw only their own recorded deposit.
    function withdrawMEZO(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than zero");
        require(
            depositedBalance[msg.sender] >= amount,
            "Insufficient deposited MEZO"
        );

        depositedBalance[msg.sender] -= amount;
        totalDeposits -= amount;

        mezo.safeTransfer(msg.sender, amount);

        emit MEZOWithdrawn(msg.sender, amount);
    }
}
