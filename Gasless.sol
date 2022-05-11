//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";

contract Gasless is ERC721Enumerable, ERC2771Context{
    using SafeMath for uint256;
    using Counters for Counters.Counter;
    using Strings for uint256;

    Counters.Counter private _tokenIds;

    uint256 public maxSupply = 1000;
    uint256 public maxPerMint = 1;    
    address public owner;
    string public baseURI;
    string public baseExtension = ".json";   

    bool public _isActive = false;    
    

    constructor(
        address trustedForwarder,
        string memory _initBaseURI        
    ) 
    ERC721("Gasless Testing", "GAS") 
    ERC2771Context(trustedForwarder)  
    {
        owner = msg.sender;        
        setBaseURI(_initBaseURI);        
    }

    modifier onlyOwner() {
        require(owner == msg.sender, "Ownable: caller is not the owner");
        _;
    }    
  
    function setBaseURI(string memory _newBaseURI) public onlyOwner {
        baseURI = _newBaseURI;
    }    

    function setMaxSupply(uint256 _newmaxSupply) public onlyOwner {
        maxSupply = _newmaxSupply;
    } 

    function setMaxPerMint(uint256 _newMaxperMint) public onlyOwner {
        maxPerMint = _newMaxperMint;
    }     

    function setActive(bool isActive) external onlyOwner {
        _isActive = isActive;
    }

    function mintNFT() public  {
        uint256 totalMinted = _tokenIds.current();
        require(totalMinted < maxSupply, "Not enough NFTs left!");  
        require(balanceOf(_msgSender()) < maxPerMint, "Only 1 NFT allowed per wallet");     
        require(_isActive, "public sale has not begun yet");  
        _tokenIds.increment();
        uint256 tokenId = _tokenIds.current();        
        _safeMint(_msgSender(), tokenId);        
    }    

    function tokenURI(uint256 tokenId) public view virtual override returns(string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
        string memory currentBaseURI = _baseURI();
        return bytes(currentBaseURI).length > 0
        ? string(abi.encodePacked(currentBaseURI, tokenId.toString(), baseExtension))
        : "";
    }

    function _msgSender() internal view override(Context, ERC2771Context) returns (address sender) {
        sender = ERC2771Context._msgSender();
    }
   
    function _msgData() internal view override(Context, ERC2771Context) returns (bytes calldata){
        return ERC2771Context._msgData();
    }
     
    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }
}