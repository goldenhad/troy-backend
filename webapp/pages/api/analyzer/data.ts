



import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcrypt';
require('dotenv').config();
import { prisma } from '../../../db';
import { sendMail } from '@/helper/emailer';
import fs from 'fs';
import { decrypt } from "@/helper/decryptFile";
import { read, write, writeFile } from 'xlsx';
import { getAllYearsPublished } from '@/helper/filefunctions';
import { CompRef, Company } from '@/pages/quick-analyzer';


//Special type for custom response-error-messages
type ResponseData = {
    errorcode: number,
    message: Array<{ key: Company, items: Array<{ year: number, value: number }> }>,
}

async function getSalesValuefromPath(file: string, cell: string, path: string){
    const buffer = fs.readFileSync(path);
    const decryptedbuffer = await decrypt(buffer);
    const workbook = read(decryptedbuffer);

    let val = workbook.Sheets[file][cell];


    return val;
}

const dataSourceIndexMapping = (datasource: string) => {
    switch (datasource) {
        case "PROCEEDS":
          return 5;
        case "OVERSHOOT":
          return 6;
        case "SALES":
          return 7;
        case "CAPITAL":
          return 8;
        case "NEWBUILDINGS":
          return 11;
        case "MODERNIZINGS":
          return 12;
        case "FLATS":
          return 16;
        case "BUSINESSES":
          return 17;
        default:
          return 200; // oder einen anderen Standardwert, falls kein Fall zutrifft
      }
}

const companyOffsetMapping = (company: Company) => {
    switch (company) {
        case Company.WOHNBAU:
          return 0;
        case Company.SIEDLUNG:
          return 20;
        case Company.KREISBAU:
          return 40;
        case Company.STEINFURT:
          return 60;
        default:
          return 400; // oder einen anderen Standardwert, falls kein Fall zutrifft
      }
}


export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {

    //Check if the request is a post request
    if(req.method == 'POST'){

        let postreq = req.body;
        const compData: Array<{ key: Company, items: Array<{ year: number, value: number }> }> = [];

        for(let j=0; j < postreq.companies.length; j++){
          const comp = postreq.companies[j];
          const yearsPublished: Array<number> = await getAllYearsPublished();
          const years: Array<string> = [];

          yearsPublished.forEach(year => {
              years.push(year.toString());
          });

          const data: Array<{ year: number, value: number }> = [];

          for(let i=0; i < years.length; i++){
              const year = years[i];

              let value = { v: 0 };


              const effectiveIndex = companyOffsetMapping(comp) + dataSourceIndexMapping(postreq.datasource)

              value = await getSalesValuefromPath("Tabelle1", `B${effectiveIndex}`, `./public/data/${year}/kennzahlen.xlsx`);

              data.push({
                  year: parseInt(year),
                  value: value.v
              });
          }

          compData.push({
            key: comp,
            items: data,
          })
        }

        console.log(compData);

        return res.status(200).send({ errorcode: 0, message: compData });
    }else{
        //If the request is anything other than a POST
        return res.status(400).send({ errorcode: 1, message: [] });
    }
}