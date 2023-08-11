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

            if(loginObj.roleid == 1){
                //Get the POST-data
                let data = req.body;

                //Check if the needed fields are provided
                if( data.username && data.role && data.email && data.password ){
                    try {
                        let username = data.username;
                        let email = data.email;
                        let role = parseInt(data.role);
                        let password = data.password;

                        const pepper = process.env.PEPPER;

                        const salt = bcrypt.genSaltSync(12);
                        const hash = bcrypt.hashSync(password + salt + pepper, 12);

                        const newUser = await prisma.user.create({
                            data: {
                                username: username,
                                email: email,
                                role: { connect: { id: role } },
                                password: hash,
                                salt: salt
                            }
                        });

                        //Query users with prisma with the provided username
                        
                    }catch(e){
                        return res.status(400).send({ errorcode: 1, message: "The provided Data has the wrong format" });
                    }

                    return res.status(200).send({errorcode: -1, message: "OK"});
                }else{
                    return res.status(400).send({ errorcode: 99, message: "The request method is forbidden!" });
                }
            }else{
                //If the needed data is not provided, send a bad request
                return res.status(400).send({ errorcode: 1, message: "Please provide all the neccessary data" });
            }
        }else{
            return res.status(400).send({ errorcode: 99, message: "The request method is forbidden!" });
        }
     }else{
        //If the request is anything other than a POST
        return res.status(400).send({ errorcode: 1, message: "The request method is forbidden!" });
    }
}