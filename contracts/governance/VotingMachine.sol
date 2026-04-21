// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title VotingMachine
 * @dev Stateless vote tabulation engine that records voter intents per proposal,
 *      enforces voting windows, and produces final tallies. Designed to be called
 *      by the main Mezo Governance contract or a cross-chain relay.
 */
interface IVotingPower {
    function getVotingPower(address voter) external view returns (uint256);
    function isEligible(address voter) external view returns (bool);
}

contract VotingMachine is Ownable, ReentrancyGuard {
    enum VoteType { Yes, No, Abstain }

    struct Ballot {
        uint256 startTimestamp;
        uint256 endTimestamp;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool finalized;
        bytes32 resultsHash;
    }

    struct Vote {
        bool hasVoted;
        VoteType voteType;
        uint256 weight;
    }

    IVotingPower public votingPower;
    address public governance;

    mapping(uint256 => Ballot) public ballots;
    mapping(uint256 => mapping(address => Vote)) public votes;

    event BallotOpened(uint256 indexed proposalId, uint256 startTimestamp, uint256 endTimestamp);
    event VoteSubmitted(uint256 indexed proposalId, address indexed voter, VoteType voteType, uint256 weight);
    event BallotFinalized(uint256 indexed proposalId, bytes32 resultsHash);
    event VotingPowerUpdated(address indexed oldStrategy, address indexed newStrategy);
    event GovernanceUpdated(address indexed oldGovernance, address indexed newGovernance);

    modifier onlyGovernance() {
        require(msg.sender == governance, "Only governance");
        _;
    }

    constructor(address _votingPower, address _governance) Ownable(msg.sender) {
        votingPower = IVotingPower(_votingPower);
        governance = _governance;
    }

    /**
     * @dev Open a new ballot for a proposal.
     */
    function openBallot(uint256 proposalId, uint256 startTimestamp, uint256 endTimestamp) external onlyGovernance {
        require(ballots[proposalId].startTimestamp == 0, "Ballot exists");
        require(endTimestamp > startTimestamp, "Bad window");
        ballots[proposalId] = Ballot({
            startTimestamp: startTimestamp,
            endTimestamp: endTimestamp,
            forVotes: 0,
            againstVotes: 0,
            abstainVotes: 0,
            finalized: false,
            resultsHash: bytes32(0)
        });
        emit BallotOpened(proposalId, startTimestamp, endTimestamp);
    }

    /**
     * @dev Submit a vote on an open ballot.
     */
    function submitVote(uint256 proposalId, VoteType voteType) external nonReentrant {
        Ballot storage b = ballots[proposalId];
        require(b.startTimestamp != 0, "Unknown ballot");
        require(block.timestamp >= b.startTimestamp, "Voting not started");
        require(block.timestamp <= b.endTimestamp, "Voting ended");
        require(!b.finalized, "Already finalized");

        Vote storage v = votes[proposalId][msg.sender];
        require(!v.hasVoted, "Already voted");
        require(votingPower.isEligible(msg.sender), "Not eligible");

        uint256 weight = votingPower.getVotingPower(msg.sender);
        require(weight > 0, "No power");

        v.hasVoted = true;
        v.voteType = voteType;
        v.weight = weight;

        if (voteType == VoteType.Yes) b.forVotes += weight;
        else if (voteType == VoteType.No) b.againstVotes += weight;
        else b.abstainVotes += weight;

        emit VoteSubmitted(proposalId, msg.sender, voteType, weight);
    }

    /**
     * @dev Finalize the ballot and emit a hash of the tally for cross-chain proof.
     */
    function finalizeBallot(uint256 proposalId) external onlyGovernance returns (bytes32) {
        Ballot storage b = ballots[proposalId];
        require(b.startTimestamp != 0, "Unknown ballot");
        require(block.timestamp > b.endTimestamp, "Voting still open");
        require(!b.finalized, "Already finalized");

        b.finalized = true;
        b.resultsHash = keccak256(abi.encode(proposalId, b.forVotes, b.againstVotes, b.abstainVotes));
        emit BallotFinalized(proposalId, b.resultsHash);
        return b.resultsHash;
    }

    function setVotingPower(address _votingPower) external onlyOwner {
        emit VotingPowerUpdated(address(votingPower), _votingPower);
        votingPower = IVotingPower(_votingPower);
    }

    function setGovernance(address _governance) external onlyOwner {
        emit GovernanceUpdated(governance, _governance);
        governance = _governance;
    }
}
