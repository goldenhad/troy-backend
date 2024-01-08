import "./style.scss"
import { GetServerSideProps } from "next";
import fs from 'fs';
import { read } from 'xlsx';
import { User } from '../../../../helper/user'
import getNumber, { ExcelDateToJSDate } from "@/helper/numberformat";
import { decrypt } from "@/helper/decryptFile";
import moment from "moment";
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

const FILEREF = 'lagebericht';

async function parseFile(path: string){
    const buffer = fs.readFileSync(path);
    const decryptedbuffer = await decrypt(buffer);
    const workbook = read(decryptedbuffer);

    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

    const cols: Array<String> = alphabet.slice(0, 7).split("");
    const lowerLimit = 5;
    const higherLimit = 15;

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
            let val = workbook.Sheets['Neubau'][col.concat(r.toString())];
            if(val){
                rowobj.columns.push(val.v);
            }else{
                rowobj.columns.push(null);
            }
        });

        rows.push(rowobj);
    }

    const underlinedrows = [rows.length-2, rows.length-1];
    const boldrows = [rows.length-1]

    boldrows.forEach((row) => {
        rows[row].styling.bold = true;
    })

    underlinedrows.forEach((row) => {
        rows[row].styling.underlined = true;
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

export default function Rueckstellungen(props: InitialProps){
    const currentYear = new Date().getFullYear();

    const getTableContent = () => {

        return props.data.map((rowobj, idx) => {
            let row = rowobj.columns;
            let allempty = row.every((v: any) => v === null );

            if(idx == props.data.length - 1){
                row[0] = "Gesamtbetrag";
                row[5] = "";
            }
            
            /* return (
                <tr key={idx} className={`bordered-row ${(allempty)? "row-spacer": ""} ${(rowobj.styling.bold)? "bold-row": ""} ${(rowobj.styling.underlined)? "underlined-row": ""} ${(rowobj.styling.colored)? "colored-row": ""} ${(rowobj.styling.highlighted)? "highlighted-row": ""} ${(rowobj.styling.special)? "special-row": ""}`.replace(/\s+/g,' ').trim()}>
                    <td className="cell-title">{row[0]}</td>
                    <td className="cell-spacer"><div className="spacer-content"></div></td>
                    <td className="cell-val">{getNumber(row[1])}</td>
                    <td className="cell-spacer"><div className="spacer-content"></div></td>
                    <td className="cell-val">{getNumber(row[2])}</td>
                    <td className="cell-spacer"><div className="spacer-content"></div></td>
                    <td className="cell-val">{getNumber(row[4])}</td>
                    <td className="cell-spacer"><div className="spacer-content"></div></td>
                    <td className="cell-val">{getNumber(row[5])}</td>
                    <td className="cell-spacer"><div className="spacer-content"></div></td>
                    <td className="cell-val">{getNumber(row[6])}</td>
                </tr>
            ); */
            if(!allempty){
                return (
                    <div key={idx} className={`tablecontentrow ${(rowobj.styling.underlined)? "underlined-row": ""} ${(rowobj.styling.bold)? "bold-row": ""} ${(rowobj.styling.special)? "special-row": ""} ${(rowobj.styling.colored)? "colored-row": ""} ${(rowobj.styling.none)? "none-row": ""}`}>
                        <div className="tablecellwide">
                            <div className="possiblecontent-title">{row[0]}</div>
                        </div>
                        <div className="tablecell tablecellspacer"></div>
                        <div className="tablecellnumber">{row[1]}</div>
                        <div className="tablecell tablecellspacer"></div>
                        <div className="tablecellnumber">{row[2]}</div>
                        <div className="tablecell tablecellspacer"></div>
                        <div className="tablecellnumber">{row[3]}</div>
                        <div className="tablecell tablecellspacer"></div>
                        <div className="tablecellnumber">{row[4].toLocaleString("de-DE", {minimumFractionDigits: 0})} m²</div>
                        <div className="tablecell tablecellspacer"></div>
                        <div className="tablecellnumber">{(row[5])?moment(ExcelDateToJSDate(row[5])).format("DD.MM.YYYY"): ""}</div>

                    </div>
                );
            }
        });


    }

    /* return(
        <div className="presentation-page">
            <table>
                <thead>
                    <tr>
                        <th className="cell-title">Rückstellungsspiegel</th>
                        <th className="cell-spacer"></th>
                        <th className="cell-headline">Stand am 01.01.{currentYear}</th>
                        <th className="cell-spacer"></th>
                        <th className="cell-headline">Zuführung</th>
                        <th className="cell-spacer"></th>
                        <th className="cell-headline">Inanspruchnahme</th>
                        <th className="cell-spacer"></th>
                        <th className="cell-headline">Auflösung</th>
                        <th className="cell-spacer"></th>
                        <th className="cell-headline">Stand am 31.12.{currentYear}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr className="euro-row">
                        <td>Sachverhalt</td>
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
                    </tr>
                    {getTableContent()}
                </tbody>
            </table>
        </div>
    ); */
    return(
        <div className="presentation-page">
            <div className="tablestructure">
                <div className="tableheadlinerow">
                    <div className="tablecellwide">Neubauvorhaben</div>
                    <div className="tablecell tablecellspacer"></div>
                    <div className="tablecell">Status</div>
                    <div className="tablecell tablecellspacer"></div>
                    <div className="tablecell">Einheiten</div>
                    <div className="tablecell tablecellspacer"></div>
                    <div className="tablecell">Davon<br/>öffentlich<br/>gefördert</div>
                    <div className="tablecell tablecellspacer"></div>
                    <div className="tablecell">Grund-<br/>stücks-<br/>fläche</div>
                    <div className="tablecell tablecellspacer"></div>
                    <div className="tablecell">Fertig-<br/>stellung-<br/>geplant</div>
                </div>

                {getTableContent()}
            </div>
        </div>
    );
}