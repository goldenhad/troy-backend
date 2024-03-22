import { prisma } from "@/db";
import { Files } from "@prisma/client";

export default async function yearPublished(year: number){
    if(year){
        let existsingfile = await prisma.files.findFirst({where: {year: year}});

        if(existsingfile?.status == "freigegeben"){
            return true;
        }else{
            return false;
        }
    }else{
        return false;
    }
}

export async function getAllYearsPublished(){
    let existsingfiles = await prisma.files.findMany();

    let valid: Array<number> = [];

    existsingfiles.forEach((file: Files) => {
        if(file.status == "freigegeben"){
            valid.push(file.year);
        }
    });

    return valid;
}