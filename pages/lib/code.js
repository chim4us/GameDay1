export const mintNFTTx = `
import GameDay from 0x1703a215038c262f
import NonFungibleToken from 0x631e88ae7f1d7c20

transaction(ImURL: String, Name: String) {

  prepare(acct: AuthAccount) {
    if acct.borrow<&GameDay.Collection>(from: /storage/myGameDayCollection) == nil {
      acct.save(<- GameDay.createEmptyCollection(),  to: /storage/myGameDayCollection)
      acct.link<&GameDay.Collection{GameDay.MyCollectionPublic}>(/public/myGameDayCollection, target: /storage/myGameDayCollection)
    }

    let NFTMinter = acct.borrow<&GameDay.NFTMinter>(from: /storage/Minter)
                          ?? panic("Your address don't have Minter right")

    let nftCollection = acct.borrow<&GameDay.Collection>(from: /storage/myGameDayCollection)
                        ?? panic("Your address don't have Minter right")

    nftCollection.deposit(token: <- NFTMinter.CreateNft(NftUrl: ImURL, Name: Name))
  }

  execute {
  }
}
`

export const viewNFTScriptbkp = `
import GameDay from 0x1703a215038c262f
import NonFungibleToken from 0x631e88ae7f1d7c20

pub fun main(account: Address): [String] {
    let publicRefrence = getAccount(account).getCapability(/public/myGameDayCollection)
    .borrow<&GameDay.Collection{GameDay.MyCollectionPublic}>()!
  
    let info: [String] = []
    let nftRef = publicRefrence.borrowEntireNFT(id: publicRefrence.getIDs()[5])
    info.append(nftRef.NFTUrl)
    info.append(nftRef.Name)
    
  
    //return publicRefrence.borrowEntireNFT(id: Id).NFTUrl
    return info
}
`


export const viewNFTScript = `
import GameDay from 0x12ba346a5192ba0d
import NonFungibleToken from 0x631e88ae7f1d7c20
import MetadataViews from 0x12ba346a5192ba0d

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

  // Get the basic display information for this NFT
  let view = nft.resolveView(Type<MetadataViews.Display>())!

  // Get the royalty information for the given NFT
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
}

`


export const mintNFTTxx = `
  import MetadataViews from 0x12ba346a5192ba0d
  import NonFungibleToken from 0x631e88ae7f1d7c20
  import GameDay from 0x12ba346a5192ba0d
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
}
`