// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ProposalRecords {
    struct Record {
        string ipfsCid;
        uint256 yesVotes;
        uint256 noVotes;
        uint256 abstainVotes;
        bool finalized;
    }

    mapping(uint256 => Record) public records;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event ProposalAnchored(uint256 indexed proposalId, string ipfsCid);
    event VoteCast(uint256 indexed proposalId, address indexed voter, uint8 choice);
    event ResultFinalized(uint256 indexed proposalId);

    // Call this after your backend has created the proposal and uploaded it to IPFS.
    function anchorProposal(uint256 proposalId, string calldata ipfsCid) external {
        require(bytes(records[proposalId].ipfsCid).length == 0, "Already anchored");
        records[proposalId].ipfsCid = ipfsCid;
        emit ProposalAnchored(proposalId, ipfsCid);
    }

    // choice: 0 = YES, 1 = NO, 2 = ABSTAIN
    function vote(uint256 proposalId, uint8 choice) external {
        Record storage r = records[proposalId];
        require(bytes(r.ipfsCid).length != 0, "Unknown proposal");
        require(!r.finalized, "Voting finalized");
        require(!hasVoted[proposalId][msg.sender], "Already voted");
        require(choice <= 2, "Invalid choice");

        hasVoted[proposalId][msg.sender] = true;

        if (choice == 0) r.yesVotes++;
        else if (choice == 1) r.noVotes++;
        else r.abstainVotes++;

        emit VoteCast(proposalId, msg.sender, choice);
    }

    // Call after the voting deadline, enforced by your app in this simplified example.
    function finalize(uint256 proposalId) external {
        Record storage r = records[proposalId];
        require(bytes(r.ipfsCid).length != 0, "Unknown proposal");
        require(!r.finalized, "Already finalized");
        r.finalized = true;
        emit ResultFinalized(proposalId);
    }
}


