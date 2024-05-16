pragma solidity ^0.5.0;

import "./EIP20Interface.sol";

contract TreasuryPaymentChannel {

    mapping(uint256 => bool) usedNonces;
    address payable public sender;      // The account sending payments.
    address public receiver;   // The account receiving the payments.
    uint256 public expiration;  // Timeout in case the recipient does not claim a payment
    ERC20Interface linkedContract;
    string public contractIdentifier;
 
    event PrintSignature(bytes signature);
    event PrintMessage(bytes32 message);
    event PrintHash(bytes32 hash);
    event PrintAddress(address recAddress);

    constructor(address tokenContractAddress, address receiverAddress, uint256 expirationTime, string memory contractByteCodeHash) public payable {    
       sender = msg.sender;
       receiver = receiverAddress;
       expiration = now + expirationTime;
       contractIdentifier = contractByteCodeHash;
       linkedContract = ERC20Interface(tokenContractAddress);
    }

    function claimPayment(uint256 tokenAmount, uint256 nonce, bytes memory signature) public {
    // function claimPayment(uint256 tokenAmount) public {
        require(msg.sender == receiver);
        // require(now < expiration);
        // require(!usedNonces[nonce]);
        // usedNonces[nonce] = true;

        emit PrintSignature(signature);

        bytes32 hash = keccak256(abi.encodePacked(receiver, tokenAmount, nonce, address(this)));
        
        emit PrintHash(hash);
        // this recreates the message that was signed on the client
        bytes32 message = prefixed(hash);
        
        emit PrintMessage(message);
        
        address recAddress = recoverSigner(message, signature);
        
        emit PrintAddress(recAddress);

        if(recoverSigner(message, signature) != sender){
            revert("Wrong recover signer");
        }

        
        require(recoverSigner(message, signature) == sender);
    
        linkedContract.transferFrom(sender, receiver, tokenAmount);
    }


      /// the sender can extend the expiration at any time
    function extend(uint256 newExpiration) public {
        require(msg.sender == sender);
        require(newExpiration > expiration);
        expiration = newExpiration;
    }

     /// if the timeout is reached without the recipient closing the channel,
    /// then the Ether is released back to the sender.
    function claimTimeout() public {
      require(now >= expiration);
      selfdestruct(msg.sender);
    }

    /// destroy the contract and reclaim the leftover funds.
    // function kill() public {
    //     require(msg.sender == sender);
    //     selfdestruct(msg.sender);
    // }

    function splitSignature(bytes memory sig) internal pure returns (uint8 v, bytes32 r, bytes32 s) {
        require(sig.length == 65);
        assembly {
            // first 32 bytes, after the length prefix
            r := mload(add(sig, 32))
            // second 32 bytes
            s := mload(add(sig, 64))
            // final byte (first byte of the next 32 bytes)
            v := byte(0, mload(add(sig, 96)))
        }
        return (v, r, s);
    }


    function recoverSigner(bytes32 message, bytes memory sig) internal pure returns (address) {
        (uint8 v, bytes32 r, bytes32 s) = splitSignature(sig);
        return ecrecover(message, v, r, s);
    }

    /// builds a prefixed hash to mimic the behavior of eth_sign.
    function prefixed(bytes32 hash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }


}


