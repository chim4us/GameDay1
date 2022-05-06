//
import { useState, useEffect } from "react";
import * as fcl from "@onflow/fcl";
import * as types from "@onflow/types";
import {create} from "ipfs-http-client";
//import { mintNFTTxx,viewNFTScript } from "./lib/code.js";

const client = create('https://ipfs.infura.io:5001/api/v0');

const viewNFTScript = `
import GameDay from 0x40d77146730593ba
import NonFungibleToken from 0x631e88ae7f1d7c20
import MetadataViews from 0x40d77146730593ba

pub struct NFT {
  pub let NFTUrl: String
  pub let name: String
  pub let description: String
  pub let thumbnail: String
  pub let owner: Address
  pub let type: String
  pub let royalties: [MetadataViews.Royalty]
  

  init(
      NFTUrl: String,
      name: String,
      description: String,
      thumbnail: String,
      owner: Address,
      nftType: String,
      royalties: [MetadataViews.Royalty]
  ) {
      self.NFTUrl = NFTUrl
      self.name = name
      self.description = description
      self.thumbnail = thumbnail
      self.owner = owner
      self.type = nftType
      self.royalties = royalties
  }
}

pub fun main(account: Address, Id: UInt64): NFT {
  let publicRefrence = getAccount(account).getCapability(/public/myGameDayCollection)
  .borrow<&GameDay.Collection{GameDay.MyCollectionPublic}>()!

  let account = getAccount(account)
  let collection = account
      .getCapability(/public/myGameDayCollection)
      .borrow<&GameDay.Collection{GameDay.MyCollectionPublic}>()
      ?? panic("Could not borrow a reference to the collection")

  let nft = collection.borrowEntireNFT(id: Id)!

  let view = nft.resolveView(Type<MetadataViews.Display>())!

  let expectedRoyaltyView = nft.resolveView(Type<MetadataViews.Royalties>())!

  let royaltyView = expectedRoyaltyView as! MetadataViews.Royalties

  let display = view as! MetadataViews.Display
  
  let owner: Address = nft.owner!.address!
  let nftType = nft.getType()

  return NFT(
      NFTUrl: nft.NFTUrl,
      name: display.name,
      description: display.description,
      thumbnail: display.thumbnail.uri(),
      owner: owner,
      nftType: nftType.identifier,
      royalties: royaltyView.getRoyalties()
  )
}`

const mintNFTTxx = `import MetadataViews from 0x40d77146730593ba
import NonFungibleToken from 0x631e88ae7f1d7c20
import GameDay from 0x40d77146730593ba
import FungibleToken from 0x9a0766d93b6608b7

transaction(
  ImURL: String, 
  Name: String,
  NFTDescription: String,
  NFTThumbnail: String,
  cuts: UFix64,
  royaltyDescriptions: String,
  royaltyBeneficiaries: Address
  ) {
let royalties: [MetadataViews.Royalty]



prepare(acct: AuthAccount) {
  self.royalties = []
  var count = 0
  


  let beneficiary = royaltyBeneficiaries
  let beneficiaryCapability = getAccount(royaltyBeneficiaries)
  .getCapability<&FungibleToken.Vault{FungibleToken.Receiver}>(MetadataViews.getRoyaltyReceiverPublicPath())
  self.royalties.append(
    MetadataViews.Royalty(
      receiver: beneficiaryCapability,
      cut: cuts,
      description: royaltyDescriptions
    )
  )
  count = count + 1

  if acct.borrow<&GameDay.Collection>(from: /storage/myGameDayCollection) == nil {
    acct.save(<- GameDay.createEmptyCollection(),  to: /storage/myGameDayCollection)
    acct.link<&GameDay.Collection{GameDay.MyCollectionPublic}>(/public/myGameDayCollection, target: /storage/myGameDayCollection)
  }

  let NFTMinter = acct.borrow<&GameDay.NFTMinter>(from: /storage/Minter)
                        ?? panic("Your address don't have Minter right")

  let nftCollection = acct.borrow<&GameDay.Collection>(from: /storage/myGameDayCollection)
                      ?? panic("Your address don't have Minter right")

  nftCollection.deposit(token: <- NFTMinter.CreateNft(
      NftUrl: ImURL, 
      Name: Name, 
      royalties: self.royalties,
      _description: NFTDescription,
      _thumbnail: NFTThumbnail))
}

pre {
  cuts != nil && royaltyDescriptions != nil &&  royaltyBeneficiaries != nil: "Array length should be equal for royalty related details"
}

execute {
  log("Minted NFT")
}
}`

const viewAllNFT = `import GameDay from 0x40d77146730593ba

pub fun main(account: Address): [UInt64] {
  let publicRefrence = getAccount(account).getCapability(/public/myGameDayCollection)
  .borrow<&GameDay.Collection{GameDay.MyCollectionPublic}>()!

    return publicRefrence.getIDs()
}`

fcl.config()
.put("accessNode.api", "https://access-testnet.onflow.org")
.put("discovery.wallet", "https://fcl-discovery.onflow.org/testnet/authn")

export default function Home() {

  const logIn = () =>{
     fcl.authenticate();
  }

  const logOut = () =>{
      fcl.unauthenticate();
  }

  const [user, setUser] = useState();
  const [inp, setInp] = useState();
  const [file, setFile] = useState();

  const [Name, setName] = useState();
  const [NDesc, setNDesc] = useState();
  const [NThum, setNThum] = useState();
  const [RoyCut, setRoyCut] = useState();
  const [RoyDesc, setRoyDesc] = useState();
  const [RoyBene, setRoyBene] = useState();

  const [scriptResult, setScriptResult] = useState([]);

  const [RsNFTUrl, setRsNFTUrl] = useState();
  const [RsName, setRsName] = useState();
  const [RsDesc, setRsDesc] = useState();
  const [RsThumbnail, setRsThumbnail] = useState();
  const [RsOwner, setRsOwner] = useState();
  const [RsRoyAddr, setRsRoyAddr] = useState();
  const [RsRoyCut, setRsRoyCut] = useState();
  const [RsRoyDes, setRsRoyDes] = useState();

  useEffect(()=>{
    fcl.currentUser().subscribe(setUser)
  }, [])

  

  const mint = async () => {
    const added = await client.add(file);
    const hash = added.path;

    const transactionId = await fcl.send([
      fcl.transaction(mintNFTTxx),
      fcl.args([
        fcl.arg(hash, types.String),
        fcl.arg(Name, types.String),
        fcl.arg(NDesc, types.String),
        fcl.arg(NThum, types.String),
        fcl.arg(parseFloat(RoyCut), types.UFix64),
        fcl.arg(RoyDesc, types.String),
        fcl.arg(RoyBene, types.Address)
      ]),
      fcl.payer(fcl.authz),
      fcl.proposer(fcl.authz),
      fcl.authorizations([fcl.authz]),
      fcl.limit(9999)
    ]).then(fcl.decode);

    console.log("hash: " + hash);
    console.log("transactionId: " + transactionId);
  }

  const viewAll = async () => {
    const result = await fcl.send([
      fcl.script(viewAllNFT),
      fcl.args([
        fcl.arg(user.addr, types.Address)
      ])
    ]).then(fcl.decode);

    console.log(result)

    for(var i = 0; i <= result.length; i ++){
      console.log(result[i])
    }
    
    //setScriptResult();
  }

  const view = async () => {
    const result = await fcl.send([
      fcl.script(viewNFTScript),
      fcl.args([
        fcl.arg(user.addr, types.Address)
        ,fcl.arg(parseInt(inp), types.UInt64)
      ])
    ]).then(fcl.decode);
    
    setScriptResult(result);
    
    var NFTUrl = result.NFTUrl;
    setRsNFTUrl(NFTUrl)
    
    var name = result.name;
    setRsName(name)

    var desc = result.description;
    setRsDesc(desc)
    
    var thumbnail = result.thumbnail;
    setRsThumbnail(thumbnail)
    
    var owner = result.owner;
    setRsOwner(owner)
    
    var RoyAddr = result.royalties[0].receiver.address;
    setRsRoyAddr(RoyAddr)

    var RoyCut = result.royalties[0].cut;
    setRsRoyCut(RoyCut)

    var RoyDes = result.royalties[0].description;
    setRsRoyDes(RoyDes)
  }

  //<input type="text" onChange={(e) => setInp(e.target.value)}/>
  //<button onClick={() => mint()}>Minte</button>
  //<input type="submit" value = "Mint" className = "btn btn-block"/>

  return (
    <div className="App">
      <h1>Game Day</h1>
      {user && user.addr ? <h1>{user.addr}</h1>: null}
      <div>
        <button onClick={() => logIn()}>Log In</button>
        <button onClick={() => logOut()}>Log Out</button>
      </div>

      
      <div>Mint</div>
      <div>
        <div className="form-control" >
            <label>Name</label>
            <input type="text" placeholder = 'NFT Name' onChange={
                (e) => setName(e.target.value)
            }/>
        </div>

        <div className="form-control">
            <label>NFT Description</label>
            <input type="text" placeholder = 'NFT Description' onChange={
                (e) => setNDesc(e.target.value)
            }/>
        </div>
        <div className="form-control">
            <label>NFT Thumbnail</label>
            <input type="text" placeholder = 'NFT Thumbnail'  onChange={
                (e) => setNThum(e.target.value)
            }/>
        </div>

        <div className="form-control">
            <label>Royalty Cuts</label>
            <input type="text" placeholder = 'Royalty Cuts'  onChange={
                (e) => setRoyCut(e.target.value)
            }/>
        </div>
        
        <div className="form-control">
            <label>Royalty Descriptions</label>
            <input type="text" placeholder = 'Royalty Descriptions'  onChange={
                (e) => setRoyDesc(e.target.value)
            }/>
        </div>

        <div className="form-control">
            <label>Royalty Beneficiaries</label>
            <input type="text" placeholder = 'Royalty Descriptions'  onChange={
                (e) => setRoyBene(e.target.value)
            }/>
        </div>
        <div>
          <input type="file" placeholder = 'NFT'  onChange={(e) => setFile(e.target.files[0])}/>
        </div>
        <button onClick={() => mint()}>Mint</button>
        
    </div>

      
      
      <div>View</div>
      <div>
        <input type="text" onChange={(e) => setInp(e.target.value)}/>
        <button onClick={() => view()}>view</button>

        <button onClick={() => viewAll()}>View All ID's</button>
      </div>

      {scriptResult.length !== 0
          ? <div>
              <img src={`https://ipfs.infura.io/ipfs/${RsNFTUrl}`} />
              <h2>Name: {RsName}</h2>
              <h2>NFT Description: {RsDesc}</h2>
              <h2>NFT Thumbnail: {RsThumbnail}</h2>
              <h2>NFT Owner: {RsOwner}</h2>
              <h2>Royalty Address: {RsRoyAddr}</h2>
              <h2>Royalty Cuts: {RsRoyCut}</h2>
              <h2>Royalty Descriptions: {RsRoyDes}</h2>
            </div>
          : null
        }
    </div>
  );
}
