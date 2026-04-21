// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title Governance
 * @dev Top-level governance orchestrator that combines a VotingStrategy,
 *      GovernancePowerStrategy and VotingMachine to manage the full proposal
 *      lifecycle (create -> vote -> queue -> execute) for the Mezo ecosystem.
 */
interface IVotingStrategy {
    function getVotingPower(address voter) external view returns (uint256);
}

interface IPowerStrategy {
    enum PowerType { Voting, Proposition }
    function getPowerCurrent(address user, PowerType pType) external view returns (uint256);
}

interface IVotingMachine {
    enum VoteType { Yes, No, Abstain }
    function openBallot(uint256 proposalId, uint256 startTimestamp, uint256 endTimestamp) external;
    function finalizeBallot(uint256 proposalId) external returns (bytes32);
    function ballots(uint256 id) external view returns (
        uint256, uint256, uint256, uint256, uint256, bool, bytes32
    );
}

contract Governance is Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;

    enum ProposalState { Pending, Active, Canceled, Defeated, Succeeded, Queued, Executed, Expired }

    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        string category;
        uint256 startTimestamp;
        uint256 endTimestamp;
        uint256 eta;
        bool canceled;
        bool executed;
        bytes32 resultsHash;
        address[] targets;
        uint256[] values;
        bytes[] calldatas;
    }

    IVotingStrategy public votingStrategy;
    IPowerStrategy public powerStrategy;
    IVotingMachine public votingMachine;

    Counters.Counter private _proposalIds;
    mapping(uint256 => Proposal) public proposals;

    uint256 public votingDelay = 1 days;
    uint256 public votingPeriod = 5 days;
    uint256 public timelockDelay = 2 days;
    uint256 public gracePeriod = 14 days;
    uint256 public proposalThreshold = 100_000e18;
    uint256 public quorumVotes = 1_000_000e18;

    event ProposalCreated(uint256 indexed id, address indexed proposer, string title, string category);
    event ProposalQueued(uint256 indexed id, uint256 eta);
    event ProposalExecuted(uint256 indexed id);
    event ProposalCanceled(uint256 indexed id);
    event StrategiesUpdated(address votingStrategy, address powerStrategy, address votingMachine);

    constructor(address _votingStrategy, address _powerStrategy, address _votingMachine) Ownable(msg.sender) {
        votingStrategy = IVotingStrategy(_votingStrategy);
        powerStrategy = IPowerStrategy(_powerStrategy);
        votingMachine = IVotingMachine(_votingMachine);
    }

    /**
     * @dev Create a new proposal. Requires caller to meet propositionPower threshold.
     */
    function propose(
        string calldata title,
        string calldata description,
        string calldata category,
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata calldatas
    ) external returns (uint256) {
        require(targets.length > 0, "No actions");
        require(targets.length == values.length && targets.length == calldatas.length, "Arity mismatch");
        require(
            powerStrategy.getPowerCurrent(msg.sender, IPowerStrategy.PowerType.Proposition) >= proposalThreshold,
            "Below threshold"
        );

        _proposalIds.increment();
        uint256 id = _proposalIds.current();

        uint256 startTs = block.timestamp + votingDelay;
        uint256 endTs = startTs + votingPeriod;

        Proposal storage p = proposals[id];
        p.id = id;
        p.proposer = msg.sender;
        p.title = title;
        p.description = description;
        p.category = category;
        p.startTimestamp = startTs;
        p.endTimestamp = endTs;
        p.targets = targets;
        p.values = values;
        p.calldatas = calldatas;

        votingMachine.openBallot(id, startTs, endTs);
        emit ProposalCreated(id, msg.sender, title, category);
        return id;
    }

    /**
     * @dev Queue a succeeded proposal for timelock execution.
     */
    function queue(uint256 proposalId) external {
        require(state(proposalId) == ProposalState.Succeeded, "Not succeeded");
        Proposal storage p = proposals[proposalId];
        bytes32 resultsHash = votingMachine.finalizeBallot(proposalId);
        p.resultsHash = resultsHash;
        p.eta = block.timestamp + timelockDelay;
        emit ProposalQueued(proposalId, p.eta);
    }

    /**
     * @dev Execute a queued proposal after the timelock has expired.
     */
    function execute(uint256 proposalId) external payable nonReentrant {
        require(state(proposalId) == ProposalState.Queued, "Not queued");
        Proposal storage p = proposals[proposalId];
        require(block.timestamp >= p.eta, "Timelock not expired");
        require(block.timestamp <= p.eta + gracePeriod, "Expired");

        p.executed = true;
        for (uint256 i = 0; i < p.targets.length; i++) {
            (bool ok, ) = p.targets[i].call{value: p.values[i]}(p.calldatas[i]);
            require(ok, "Action reverted");
        }
        emit ProposalExecuted(proposalId);
    }

    function cancel(uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];
        require(msg.sender == p.proposer || msg.sender == owner(), "Not authorized");
        require(!p.executed, "Already executed");
        p.canceled = true;
        emit ProposalCanceled(proposalId);
    }

    /**
     * @dev Compute the current state of a proposal based on its ballot tally.
     */
    function state(uint256 proposalId) public view returns (ProposalState) {
        Proposal storage p = proposals[proposalId];
        require(p.id > 0, "Invalid proposal");
        if (p.canceled) return ProposalState.Canceled;
        if (p.executed) return ProposalState.Executed;
        if (block.timestamp < p.startTimestamp) return ProposalState.Pending;
        if (block.timestamp <= p.endTimestamp) return ProposalState.Active;

        ( , , uint256 forVotes, uint256 againstVotes, uint256 abstainVotes, , ) = votingMachine.ballots(proposalId);
        uint256 total = forVotes + againstVotes + abstainVotes;
        if (total < quorumVotes || forVotes <= againstVotes) return ProposalState.Defeated;
        if (p.eta == 0) return ProposalState.Succeeded;
        if (block.timestamp >= p.eta + gracePeriod) return ProposalState.Expired;
        return ProposalState.Queued;
    }

    function setStrategies(address _votingStrategy, address _powerStrategy, address _votingMachine) external onlyOwner {
        votingStrategy = IVotingStrategy(_votingStrategy);
        powerStrategy = IPowerStrategy(_powerStrategy);
        votingMachine = IVotingMachine(_votingMachine);
        emit StrategiesUpdated(_votingStrategy, _powerStrategy, _votingMachine);
    }

    function setProposalThreshold(uint256 _threshold) external onlyOwner { proposalThreshold = _threshold; }
    function setQuorumVotes(uint256 _quorum) external onlyOwner { quorumVotes = _quorum; }
    function setVotingDelay(uint256 _delay) external onlyOwner { votingDelay = _delay; }
    function setVotingPeriod(uint256 _period) external onlyOwner { votingPeriod = _period; }
    function setTimelockDelay(uint256 _delay) external onlyOwner { timelockDelay = _delay; }

    receive() external payable {}
}
