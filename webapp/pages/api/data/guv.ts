import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import { read } from 'xlsx';
require('dotenv').config();



//Special type for custom response-error-messages
type ResponseData = {
    errorcode: number | string,
    message: String,
}


export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {

    //Check if the request is a post request
    if(req.method == 'GET'){
        /* if(req.cookies.login){

            let loginObj = JSON.parse(Buffer.from(req.cookies.login, 'base64').toString('ascii'));

            if(loginObj.roleid == 1){ */
                const year = new Date().getFullYear();
                const path = `./public/data/${year}/guv.xlsx`;
                if(fs.existsSync(path)){

                    //const buffer = fs.readFileSync(path);
                    //const workbook = read(buffer);

                    //console.log(workbook.Sheets['GuV']["E14"]);

                    return res.status(200).send({ errorcode: -1, message: "OK" });

                }else{
                    return res.status(400).send({ errorcode: 4, message: "File not yet published!" });
                }
            /* }else{
                //If the needed data is not provided, send a bad request
                return res.status(400).send({ errorcode: 3, message: "The request method is forbidden!" });
            }
        }else{
            return res.status(400).send({ errorcode: 2, message: "The request method is forbidden!" });
        } */
    }else{
        //If the request is anything other than a POST
        return res.status(400).send({ errorcode: 1, message: "The request method is forbidden!" });
    }
}