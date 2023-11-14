import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcrypt';
require('dotenv').config();
import { prisma } from '../../db';

//Special type for custom response-error-messages
type ResponseData = {
    errorcode: number,
    message: String,
}


export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {

    //Check if the request is a post request
    if(req.method == "POST"){
        let data = req.body;

        //Check if the needed fields are provided
        if( data.year){
            try {
                let year = parseInt(data.year);                

                let existsingfile = await prisma.files.findFirst({where: {year: year}});
                
                if(existsingfile?.status == "freigegeben"){
                    return res.status(200).send({ errorcode: 0, message: "OK" });
                }else{
                    return res.status(404).send({ errorcode: 0, message: "Not published!" });
                }
                                
            }catch(e){
                console.log(e);
                return res.status(400).send({ errorcode: 1, message: "The provided Data has the wrong format" });
            }

        }else{
            return res.status(400).send({ errorcode: 1, message: "Please provide all the neccessary data" });
        }
    }else{
        //If the request is anything other than a POST
        return res.status(400).send({ errorcode: 1, message: "The request method is forbidden!" });
    }
}