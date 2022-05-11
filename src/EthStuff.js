import React, { useEffect, useState } from "react";
import './EthStuff.css';
import { ethers } from "ethers"
import { Biconomy } from "@biconomy/mexa";
import myNft from "./GaslessTransactions.json"
import {networks} from "./networks"
import Swal from 'sweetalert2'

const CONTRACT_ADDRESS = "0x653d74cf90fDbd24b8B80cE87263080CED9cA306"; //kovan mainnet
const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
const web3 = createAlchemyWeb3("https://eth-kovan.alchemyapi.io/v2/ADXYfZxHoqDZPB5sMp-LA4LlHnlavdN1"); 
let ethersProvider, walletProvider, walletSigner
let contract, contractInterface
let biconomy

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [selectedAddress, setSelectedAddress] = useState('')
  const [loading, setloading] = useState(false);
  const [network, setNetwork] = useState('')

  var passedTxnHash = ''

  const init = async () => {
    if (typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask) {  
      biconomy = new Biconomy(new ethers.providers.JsonRpcProvider("https://eth-kovan.alchemyapi.io/v2/ADXYfZxHoqDZPB5sMp-LA4LlHnlavdN1"), {
        walletProvider: window.ethereum, 
        apiKey: '8FBNI6KMg.2d9fe647-e047-4088-a811-aee29e99cb25',
        debug: true,
      })
      console.log(biconomy, "checking")

      // two providers one with biconomy andd other for the wallet signing the transaction
      ethersProvider = new ethers.providers.Web3Provider(biconomy)
      walletProvider = new ethers.providers.Web3Provider(window.ethereum)
      walletSigner = walletProvider.getSigner()

      let userAddress = await walletSigner.getAddress()
      setSelectedAddress(userAddress)

      // init dApp stuff like contracts and interface
      biconomy
        .onEvent(biconomy.READY, async () => {
          contract = new ethers.Contract(
            CONTRACT_ADDRESS,
            myNft.abi,
            biconomy.getSignerByAddress(userAddress)
          )

          contractInterface = new ethers.utils.Interface(myNft.abi)
          setloading(false)
          // setInitLoading(1)
        })
        .onEvent(biconomy.ERROR, (error, message) => {
          console.log(message)
          console.log(error)
        })
    } else {
      console.log('Metamask not installed')
    }
  }

  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log("Make sure you have metamask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }
    const accounts = await ethereum.request({ method: 'eth_accounts' });

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account)      
    } else {
      console.log("No authorized account found")
    }

    // This is the new part, we check the user's network chain ID
    const chainId = await ethereum.request({ method: 'eth_chainId' })
    setNetwork(networks[chainId])
    ethereum.on('chainChanged', handleChainChanged)

    function handleChainChanged(_chainId) {
      window.location.reload()
    }
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);      
    } catch (error) {
      console.log(error)
    }
  }  

  const askContractToMintNft = async () => {
    try {
      if(currentAccount !== ''){
      setloading(true)
      const { ethereum } = window;
      if (ethereum) {
        let userAddress = selectedAddress          
          
        console.log(biconomy)
          let provider = biconomy.getEthersProvider();
          let { data } = await contract.populateTransaction.mintNFT();
          const myHash = data
          const glass = () => {   //used to pass it as a global variabe for the catch to display the revert reason       
            passedTxnHash = myHash  
            return passedTxnHash          
          }
          glass()
          let gasLimit = await provider.estimateGas({
            to: CONTRACT_ADDRESS,
            from: userAddress,
            data: data
          });
          console.log("Gas limit : ", gasLimit);

          let txParams = {
            data: data,
            to: CONTRACT_ADDRESS,
            from: userAddress,
            gasLimit: 10000000,
            signatureType: "EIP712_SIGN"
          };
          console.log(txParams)

          let tx
          try {
            tx = await provider.send("eth_sendTransaction", [txParams])
          }
          catch (err) {
            if(err.message == "MetaMask Message Signature: User denied message signature."){
              Swal.fire({
                icon: 'error',
                title: 'Minting Failed',
                text: 'Minting failed, you rejected the transaction, try again',         
              }) 
              setloading(false) 
              return 0;
            }else{
              Swal.fire({
                icon: 'error',
                title: 'Minting Failed, try again in a moment',                           
              })
            }      
          }         
          console.log("Transaction hash : ", tx);
          provider.once(tx, (transaction) => {
            console.log(transaction, "emited");
            setloading(false)
            Swal.fire({
              title: 'Minting successful',
              html:
                'Check your transaction below' +
                `<a href=' https://kovan.etherscan.io/tx/${transaction.transactionHash}' target="_blank"> https://kovan.etherscan.io/</a> ` +
                '',
              width: 600,
              padding: '3em',
              color: '#000000',
              background: '#fff',
              backdrop: `
                rgba(0,0,0,0.4)                
                left top
                no-repeat
              `
            })
          });

          console.log("Going to pop wallet now to pay gas...")
          console.log("Mining...please wait.")
          
       
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    }else{
      Swal.fire(
        'Connect wallet',
        'Before minting you must connect your wallet',
        'question'
      )
    }
      
    } catch (error) {
      setloading(false)

      //sending an eth call to get the revert reason
      let replay_tx = {
        to: CONTRACT_ADDRESS,
        from: currentAccount,        
        data: passedTxnHash,
      }      
        
      try{
        const pullCall = await web3.eth.call(replay_tx)
        console.log("Working ok", pullCall)
      }catch (error){        
        console.log("my own error" ,error.data) 
        var revertReason = error.data;   
        if(revertReason == "Reverted 0x08c379a00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001d4f6e6c792031204e465420616c6c6f776564207065722077616c6c6574000000"){
          Swal.fire({
            icon: 'error',
            title: 'Minting Failed',
            text: 'Cannot mint more than 1 NFT',
           
          })          
        }else if(revertReason == "Reverted 0x08c379a00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001d7075626c69632073616c6520686173206e6f7420626567756e20796574000000"){
          Swal.fire({
            icon: 'error',
            title: 'Minting Failed',
            text: 'Sale has not begun yet',
           
          })
        }else if(revertReason == "Reverted 0x08c379a0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000154e6f7420656e6f756768204e465473206c656674210000000000000000000000"){
          Swal.fire({
            icon: 'error',
            title: 'Minting Failed',
            text: 'All the NFTs are sold out',
           
          })
        }else{
          Swal.fire({
            icon: 'error',
            title: 'Minting Failed',
            text: 'Please try again',
           
          })   
        }       
      }      
      console.log(error)
    }
  }

  useEffect(() => {
    checkIfWalletIsConnected();
    if(currentAccount !== ''){
      setloading(true)
    }

    if (currentAccount !== '') {
      console.log('init')
      init()
    }
  }, [currentAccount])


  const renderNotConnectedContainer = () => (
    <button onClick={connectWallet} className="josh">
      Connect to Wallet
    </button>
  );
  

  return (
    <div className="App">
      {
        loading ?
          <div className="loading">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
          :
          ""}
      <div className={loading ? "container disabledbutton" : "container"}>
        
          <div className="container">
            {currentAccount === "" ? (
              renderNotConnectedContainer()
            ) : (
              ""
            )}
          </div>
       
        <div className="container2">
          <div className="row body">
            <div className="col-md-6 tesboddy ff">   
              <div className=" mint_div ">
                <button onClick={askContractToMintNft} className="cta-button connect-wallet-button">
                  Claim free gasless NFT
                </button>
              </div>
            </div>
            <div className="col-md-6 ff">
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;