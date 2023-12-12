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

const FILEREF = 'kapitalfluss';

async function parseFile(path: string){
    const buffer = fs.readFileSync(path);
    const decryptedbuffer = await decrypt(buffer);
    const workbook = read(decryptedbuffer);

    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

    const cols: Array<String> = alphabet.slice(0, 4).split("");
    const lowerLimit = 5;
    const higherLimit = 37;

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
            let val = workbook.Sheets['Kapitalfluss'][col.concat(r.toString())];
            if(val){
                rowobj.columns.push(val.v);
            }else{
                rowobj.columns.push(null);
            }
        });

        rows.push(rowobj);
    }

    const boldrows = [18, 25, 34];
    const colorsrows = [37];
    const underlinedrows = [17, 18, 24, 25, 33, 34];
    const highlightedrow = [36];

    boldrows.forEach((row) => {
        rows[row-lowerLimit].styling.bold = true;
    })

    underlinedrows.forEach((row) => {
        rows[row-lowerLimit].styling.underlined = true;
    })

    colorsrows.forEach((row) => {
        rows[row-lowerLimit].styling.colored = true;
    })

    highlightedrow.forEach((row) => {
        rows[row-lowerLimit].styling.highlighted = true;
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

export default function Kapitalfluss(props: InitialProps){
    const currentYear = new Date().getFullYear();

    const getTableContent = () => {

        return props.data.map((rowobj, idx) => {

            let row = rowobj.columns;

            let allempty = row.every((v: any) => v === null );

            /* return (
                <tr key={idx} className={`bordered-row ${(allempty)? "row-spacer": ""} ${(rowobj.styling.bold)? "bold-row": ""} ${(rowobj.styling.underlined)? "underlined-row": ""} ${(rowobj.styling.colored)? "colored-row": ""} ${(rowobj.styling.highlighted)? "highlighted-row": ""} ${(rowobj.styling.special)? "special-row": ""}`.replace(/\s+/g,' ').trim()}>
                    <td className="row-meaning">{row[0]}</td>
                    <td className="cell-spacer"><div className="spacer-content"></div></td>
                    <td className="cell-val">{getNumber(row[1])}</td>
                    <td className="cell-spacer"><div className="spacer-content"></div></td>
                    <td className="cell-val">{getNumber(row[2])}</td>
                    <td className="cell-spacer"><div className="spacer-content"></div></td>
                    <td className="cell-val">{getNumber(row[3])}</td>
                </tr>
            ); */
            return(
                <div key={idx} className={`tablecontentrow ${(rowobj.styling.underlined)? "underlined-row": ""} ${(rowobj.styling.bold)? "bold-row": ""} ${(rowobj.styling.special)? "special-row": ""} ${(rowobj.styling.colored)? "colored-row": ""} ${(rowobj.styling.none)? "none-row": ""} ${(rowobj.styling.highlighted)? "highlighted-row": ""}`}>
                    <div className="tablecellwide">
                        <div className="possiblecontent-enum">{}</div>
                        <div className="possiblecontent-title">{row[0]}</div>
                    </div>
                    <div className="tablecellspacer"></div>
                    <div className="tablecellnumber">{getNumber(row[1], false)}</div>
                    <div className="tablecellspacer"></div>
                    <div className="tablecellnumber">{getNumber(row[2], false)}</div>
                    <div className="tablecellspacer"></div>
                    <div className="tablecellnumber">{getNumber(row[3], false)}</div>
                </div>
            );
        });


    }

    /* return(
        <div className="presentation-page">
            <table>
                <thead>
                    <tr>
                        <th className="cell-headline"></th>
                        <th className="empty-headline-cell cell-spacer"></th>
                        <th className="cell-headline">{currentYear}</th>
                        <th className="empty-headline-cell cell-spacer"></th>
                        <th className="cell-headline">{currentYear-1}</th>
                        <th className="empty-headline-cell cell-spacer"></th>
                        <th className="cell-headline">+/-</th>
                    </tr>
                </thead>
                <tbody>
                    <tr className="euro-row">
                        <td></td>
                        <td className="cell-spacer"></td>
                        <td>T€</td>
                        <td className="cell-spacer"></td>
                        <td>T€</td>
                        <td className="cell-spacer"></td>
                        <td>T€</td>
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
                    <div className="tablecell tablecellspacer"></div>
                    <div className="tablecell">{currentYear-1}</div>
                    <div className="tablecell tablecellspacer"></div>
                    <div className="tablecell">{currentYear-2}</div>
                    <div className="tablecell tablecellspacer"></div>
                    <div className="tablecell">+/-</div>
                </div>

                <div className="tableeurorow">
                    <div className="tablecellwide"></div>
                    <div className="tablecellspacer"></div>
                    <div className="tablecellnumber">T€</div>
                    <div className="tablecellspacer"></div>
                    <div className="tablecellnumber">T€</div>
                    <div className="tablecellspacer"></div>
                    <div className="tablecellnumber">T€</div>
                </div>

                {getTableContent()}
            </div>
        </div>
    );
}