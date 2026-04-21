// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title VotingDataHelper
 * @dev Read-only helper that returns batched voting receipts and turnout
 *      analytics for proposals on the Mezo governance system.
 */
interface IGovernanceReceipts {
    enum VoteType { Yes, No, Abstain }

    function getReceipt(uint256 proposalId, address voter) external view returns (bool, VoteType, uint256);
    function proposals(uint256 id) external view returns (
        uint256, address, string memory, string memory, string memory,
        uint256, uint256, uint256, uint256, uint256, bool, bool, uint256
    );
}

contract VotingDataHelper {
    IGovernanceReceipts public immutable governance;

    struct VoterReceipt {
        address voter;
        bool hasVoted;
        IGovernanceReceipts.VoteType voteType;
        uint256 votes;
    }

    struct ProposalTurnout {
        uint256 proposalId;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        uint256 totalVotes;
        uint256 forShareBps;       // basis points (10000 = 100%)
        uint256 againstShareBps;
        uint256 abstainShareBps;
    }

    uint256 public constant BPS = 10000;

    constructor(address _governance) {
        governance = IGovernanceReceipts(_governance);
    }

    /**
     * @dev Returns receipts for a list of voters on a single proposal.
     */
    function getReceiptsBatch(uint256 proposalId, address[] calldata voters)
        external
        view
        returns (VoterReceipt[] memory list)
    {
        list = new VoterReceipt[](voters.length);
        for (uint256 i = 0; i < voters.length; i++) {
            (bool voted, IGovernanceReceipts.VoteType vt, uint256 v) = governance.getReceipt(proposalId, voters[i]);
            list[i] = VoterReceipt({voter: voters[i], hasVoted: voted, voteType: vt, votes: v});
        }
    }

    /**
     * @dev Returns aggregated turnout numbers and share-of-vote in basis points.
     */
    function getTurnout(uint256 proposalId) external view returns (ProposalTurnout memory t) {
        (
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            uint256 forVotes,
            uint256 againstVotes,
            uint256 abstainVotes,
            ,
            ,
        ) = governance.proposals(proposalId);

        uint256 total = forVotes + againstVotes + abstainVotes;
        t = ProposalTurnout({
            proposalId: proposalId,
            forVotes: forVotes,
            againstVotes: againstVotes,
            abstainVotes: abstainVotes,
            totalVotes: total,
            forShareBps: total == 0 ? 0 : (forVotes * BPS) / total,
            againstShareBps: total == 0 ? 0 : (againstVotes * BPS) / total,
            abstainShareBps: total == 0 ? 0 : (abstainVotes * BPS) / total
        });
    }
}
