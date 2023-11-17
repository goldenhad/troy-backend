import "./style.scss"
import { GetServerSideProps } from "next";
import fs from 'fs';
import { read } from 'xlsx';
import { User } from '../../../helper/user'
import getNumber from "@/helper/numberformat";
import { decrypt } from "@/helper/decryptFile";
import yearPublished from "@/helper/filefunctions";

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

const FILEREF = 'verbindlichkeiten';

async function parseFile(path: string){
    const buffer = fs.readFileSync(path);
    const decryptedbuffer = await decrypt(buffer);
    const workbook = read(decryptedbuffer);

    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

    const cols: Array<String> = alphabet.slice(0, 9).split("");
    const lowerLimit = 7;
    const higherLimit = 22;

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
            let val = workbook.Sheets['Konzern'][col.concat(r.toString())];
            if(val){
                rowobj.columns.push(val.v);
            }else{
                rowobj.columns.push(null);
            }
        });

        rows.push(rowobj);
    }

    const underlinedrows = [19, 21];
    const boldrows = [21]

    boldrows.forEach((row) => {
        rows[row-lowerLimit].styling.bold = true;
    })

    underlinedrows.forEach((row) => {
        rows[row-lowerLimit].styling.underlined = true;
    })
    
    return rows;
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
    //Get the context of the request
    const { req, res } = ctx;
    //Get the cookies from the current request
    const { cookies } = req;

    let qyear = -1;
    if(ctx.query.year){
        try{
            qyear = parseInt(ctx.query.year as string);
        }catch(e){
            res.writeHead(302, { Location: "/notfound" });
            res.end();
    
            return { props: { InitialState: {} } };
        }

        if (!cookies.login) {
            let pub = await yearPublished(qyear);
            if(!pub){
                res.writeHead(302, { Location: "/notpublished" });
                res.end();
    
                return { props: { InitialState: {} } };
            }
        }
    
        const year = qyear;
        const path = `./public/data/${year}/${FILEREF}.bin`;
        let guvdata: Array<any> = [1, 2, 3];
        if(fs.existsSync(path)){
    
            guvdata = await parseFile(path);
        
    
            return {
                props: {
                    InitialState: {},
                    data: guvdata,
                },
            };
        }else{
            res.writeHead(302, { Location: "/notfound" });
            res.end();
    
            return { props: { InitialState: {} } };
        }
    }else{
        res.writeHead(302, { Location: "/" });
        res.end();

        return { props: { InitialState: {} } };
    }
};

export default function Verbindlichkeiten(props: InitialProps){
    const currentYear = new Date().getFullYear();

    const getBracket = (val: string | Number | null, direction: "l" | "r") => {
        if(val != null){
           if (direction == "l"){
            return "(";
           }else{
            return ")";
           }
        }
    }

    const getTableContent = () => {
        
        console.log(props.data)

        return props.data.map((rowobj, idx) => {
            let row = rowobj.columns;
            let allempty = row.every((v: any) => v === null );

            if(row[1] == "Summe"){
                row[1] = "Gesamtbetrag";
            }
            
            if(idx % 2 == 0){
                return (
                    <tr key={idx} className={`bordered-row ${(allempty)? "row-spacer": ""} ${(rowobj.styling.bold)? "bold-row": ""} ${(rowobj.styling.underlined)? "underlined-row": ""} ${(rowobj.styling.colored)? "colored-row": ""} ${(rowobj.styling.highlighted)? "highlighted-row": ""} ${(rowobj.styling.special)? "special-row": ""}`.replace(/\s+/g,' ').trim()}>
                        <td className="cell-title">{row[1]}</td>
                        <td className="cell-spacer" ><div className="spacer-content"></div></td>
                        <td className="cell-val">{getNumber(row[2], true)}<br />({getNumber(props.data[idx+1].columns[2], true)})</td>
                        <td className="cell-spacer"><div className="spacer-content"></div></td>
                        <td className="cell-val">{getNumber(row[3], true)}<br />({getNumber(props.data[idx+1].columns[3], true)})</td>
                        <td className="cell-spacer"><div className="spacer-content"></div></td>
                        <td className="cell-val">{getNumber(row[4], true)}<br />({getNumber(props.data[idx+1].columns[4], true)})</td>
                        <td className="cell-spacer"><div className="spacer-content"></div></td>
                        <td className="cell-val">{getNumber(row[5], true)}<br />({getNumber(props.data[idx+1].columns[5], true)})</td>
                        <td className="cell-spacer"><div className="spacer-content"></div></td>
                        <td className="cell-val">{getNumber(row[6], true)}<br />({getNumber(props.data[idx+1].columns[6], true)})</td>
                        <td className="cell-spacer"><div className="spacer-content"></div></td>
                        <td className="cell-val">{getNumber(row[7])}<br />{getBracket(row[7], "l")}{getNumber(props.data[idx+1].columns[7])}{getBracket(row[7], "r")}</td>
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
                        <th className="cell-title">Verbindlichkeitenspiegel</th>
                        <th className="cell-spacer"></th>
                        <th className="cell-headline">Insgesamt</th>
                        <th className="cell-spacer"></th>
                        <th className="cell-headline">Restlaufzeit bis zu einem Jahr</th>
                        <th className="cell-spacer"></th>
                        <th className="cell-headline">Restlaufzeit 1-5 Jahren</th>
                        <th className="cell-spacer"></th>
                        <th className="cell-headline">Restlaufzeit über 5 Jahre</th>
                        <th className="cell-spacer"></th>
                        <th className="cell-headline">Gesichert</th>
                        <th className="cell-spacer"></th>
                        <th className="cell-headline">Art der Sicherung</th>
                    </tr>
                </thead>
                <tbody>
                    <tr className="euro-row">
                        <td></td>
                        <td className="cell-spacer"></td>
                        <td>€</td>
                        <td className="cell-spacer"></td>
                        <td>€</td>
                        <td className="cell-spacer"></td>
                        <td>€</td>
                        <td className="cell-spacer"></td>
                        <td>€</td>
                        <td className="cell-spacer"></td>
                        <td>€</td>
                        <td className="cell-spacer"></td>
                        <td>*)</td>
                    </tr>
                    {getTableContent()}
                </tbody>
            </table>
            <p>*) GPR = Grundpfandrecht</p>
            <p>(Vohrjahreszahlen in Klammern)</p>
        </div>
    );
}