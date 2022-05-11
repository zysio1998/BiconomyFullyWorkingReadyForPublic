import React, { useEffect, useState } from "react";
import './EthStuff.css';
import { ethers } from "ethers"
import { Biconomy } from "@biconomy/mexa";
import myNft from "./GaslessTransactions.json"
import {networks} from "./networks"
import Swal from 'sweetalert2'

const CONTRACT_ADDRESS = "0x653d74cf90fDbd24b8B80cE87263080CED9cA306"; //kovan mainnet

let ethersProvider, walletProvider, walletSigner
let contract, contractInterface
let biconomy

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [selectedAddress, setSelectedAddress] = useState('')
  const [loading, setloading] = useState(false);
  const [network, setNetwork] = useState('')

  const init = async () => {
    if (typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask) {
      // setInitLoading(0)

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
      //switchNetwork()
     
      // setupEventListener()
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

      //switchNetwork()
      // setupEventListener()
    } catch (error) {
      console.log(error)
    }
  }

  /*const switchNetwork = async () => {
    if (window.ethereum) {
      try {
        // Try to switch to the  testnet
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x89' }], // Check networks.js for hexadecimal network ids
        })
      } catch (error) {
        // This error code means that the chain we want has not been added to MetaMask
        // In this case we ask the user to add it to their MetaMask
        if (error.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0x89',
                  chainName: 'Polygon Mainnet',
                  rpcUrls: [
                    'https://polygon-rpc.com',
                  ],
                  nativeCurrency: {
                    name: 'MATIC',
                    symbol: 'MATIC',
                    decimals: 18,
                  },
                  blockExplorerUrls: ['https://polygonscan.com/'],
                },
              ],
            })
          } catch (error) {
            console.log(error)
          }
        }
        console.log(error)
      }
    } else {
      // If window.ethereum is not found then MetaMask is not installed
      alert(
        'MetaMask is not installed. Please install it to use this app: https://metamask.io/download.html'
      )
    }
  }*/

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
            console.log("handle errors like signature denied here");
            console.log(err);

            Swal.fire({
              icon: 'error',
              title: 'Minting Failed, try again in a moment',                           
            })
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

      Swal.fire({
        icon: 'error',
        title: 'Minting Failed, try again in a moment' ,   
        text: 'Remember, you can only mint 1 NFT',                        
      })

      /*if(error.data.message == "execution reverted: Invalid Merkle Proof."){
      Swal.fire({
        icon: 'error',
        title: 'Minting Failed',
        text: 'You are not in whitelist ',
       
      })
      
    }else if(error.data.message == "execution reverted: Address already claimed"){
      Swal.fire({
        icon: 'error',
        title: 'Minting Failed',
        text: 'You are already claimed',
       
      })
    }else{
      Swal.fire({
        icon: 'error',
        title: 'Minting Failed',
        text: error.data.message,
       
      })

    }*/
      console.log(error)
    }
  }

  useEffect(() => {
    checkIfWalletIsConnected();
    if(currentAccount !== ''){
      setloading(true)
    }

    if (currentAccount !== '' /*&& network === 'Polygon Mainnet'*/) {
      console.log('init')
      init()
    }
  }, [currentAccount/*, network*/])


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