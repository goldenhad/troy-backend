import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../db';
require('dotenv').config();
import fs, { readFileSync } from 'fs';
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

    if(!fs.existsSync(`./public/data`)){
        fs.mkdirSync(`./public/data/`);
    }

    if(!fs.existsSync(`./public/data/${year}`)){
        fs.mkdirSync(`./public/data/${year}`);
    }

    fs.writeFileSync(`./public/data/${year}/${filename}.xlsx`, data);
    await fs.unlinkSync(file.filepath);
    return;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData | Buffer>) {

    //Check if the request is a post request
    if(req.method == 'GET'){
        if(req.cookies.login){

            let loginObj = JSON.parse(Buffer.from(req.cookies.login, 'base64').toString('ascii'));

            if(loginObj){
                let filename = req.query.filename;
                let year = req.query.year;
                console.log(req.query);
                
                if(filename){
                    const imageBuffer = readFileSync(`./public/data/${year}/${filename}.xlsx`);
                    
                    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                    res.setHeader(`content-disposition`, `attachment; filename=${filename}.xlsx`);

                    res.send(imageBuffer);
                }else{
                    return res.status(400).send({ errorcode: 4, message: "File not found" });
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