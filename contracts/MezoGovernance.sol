// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title MezoGovernance
 * @dev Governor Bravo-style governance for Mezo Improvement Proposals (MIPs)
 *      Uses MEZO tokens for voting power
 */
contract MezoGovernance is Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;

    IERC20 public mezoToken;
    Counters.Counter private _proposalIds;

    // Governance parameters
    uint256 public votingDelay = 1 days;
    uint256 public votingPeriod = 5 days;
    uint256 public timelockDelay = 2 days;
    uint256 public proposalThreshold = 100_000e18; // 100k MEZO to propose
    uint256 public quorumVotes = 1_000_000e18;     // 1M MEZO quorum

    enum ProposalState { Pending, Active, Canceled, Defeated, Succeeded, Queued, Expired, Executed }
    enum VoteType { Yes, No, Abstain }

    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        string category;          // "Protocol Upgrade", "Treasury", "Parameter Change"
        address[] targets;
        uint256[] values;
        bytes[] calldatas;
        uint256 startBlock;
        uint256 endBlock;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool canceled;
        bool executed;
        uint256 eta;              // Timelock execution time
    }

    struct Receipt {
        bool hasVoted;
        VoteType voteType;
        uint256 votes;
    }

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => Receipt)) public receipts;
    mapping(address => uint256) public latestProposalIds;

    // Events
    event ProposalCreated(
        uint256 indexed id,
        address indexed proposer,
        string title,
        string category,
        uint256 startBlock,
        uint256 endBlock
    );
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        VoteType voteType,
        uint256 votes
    );
    event ProposalQueued(uint256 indexed id, uint256 eta);
    event ProposalExecuted(uint256 indexed id);
    event ProposalCanceled(uint256 indexed id);
    event GovernanceParameterUpdated(string param, uint256 oldValue, uint256 newValue);

    constructor(address _mezoToken) Ownable(msg.sender) {
        mezoToken = IERC20(_mezoToken);
    }

    /**
     * @dev Create a new proposal
     */
    function propose(
        string calldata title,
        string calldata description,
        string calldata category,
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata calldatas
    ) external returns (uint256) {
        require(
            mezoToken.balanceOf(msg.sender) >= proposalThreshold,
            "Below proposal threshold"
        );
        require(targets.length == values.length && targets.length == calldatas.length, "Arity mismatch");
        require(targets.length > 0, "Must provide actions");

        _proposalIds.increment();
        uint256 proposalId = _proposalIds.current();

        uint256 startBlock = block.number + (votingDelay / 12); // ~12s blocks
        uint256 endBlock = startBlock + (votingPeriod / 12);

        Proposal storage p = proposals[proposalId];
        p.id = proposalId;
        p.proposer = msg.sender;
        p.title = title;
        p.description = description;
        p.category = category;
        p.targets = targets;
        p.values = values;
        p.calldatas = calldatas;
        p.startBlock = startBlock;
        p.endBlock = endBlock;

        latestProposalIds[msg.sender] = proposalId;

        emit ProposalCreated(proposalId, msg.sender, title, category, startBlock, endBlock);
        return proposalId;
    }

    /**
     * @dev Cast a vote on a proposal
     */
    function castVote(uint256 proposalId, VoteType voteType) external {
        require(state(proposalId) == ProposalState.Active, "Voting is closed");

        Receipt storage receipt = receipts[proposalId][msg.sender];
        require(!receipt.hasVoted, "Already voted");

        uint256 votes = mezoToken.balanceOf(msg.sender);
        require(votes > 0, "No voting power");

        receipt.hasVoted = true;
        receipt.voteType = voteType;
        receipt.votes = votes;

        Proposal storage p = proposals[proposalId];
        if (voteType == VoteType.Yes) {
            p.forVotes += votes;
        } else if (voteType == VoteType.No) {
            p.againstVotes += votes;
        } else {
            p.abstainVotes += votes;
        }

        emit VoteCast(proposalId, msg.sender, voteType, votes);
    }

    /**
     * @dev Queue a succeeded proposal for timelock execution
     */
    function queue(uint256 proposalId) external {
        require(state(proposalId) == ProposalState.Succeeded, "Not succeeded");

        Proposal storage p = proposals[proposalId];
        p.eta = block.timestamp + timelockDelay;

        emit ProposalQueued(proposalId, p.eta);
    }

    /**
     * @dev Execute a queued proposal after timelock
     */
    function execute(uint256 proposalId) external payable nonReentrant {
        require(state(proposalId) == ProposalState.Queued, "Not queued");

        Proposal storage p = proposals[proposalId];
        require(block.timestamp >= p.eta, "Timelock not expired");
        require(block.timestamp <= p.eta + 14 days, "Transaction expired");

        p.executed = true;

        for (uint256 i = 0; i < p.targets.length; i++) {
            (bool success, ) = p.targets[i].call{value: p.values[i]}(p.calldatas[i]);
            require(success, "Transaction execution reverted");
        }

        emit ProposalExecuted(proposalId);
    }

    /**
     * @dev Cancel a proposal (proposer or owner)
     */
    function cancel(uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];
        require(
            msg.sender == p.proposer || msg.sender == owner(),
            "Not authorized"
        );
        require(!p.executed, "Already executed");

        p.canceled = true;
        emit ProposalCanceled(proposalId);
    }

    /**
     * @dev Get the current state of a proposal
     */
    function state(uint256 proposalId) public view returns (ProposalState) {
        Proposal storage p = proposals[proposalId];
        require(p.id > 0, "Invalid proposal");

        if (p.canceled) return ProposalState.Canceled;
        if (p.executed) return ProposalState.Executed;
        if (block.number < p.startBlock) return ProposalState.Pending;
        if (block.number <= p.endBlock) return ProposalState.Active;

        if (p.forVotes <= p.againstVotes || (p.forVotes + p.againstVotes + p.abstainVotes) < quorumVotes) {
            return ProposalState.Defeated;
        }

        if (p.eta == 0) return ProposalState.Succeeded;
        if (block.timestamp >= p.eta + 14 days) return ProposalState.Expired;

        return ProposalState.Queued;
    }

    /**
     * @dev Get voter receipt
     */
    function getReceipt(uint256 proposalId, address voter) external view returns (
        bool hasVoted,
        VoteType voteType,
        uint256 votes
    ) {
        Receipt memory r = receipts[proposalId][voter];
        return (r.hasVoted, r.voteType, r.votes);
    }

    /**
     * @dev Update governance parameters (owner only via governance)
     */
    function setVotingDelay(uint256 _votingDelay) external onlyOwner {
        emit GovernanceParameterUpdated("votingDelay", votingDelay, _votingDelay);
        votingDelay = _votingDelay;
    }

    function setVotingPeriod(uint256 _votingPeriod) external onlyOwner {
        emit GovernanceParameterUpdated("votingPeriod", votingPeriod, _votingPeriod);
        votingPeriod = _votingPeriod;
    }

    function setProposalThreshold(uint256 _threshold) external onlyOwner {
        emit GovernanceParameterUpdated("proposalThreshold", proposalThreshold, _threshold);
        proposalThreshold = _threshold;
    }

    function setQuorumVotes(uint256 _quorum) external onlyOwner {
        emit GovernanceParameterUpdated("quorumVotes", quorumVotes, _quorum);
        quorumVotes = _quorum;
    }

    receive() external payable {}
}
