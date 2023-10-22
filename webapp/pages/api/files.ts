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
    if(req.method == 'POST'){

        if(req.cookies.login){

            let loginObj = JSON.parse(Buffer.from(req.cookies.login, 'base64').toString('ascii'));
            console.log(loginObj.role.capabilities.canUploadFiles);

            if(loginObj.role.id == 1 || loginObj.role.capabilities.canUploadFiles){
                //Get the POST-data
                let data = req.body;

                //Check if the needed fields are provided
                if( data.year && data.status){
                    try {
                        let year = data.year;
                        let status = "erstellt";
                        

                        let existsingfile = await prisma.files.findFirst({where: {year: year}});
                        console.log("===========>", existsingfile);
                        if(!existsingfile){
                            const newFile = await prisma.files.create({
                                data: {
                                    year: year,
                                    status: status,
                                    responsibleId: loginObj.id,
                                    commentary: ""
                                }
                            });
                        }else{
                            await prisma.files.update({
                                data: {
                                    status: status,
                                    responsibleId: loginObj.id,
                                    commentary: ""
                                },
                                where: { id: existsingfile.id }
                            })
                        }

                        //Query users with prisma with the provided username
                        
                    }catch(e){
                        return res.status(400).send({ errorcode: 1, message: "The provided Data has the wrong format" });
                    }

                    return res.status(200).send({errorcode: -1, message: "OK"});
                }else{
                    return res.status(400).send({ errorcode: 1, message: "Please provide all the neccessary data" });
                }
            }else{
                //If the needed data is not provided, send a bad request
                return res.status(400).send({ errorcode: 99, message: "The request method is forbidden!" });
            }
        }else{
            return res.status(400).send({ errorcode: 99, message: "The request method is forbidden!" });
        }
    }else if(req.method == "PUT"){
        if(req.cookies.login){
            let loginObj = JSON.parse(Buffer.from(req.cookies.login, 'base64').toString('ascii'));

            if(loginObj.role.id == 1 || loginObj.role.capabilities.canUnfreeze){
                let data = req.body;

                if(data.status && data.id){
                    let commentary = (data.commentary)? data.commentary: undefined;

                    if(commentary != undefined){
                        await prisma.files.update({
                            data: {
                                status: data.status,
                                commentary: data.commentary
                            },
                            where: { id: parseInt(data.id) }
                        });
                    }else{
                        await prisma.files.update({
                            data: {
                                status: data.status,
                            },
                            where: { id: parseInt(data.id) }
                        });
                    }

                    return res.status(200).send({ errorcode: -1, message: "OK" });
                }else{
                    return res.status(400).send({ errorcode: 99, message: "Data incomplete!" });
                }
            }else{
                return res.status(400).send({ errorcode: 99, message: "The request method is forbidden!" });
            }
        }
    }else{
        //If the request is anything other than a POST
        return res.status(400).send({ errorcode: 1, message: "The request method is forbidden!" });
    }
}