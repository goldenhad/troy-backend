import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../db';
require('dotenv').config();
import fs from 'fs';
import * as openpgp from 'openpgp';
import FileType from "file-type";


const formidable = require("formidable");



//Special type for custom response-error-messages
type ResponseData = {
    errorcode: number | string,
    message: String,
}

export const config = {
    api: {
      bodyParser: false
    }
  };

const saveFile = async (file: any, filename: string) => {
    const year = new Date().getFullYear();
    const data = fs.readFileSync(file.filepath);
    try{
        const pubkey = fs.readFileSync("./public-key.asc").toString();

        if(!fs.existsSync(`./public/data`)){
            fs.mkdirSync(`./public/data/`);
        }
    
        if(!fs.existsSync(`./public/data/${year}`)){
            fs.mkdirSync(`./public/data/${year}`);
        }
    
    
    
        try{
            const encrypted = await openpgp.encrypt({
                message: await openpgp.createMessage({binary: data}),
                encryptionKeys: (await openpgp.readKey({armoredKey: pubkey})),
            });
        
            fs.writeFileSync(`./public/data/${year}/${filename}.xlsx`, encrypted);
            await fs.unlinkSync(file.filepath);
        }catch(e){
            console.log(e);
        }
    }catch(e){
        console.log(e);
    }

    
    return;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {

    //Check if the request is a post request
    if(req.method == 'POST'){
        if(req.cookies.login){

            let loginObj = JSON.parse(Buffer.from(req.cookies.login, 'base64').toString('ascii'));

            if(loginObj.role.capabilities.canUploadFiles){
                let filename = req.query.filename;
                console.log(req.query);
                
                if(filename){
                    let error: {code: number|string, message: string} = {code: -1, message: ""};
                
                    const form = new formidable.IncomingForm();
                    try{
                        const [fields, parsedFiles] = await form.parse(req);

                        if(parsedFiles.file[0]){
                            console.log("Files present")
                            const locfile = parsedFiles.file[0];
                            if(locfile){
                                console.log("Hole Datei");
                                if(locfile.mimetype == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || true){
                                    console.log("Datei hat richtigen Typ");
                                    if(locfile.size <= 1024 * 1024 * 10){
                                        console.log("Datei ist klein genug");
                                        await saveFile(locfile, filename as string);
                                        
                                    }else{
                                        console.log("Datei ist zu groß");
                                        error =  {code: "XSIZE", message: "The uploaded file is to big!"};
                                    }
                                }else{
                                    console.log("Datei hat falschen Typ ", locfile.mimetype);
                                    error = {code: "XMIMETYPE", message: "The uploaded file was not a .xlsx File"};
                                }
                            }else{
                                error = {code: "1", message: "No File provided!"};
                            }                        
                        }else{
                            console.log("Dateien nicht vorhanden");
                        }
        
                        console.log(error);
        
                        if(error.code != -1){
                            return res.status(400).send({errorcode: error.code, message: error.message});
                        }else{
                            return res.status(200).send({errorcode: 0, message: "Upload successfull!"});
                        }
                    }catch(err){
                        return res.status(400).send({errorcode: "XSIZE", message: "The uploaded file is to big!"});
                    }

                    /*
                    async function (_err: any, _fields: any, _files: any) {
                        
                    */
                }else{
                    return res.status(400).send({ errorcode: 4, message: "Please specify a filename!" });
                }
            }else{
                //If the needed data is not provided, send a bad request
                return res.status(400).send({ errorcode: 3, message: "The request method is forbidden!" });
            }
        }else{
            return res.status(400).send({ errorcode: 2, message: "The request method is forbidden!" });
        }
    }else{
        //If the request is anything other than a POST
        return res.status(400).send({ errorcode: 1, message: "The request method is forbidden!" });
    }
}