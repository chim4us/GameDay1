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

export const viewNFTScript = `
import GameDay from 0x1703a215038c262f
import NonFungibleToken from 0x631e88ae7f1d7c20

pub fun main(account: Address): [String] {
    let publicRefrence = getAccount(account).getCapability(/public/myGameDayCollection)
    .borrow<&GameDay.Collection{GameDay.MyCollectionPublic}>()!
  
    let info: [String] = []
    let nftRef = publicRefrence.borrowEntireNFT(id: publicRefrence.getIDs()[1])
    info.append(nftRef.NFTUrl)
    info.append(nftRef.Name)
    
  
    //return publicRefrence.borrowEntireNFT(id: Id).NFTUrl
    return info
}
`


export const viewNFTScriptbkp = `
import GameDay from 0x1703a215038c262f
import NonFungibleToken from 0x631e88ae7f1d7c20

pub fun main(account: Address, Id: UInt64): [String] {
  let publicRefrence = getAccount(account).getCapability(/public/myGameDayCollection)
  .borrow<&GameDay.Collection{GameDay.MyCollectionPublic}>()!

  let info: [String] = []
  let nftRef = publicRefrence.borrowEntireNFT(id: Id)
  info.append(nftRef.Name)
  info.append(nftRef.NFTUrl)

  //return publicRefrence.borrowEntireNFT(id: Id).NFTUrl
  return info
}

`