import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../db';
require('dotenv').config();
import fs, { readFileSync } from 'fs';
import FileType from "file-type";
import { decrypt } from '@/helper/decryptFile';
import yearPublished from '@/helper/filefunctions';
import puppeteer from 'puppeteer';


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

const saveAsPdf = async (url: string, options: any) => {
    const browser = await puppeteer.launch({
        args: ["--force-device-scale-factor=0.5"]
    });
    const page = await browser.newPage();
  
    await page.goto(`${process.env.WEBURL}${url}`, {
        waitUntil: 'networkidle0'
      });
  
    const result = await page.pdf(options);
    await browser.close();
  
    return result;
  };

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData | Buffer>) {

    //Check if the request is a post request
    if(req.method == 'GET'){
        const yearstr = req.query.year;
        const table = req.query.table;

        if(yearstr && table){
            const year = parseInt(yearstr as string);

            if(year){
                const available = await yearPublished(year);

                if(available){
                    let url = "";
                    let options = {
                        format: "a4",
                        scale: 0.5,
                        printBackground: true
                    };

                    switch(table){
                        case "guv":
                            url = `/presentation/guv/${year}?scaled=1`;
                            break;
                        case "aktiva":
                            url = `/presentation/konzernbilanz/aktiva/${year}?scaled=1`;
                            break;
                        case "passiva":
                            url = `/presentation/konzernbilanz/passiva/${year}?scaled=1`;
                            break;
                    }

                    if(url != ""){
                        res.setHeader(
                            'Content-Disposition',
                            `attachment; filename="file.pdf"`
                          );
                        res.setHeader('Content-Type', 'application/pdf');
                    
                        const pdf = await saveAsPdf(url as string, options);
                    
                        return res.send(pdf);
                    }else{
                        return res.status(400).send({ errorcode: 5, message: "Data not available" });
                    }
                }else{
                    return res.status(400).send({ errorcode: 4, message: "Data not available" });
                }
            }else{
                return res.status(400).send({ errorcode: 3, message: "Year in wrong format" });
            }
        }else{
            return res.status(400).send({ errorcode: 2, message: "Data missing" });
        }
    }else{
        //If the request is anything other than a POST
        return res.status(400).send({ errorcode: 1, message: "The request method is forbidden!" });
    }
}