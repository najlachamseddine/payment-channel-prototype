# Treasury-PaymentChannelPrototype
The prototype code for treasury payment channels.

The treasury options were discussed here: https://quantnetwork.sharepoint.com/:p:/s/QuantNetwork/EYhzAV2A1OtBq66Ds2-R0UUBVf9rScokQgEbJI_SCxy3ew?e=vOe1af

Where we decided to settle on payment channels for the first prototype. 

A Solidity example starts here: https://solidity.readthedocs.io/en/v0.5.3/solidity-by-example.html#micropayment-channel


# Components

`DLT`: `Ethereum`

`Payment Channel Smart Contract (PCSM)`: Smart Contract in the Ethereum Ledger. It constitues the support of the payment channel created by an owner to transfer micropayments off-chain to an other party that will claim on-chain each payment separately by calling the smart contract.

`ERC20 Token`: token to be transferred in the micropayments.


# Parties

`Sender`: it is the `owner` of the payment channel which will do off-chain transfers to a receiver.
It deploys the `PCSM` to open a new payment channel.

`Receiver`: party claiming on-chain a payment by calling the payment channel smart contract.


# Technical descriptions

The uni-directional payment channel created by the owner is caracterized by:

* The sender/owner address

* The receiver address

* The ERC20 token used for the payment 

* The expiration time after which the owner can claim a timeout. The payment channel is then closed.

* It is an open payment channel, i.e, when a receiver is claiming a payment, the channel is not destroyed. Multiple on-chain payments can be claimed using the same payment channel.

The owner sends cryptographically signed messages off-chain. The data signed by the owner contains:

* The Ethereum receiver address

* The nonce of the message. After the receiver claims a payment related to a specific signed message, the nonce can't be reused to claim an other payment. This is done to avoid replay attacks by sending the same signed message. Each claimed payment on-chain must then have a different nonce to be accepted by the channel.

* The amount that will be claimed by the receiver

* The contract address of the payment channel to avoid cross contract attacks

The receiver claims the payment by sending the nonce, the amount and the signature of a micro-payment. The payment channel verifies the signature by recovering the signer (i.e the owner) address.


As we are dealing with ERC20 token for the payments, the sender should give the smart contract the approval to spend the amount from its account when the receiver claims a payment.

After the expiry time, the owner can claim a timout and close the payment channel.





