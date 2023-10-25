import * as openpgp from 'openpgp';
import fs from 'fs';
require('dotenv').config();


export const decrypt = async (encrypted: Buffer) =>{
    console.log("Reading private key");
    const privkey = fs.readFileSync("./private-key.asc").toString();

    console.log("Reading message");
    const message = await openpgp.readMessage({
        armoredMessage: encrypted.toString() // parse armored message
    });

    console.log(encrypted);

    console.log("Decrypting private key");
    const privateKey = await openpgp.decryptKey({
        privateKey: await openpgp.readPrivateKey({ armoredKey: privkey }),
        passphrase: process.env.PEPPER
    });

    console.log("Decrypting message");
    const decrypted = await openpgp.decrypt({
        message,
        decryptionKeys: privateKey,
        format: 'binary'
    });
  

    return decrypted.data;
}