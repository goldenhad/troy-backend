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
        headless: true,
        executablePath: process.env.CHROME_BIN || undefined,
        args: ["--force-device-scale-factor=0.5", '--no-sandbox', '--headless', '--disable-gpu', '--disable-dev-shm-usage']
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
                        scale: 1,
                        printBackground: true,
                        landscape: false,
                        margin: { left: '2cm', top: '1cm', right: '1cm', bottom: '1cm' }
                    };

                    switch(table){
                        case "guv":
                            options.scale = 0.5;
                            url = `/presentation/guv/${year}?scaled=1`;
                            break;
                        case "aktiva":
                            options.scale = 0.6;
                            url = `/presentation/konzernbilanz/aktiva/${year}?scaled=0`;
                            break;
                        case "passiva":
                            options.scale = 0.6;
                            url = `/presentation/konzernbilanz/passiva/${year}?scaled=0`;
                            break;
                        case "eks1":
                            options.scale = 0.6;
                            options.landscape = true;
                            url = `/presentation/eigenkapitalspiegel/I/${year}?scaled=0`;
                            break;
                        case "eks2":
                            options.scale = 0.6;
                            options.landscape = true;
                            url = `/presentation/eigenkapitalspiegel/II/${year}?scaled=0`;
                            break;
                        case "kapitalfluss":
                            options.scale = 0.6;
                            url = `/presentation/kapitalfluss/${year}?scaled=1`;
                            break;
                        case "anlagengitter1":
                            options.scale = 0.6;
                            options.landscape = true;
                            url = `/presentation/anlagengitter/I/${year}?scaled=1`;
                            break;
                        case "anlagengitter2":
                            options.scale = 0.6;
                            options.landscape = true;
                            url = `/presentation/anlagengitter/II/${year}?scaled=1`;
                            break;
                        case "rueckstellung":
                            options.scale = 0.6;
                            url = `/presentation/rueckstellung/${year}?scaled=1`;
                            break;
                        case "verbindlichkeiten":
                            options.scale = 0.6;
                            url = `/presentation/verbindlichkeiten/${year}?scaled=1`;
                            break;
                        case "lagebericht-bestand":
                            options.scale = 0.6;
                            url = `/presentation/lagebericht/bestand/${year}?scaled=1`;
                            break;
                        case "lagebericht-neubau":
                            options.scale = 0.6;
                            url = `/presentation/lagebericht/neubau/${year}?scaled=1`;
                            break;
                        case "lagebericht-ertrag":
                            options.scale = 0.6;
                            url = `/presentation/lagebericht/ertragslage/${year}?scaled=1`;
                            break;
                        case "lagebericht-finanzen":
                            options.scale = 0.6;
                            url = `/presentation/lagebericht/finanzlage/${year}?scaled=1`;
                            break;
                        case "anhang-hausbewirtschaftung":
                            options.scale = 0.6;
                            url = `/presentation/anhang/umsatzerloes/hausbewirtschaftung/${year}?scaled=1`;
                            break;
                        case "anhang-betreuungstaetigkeit":
                            options.scale = 0.6;
                            url = `/presentation/anhang/umsatzerloes/betreuungstaetigkeit/${year}?scaled=1`;
                            break;
                        case "anhang-lieferungenundleistungen":
                            options.scale = 0.6;
                            url = `/presentation/anhang/umsatzerloes/lieferungenundleistungen/${year}?scaled=1`;
                            break;
                        case "anhang-betrieblicheertraege":
                            options.scale = 0.6;
                            url = `/presentation/anhang/sonstige/betrieblicheertraege/${year}?scaled=1`;
                            break;
                        case "anhang-betrieblicheaufwendungen":
                            options.scale = 0.6;
                            url = `/presentation/anhang/sonstige/betrieblicheaufwendungen/${year}?scaled=1`;
                            break;
                        case "anhang-mitarbeiterinnen":
                            options.scale = 0.6;
                            url = `/presentation/anhang/sonstige/mitarbeiterinnen/${year}?scaled=1`;
                            break;
                        case "anhang-altersversorgung":
                            options.scale = 0.6;
                            url = `/presentation/anhang/sonstige/altersversorgung/${year}?scaled=1`;
                            break;
                    }

                    console.log(url);
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