import "./style.scss"
import { GetServerSideProps } from "next";
import fs from 'fs';
import { read } from 'xlsx';
import { User } from '../../../../../helper/user'
import getNumber from "@/helper/numberformat";
import { decrypt } from "@/helper/decryptFile";

type StylingProps = {
    highlighted: boolean;
    bold: boolean,
    colored: boolean,
    underlined: boolean,
    special: boolean
}

type RowObject = {
    columns: Array<any>;
    styling: StylingProps;
}

interface InitialProps {
    InitialState: User;
    data: Array<any>;
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
    //Get the context of the request
    const { req, res } = ctx;
    //Get the cookies from the current request
    const { cookies } = req;

    //Check if the login cookie is set
    if (!cookies.login) {
        //Redirect if the cookie is not set
        res.writeHead(302, { Location: "/login" });
        res.end();

        return { props: { InitialState: {} } };
    } else {
        let qyear = -1;
        if(ctx.query.year){
            qyear = parseInt(ctx.query.year as string);
        }

        const year = qyear;
        const path = `./public/data/${year}/anhang.bin`;
        let guvdata: Array<any> = [1, 2, 3];
        if(fs.existsSync(path)){

            const buffer = fs.readFileSync(path);
            const decryptedbuffer = await decrypt(buffer);
            const workbook = read(decryptedbuffer);

            const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

            const cols: Array<String> = alphabet.slice(0, 5).split("");
            const lowerLimit = 14;
            const higherLimit = 16;

            let rows: Array<RowObject> = [];

            for(let r=lowerLimit; r<= higherLimit; r++){
                let rowobj: RowObject = {
                    columns: [],
                    styling: {
                        colored: false,
                        bold: false,
                        underlined: false,
                        highlighted: false,
                        special: false,
                    }
                }

                cols.forEach((col) => {
                    let val = workbook.Sheets['Mitarbeiter'][col.concat(r.toString())];
                    if(val){
                        rowobj.columns.push(val.v);
                    }else{
                        rowobj.columns.push(null);
                    }
                });

                rows.push(rowobj);
            }

            const underlinedrows = [rows.length-1];
            const boldrows = [rows.length-1]

            boldrows.forEach((row) => {
                rows[row].styling.bold = true;
            })

            underlinedrows.forEach((row) => {
                rows[row].styling.underlined = true;
            })

            guvdata = rows;
        

            return {
                props: {
                    InitialState: JSON.parse(
                    Buffer.from(cookies.login, "base64").toString("ascii")
                    ),
                    data: guvdata,
                },
            };
        }else{
            res.writeHead(302, { Location: "/" });
            res.end();

            return { props: { InitialState: {} } };
        }
    }
};

export default function Verbindlichkeiten(props: InitialProps){
    const currentYear = new Date().getFullYear();

    const formatNumber = (value: number, index: Number, limit: Number) => {
        if(index != limit){
            let percentval = value*100;
            return percentval.toLocaleString("de-DE") + " %";
        }else{
            return getNumber(value) + " T€"
        }
    }

    const getTableContent = () => {
        

        return props.data.map((rowobj, idx) => {
            let row = rowobj.columns;
            let allempty = row.every((v: any) => v === null );
            
            if(!allempty){
                return (
                    <tr key={idx} className={`bordered-row ${(allempty)? "row-spacer": ""} ${(rowobj.styling.bold)? "bold-row": ""} ${(rowobj.styling.underlined)? "underlined-row": ""} ${(rowobj.styling.colored)? "colored-row": ""} ${(rowobj.styling.highlighted)? "highlighted-row": ""} ${(rowobj.styling.special)? "special-row": ""}`.replace(/\s+/g,' ').trim()}>
                        <td className="cell-title">{row[0]}</td>
                        <td className="cell-spacer" ><div className="spacer-content"></div></td>
                        <td className="cell-val">{formatNumber(row[1], idx, props.data.length-1)}</td>
                        <td className="cell-spacer"><div className="spacer-content"></div></td>
                        <td className="cell-val">{formatNumber(row[2], idx, props.data.length-1)}</td>
                    </tr>
                );
            }
        });


    }

    return(
        <div className="presentation-page">
            <table>
                <thead>
                    <tr>
                        <th className="cell-title">Mitgliedschaft</th>
                        <th className="cell-spacer"></th>
                        <th className="cell-headline">KBV<br />VBL</th>
                        <th className="cell-spacer"></th>
                        <th className="cell-headline">KSG<br />kvw</th>
                    </tr>
                </thead>
                <tbody>
                    {getTableContent()}
                </tbody>
            </table>
        </div>
    );
}