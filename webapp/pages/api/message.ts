import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcrypt';
require('dotenv').config();
import { prisma } from '../../db';
import { sendMail } from '@/helper/emailer';

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

            if(loginObj.role.id == 1){
                //Get the POST-data
                let data = req.body;

                //Check if the needed fields are provided
                if( data.type && data.reponsiblemail && data.reponsiblename){
                    if(data.type == "erstellt"){
                        try {
                            let text = `Hallo,\nneue Dateien wurden in das System durch ${data.reponsiblename} hochgeladen.\nSie können die Daten nun überprüfen und freigeben oder eine Revision erbitten.`;
                            let html = `Hallo,<br>neue Dateien wurden in das System durch <b>${data.reponsiblename}</b> hochgeladen.<br>Sie können die Daten nun überprüfen und freigeben oder eine Revision erbitten.`;
                            await sendMail("dev@maximiliankrebs.com", "Neue Dateien wurden hochgeladen 📄", text, html);
    
                        }catch(e){
                            return res.status(400).send({ errorcode: 1, message: "The provided Data has the wrong format" });
                        }
                    }else if(data.type == "revision"){
                        try {
                            let text = `Hallo @${data.reponsiblename},\neine Überprüfung des Qualitätsmanagements hat ergeben, dass ihre hochgeladenen Daten noch Fehler aufweisen und nochmal überprüft werden müssen.\nSobald Sie die Dateien bearbeitet haben können Sie diese erneut hochladen.`;
                            let html = `Hallo<b>@${data.reponsiblename}</b>,<br>eine Überprüfung des Qualitätsmanagements hat ergeben, dass ihre hochgeladenen Daten noch Fehler aufweisen und nochmal überprüft werden müssen.<br>Sobald Sie die Dateien bearbeitet haben können Sie diese erneut hochladen.`;
                            await sendMail(data.reponsiblemail, "Überprüfung erforderlich 🛑", text, html);
    
                        }catch(e){
                            return res.status(400).send({ errorcode: 1, message: "The provided Data has the wrong format" });
                        }
                    }else if(data.type == "freeze"){
                        try {
                            let text = `Hallo @${data.reponsiblename},\ndie von Ihnen hochgeladenen Dateien wurden durch das Qualitätsmanagement akzeptiert.`;
                            let html = `Hallo <b>@${data.reponsiblename}</b>,<br>die von Ihnen hochgeladenen Dateien wurden durch das Qualitätsmanagement akzeptiert.`;
                            await sendMail(data.reponsiblemail, "Ihre Dateien wurden freigegeben ✅", text, html);
    
                        }catch(e){
                            return res.status(400).send({ errorcode: 1, message: "The provided Data has the wrong format" });
                        }
                    }else{
                        return res.status(200).send({errorcode: 98, message: "Message type not recognized!"});
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
    }else{
        //If the request is anything other than a POST
        return res.status(400).send({ errorcode: 1, message: "The request method is forbidden!" });
    }
}