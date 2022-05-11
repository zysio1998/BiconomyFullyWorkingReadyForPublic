1. git clone 
2. cd into file
3. yarn install
4. yarn start
5. yarn build
6. deploy on vercel or wherever

Links to all

1. link to etherscan - https://kovan.etherscan.io/address/0x653d74cf90fdbd24b8b80ce87263080ced9ca306
2. link to dapp - https://biconomy-gasless-testing.vercel.app/
3. link to github build - https://github.com/zysio1998/BiconomyGaslessTesting

To change this to suit a specific project

1. Create a contract on remix and deploy it using the correct trsuted forwarder addresses
2. Verify the Contract
3. Change the contract address in the dapp
4. Change the ABI in the GaslessTransaction.json file

5. On the Bicnomy Dashboard 
6. Add the new contract using the contract address and the abi
7. Set it as Trusted Forwarder
8. Add an API key , and set the function to MINT nft or whatever its called
9. should work

used to translate hex to string
https://string-functions.com/hex-string.aspx



Quick Notes:
set api in biconomy dashbaord

set public active
