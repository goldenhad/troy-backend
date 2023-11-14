import { prisma } from "@/db";

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