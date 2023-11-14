import * as openpgp from 'openpgp';
import fs from 'fs';
require('dotenv').config();


export const decrypt = async (encrypted: Buffer) =>{
    const privkey = fs.readFileSync("./private-key.asc").toString();

    const message = await openpgp.readMessage({
        armoredMessage: encrypted.toString() // parse armored message
    });

    const privateKey = await openpgp.decryptKey({
        privateKey: await openpgp.readPrivateKey({ armoredKey: privkey }),
        passphrase: process.env.PEPPER
    });

    const decrypted = await openpgp.decrypt({
        message,
        decryptionKeys: privateKey,
        format: 'binary'
    });
  

    return decrypted.data;
}