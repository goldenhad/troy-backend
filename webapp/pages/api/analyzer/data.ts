



import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcrypt';
require('dotenv').config();
import { prisma } from '../../../db';
import { sendMail } from '@/helper/emailer';
import fs from 'fs';
import { decrypt } from "@/helper/decryptFile";
import { read, write, writeFile } from 'xlsx';
import { getAllYearsPublished } from '@/helper/filefunctions';


//Special type for custom response-error-messages
type ResponseData = {
    errorcode: number,
    message: { year: number; value: number; }[],
}

async function getSalesValuefromPath(file: string, cell: string, path: string){
    const buffer = fs.readFileSync(path);
    const decryptedbuffer = await decrypt(buffer);
    const workbook = read(decryptedbuffer);

    let val = workbook.Sheets[file][cell];


    return val;
}


export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {

    //Check if the request is a post request
    if(req.method == 'POST'){

        let postreq = req.body;

        const yearsPublished: Array<number> = await getAllYearsPublished();
        const years: Array<string> = [];

        yearsPublished.forEach(year => {
            years.push(year.toString());
        });

        const data: Array<{ year: number, value: number }> = [];

        console.log(years);

        for(let i=0; i < years.length; i++){
            const year = years[i];

            if(postreq.datasource == "SALES"){
                
            }

            let value = { v: 0 };

            switch(postreq.datasource){
                case "SALES":
                    value = await getSalesValuefromPath("GuV", "E59", `./public/data/${year}/guv.bin`);
                    break;
                case "PROCEEDS":
                    value = await getSalesValuefromPath("GuV", "E59", `./public/data/${year}/guv.bin`);
                    break;
            }

            data.push({
                year: parseInt(year),
                value: value.v
            });
        }

        return res.status(200).send({ errorcode: 0, message: data });
    }else{
        //If the request is anything other than a POST
        return res.status(400).send({ errorcode: 1, message: [] });
    }
}