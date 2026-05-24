// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title GovernanceDataHelper
 * @dev Read-only aggregator that exposes batched proposal data for the
 *      Mezo governance frontend (proposal lists, paginated views, summaries).
 */
interface IMezoGovernance {
    enum ProposalState { Pending, Active, Canceled, Defeated, Succeeded, Queued, Expired, Executed }

    function proposals(uint256 id) external view returns (
        uint256, address, string memory, string memory, string memory,
        uint256, uint256, uint256, uint256, uint256, bool, bool, uint256
    );
    function state(uint256 id) external view returns (ProposalState);
}

contract GovernanceDataHelper {
    IMezoGovernance public immutable governance;

    struct ProposalSummary {
        uint256 id;
        address proposer;
        string title;
        string category;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        IMezoGovernance.ProposalState state;
    }

    constructor(address _governance) {
        governance = IMezoGovernance(_governance);
    }

    /**
     * @dev Returns a paginated list of proposal summaries.
     */
    function getProposalsBatch(uint256[] calldata ids) external view returns (ProposalSummary[] memory list) {
        list = new ProposalSummary[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            list[i] = _summary(ids[i]);
        }
    }

    /**
     * @dev Returns a contiguous range [from..to] (inclusive).
     */
    function getProposalsRange(uint256 from, uint256 to) external view returns (ProposalSummary[] memory list) {
        require(to >= from, "Invalid range");
        uint256 size = to - from + 1;
        list = new ProposalSummary[](size);
        for (uint256 i = 0; i < size; i++) {
            list[i] = _summary(from + i);
        }
    }

    function _summary(uint256 id) internal view returns (ProposalSummary memory s) {
        (
            uint256 pid,
            address proposer,
            string memory title,
            ,
            string memory category,
            ,
            ,
            uint256 forVotes,
            uint256 againstVotes,
            uint256 abstainVotes,
            ,
            ,
        ) = governance.proposals(id);

        s = ProposalSummary({
            id: pid,
            proposer: proposer,
            title: title,
            category: category,
            forVotes: forVotes,
            againstVotes: againstVotes,
            abstainVotes: abstainVotes,
            state: governance.state(id)
        });
    }
}
