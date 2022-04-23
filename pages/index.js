import Head from 'next/head'
//import "../flow/config";
import { useState, useEffect } from "react";
import * as fcl from "@onflow/fcl";
import * as types from "@onflow/types";
import {create} from "ipfs-http-client";
import { mintNFTTx,viewNFTScript } from "./cadence/code.js";

const client = create('https://ipfs.infura.io:5001/api/v0');

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

  //const [user, setUser] = useState({loggedIn: null})
  //useEffect(() => fcl.currentUser.subscribe(setUser), [])

  const [user, setUser] = useState();
  const [inp, setInp] = useState();
  const [file, setFile] = useState();

  const [scriptResult, setScriptResult] = useState([]);

  useEffect(()=>{
    fcl.currentUser().subscribe(setUser)
  }, [])

  const AuthedState = () => {
    return (
      <div>
        <div>Address: {user?.addr ?? "No Address"}</div>
        <button onClick={fcl.unauthenticate}>Log Out</button>
      </div>
    )
  }

  const UnauthenticatedState = () => {
    return (
      <div>
        <button onClick={fcl.logIn}>Log In</button>
        <button onClick={fcl.signUp}>Sign Up</button>
      </div>
    )
  }
  const mint = async () => {
    const added = await client.add(file);
    const hash = added.path;

    const transactionId = await fcl.send([
      fcl.transaction(mintNFTTx),
      fcl.args([
        fcl.arg(hash, types.String),
        fcl.arg("Game Day", types.String)
      ]),
      fcl.payer(fcl.authz),
      fcl.proposer(fcl.authz),
      fcl.authorizations([fcl.authz]),
      fcl.limit(9999)
    ]).then(fcl.decode);

    console.log("hash: " + hash);
    console.log("transactionId: " + transactionId);
  }

  const view = async () => {
    const result = await fcl.send([
      fcl.script(viewNFTScript),
      fcl.args([
        fcl.arg(user.addr, types.Address)
        //,fcl.arg(inp, types.UInt64) 
      ])
    ]).then(fcl.decode);

    console.log(result);
    setScriptResult(result);
  }

  return (
    <div className="App">
      <h1>Game Day</h1>
      {user && user.addr ? <h1>{user.addr}</h1>: null}
      <div>
        <button onClick={() => logIn()}>Log In</button>
        <button onClick={() => logOut()}>Log Out</button>
      </div>
      

      <div>
        <input type="file" onChange={(e) => setFile(e.target.files[0])}/>
        <button onClick={() => mint()}>Minte</button>
      </div>
      <div>
        <input type="text" onChange={
                (e) => setInp(e.target.value)
            }/>
        <button onClick={() => view()}>view</button>
      </div>

      {scriptResult.length !== 0
          ? <div>
              <img src={`https://ipfs.infura.io/ipfs/${scriptResult[0]}`} />
              <h2>{scriptResult[1]}</h2>
            </div>
          : null
        }
    </div>
  );
}
