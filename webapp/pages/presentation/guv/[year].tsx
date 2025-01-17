import Image from "next/image";
import "./style.scss"
import axios, { all } from "axios";
import router from "next/router";
import { GetServerSideProps } from "next";
import fs from 'fs';
import { read, write, writeFile } from 'xlsx';
import { User } from '../../../helper/user'
import getNumber from "@/helper/numberformat";
import * as openpgp from 'openpgp';
import { decrypt } from "@/helper/decryptFile";
import yearPublished from "@/helper/filefunctions";


type StylingProps = {
    highlighted: boolean;
    bold: boolean,
    colored: boolean,
    underlined: boolean,
    special: boolean,
    noUnderline: boolean
}

type RowObject = {
    columns: Array<any>;
    styling: StylingProps;
}

interface InitialProps {
    InitialState: User;
    data: Array<any>;
}

const FILEREF = 'guv';
const lowerLimit = 9;
const higherLimit = 63;

async function parseFile(path: string){
    const buffer = fs.readFileSync(path);
    const decryptedbuffer = await decrypt(buffer);
    const workbook = read(decryptedbuffer);

    const cols: Array<String> = ["A", "B", "C", "D", "E", "F"];
    

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
                noUnderline: false
            }
        }

        if(r != -1){
            cols.forEach((col) => {
                let val = workbook.Sheets['GuV Deckblatt'][col.concat(r.toString())];
                if(val && val.v){
                    rowobj.columns.push(val.v);
                }else{
                    rowobj.columns.push(null);
                }
            });
        }

        rows.push(rowobj);
    }

    const boldrows = [52, 56];
    const colorsrows = [58, 63];
    const underlinedrows = [50, 52, 54, 55, 56];
    const specialrows = [13, 26, 30];
    const highlightedrow: Array<number> = [];
    const noUnderlineRows = [48, 57, 62];

    boldrows.forEach((row) => {
        rows[row-lowerLimit].styling.bold = true;
    })

    colorsrows.forEach((row) => {
        rows[row-lowerLimit].styling.colored = true;
    })

    underlinedrows.forEach((row) => {
        rows[row-lowerLimit].styling.underlined = true;
    })

    specialrows.forEach((row) => {
        rows[row-lowerLimit].styling.special = true;
    })

    highlightedrow.forEach((row) => {
        rows[row-lowerLimit].styling.highlighted = true;
    })

    noUnderlineRows.forEach((row) => {
        rows[row-lowerLimit].styling.noUnderline = true;
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
        const path = `./public/data/${year}/${FILEREF}.xlsx`;
        let guvdata: Array<any> = [1, 2, 3];
        if(fs.existsSync(path)){
    
            guvdata = await parseFile(path);
        

            console.log(guvdata[6]);
    
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

export default function Guv(props: InitialProps){

    const getTableContent = () => {

        return props.data.map((rowobj, idx) => {

            let row = rowobj.columns;

            let allempty = row.every((v: any) => v === null ) || (row[0] == null && row[1] != null && row[2] == null && row[5] == null) || (row[2] == 0 && row[5] == 0) || (row[1] && row[1].includes("0,00 €") && !row[2] && !row[5]);

            if(rowobj.styling.special){
                if(!allempty){
                    return (
                        <>
                            <div key={idx} data-id={idx+lowerLimit} className={`tablecontentrow ${(rowobj.styling.underlined)? "underlined-row": ""} ${(rowobj.styling.bold)? "bold-row": ""} ${(rowobj.styling.special)? "special-row": ""} ${(rowobj.styling.colored)? "colored-row": ""} ${(rowobj.styling.none)? "none-row": ""} ${(rowobj.styling.highlighted)? "highlighted-row": ""} ${(rowobj.styling.noUnderline)? "nounderline": ""}`}>
                                <div className="tablecellwide">
                                    <div className="possiblecontent-enum">{row[0]}</div>
                                    <div className="possiblecontent-count">{}</div>
                                    <div className="possiblecontent-title">{row[1]}</div>
                                </div>
                                <div className="tablecellspacer"></div>
                                <div className="tablecellnumber">{getNumber(row[2], false)}</div>
                                <div className="tablecellspacer"></div>
                                <div className="tablecellnumber"></div>
                                <div className="tablecellspacer"></div>
                                <div className="tablecellnumber">{getNumber(row[5], false)}</div>
                            </div>
                            <div key={idx + 9999} data-id={idx+lowerLimit} className={`tablecontentrow disaligned-row`}>
                                <div className="tablecellwide">
                                    <div className="possiblecontent-enum"></div>
                                    <div className="possiblecontent-count">{}</div>
                                    <div className="possiblecontent-title"></div>
                                </div>
                                <div className="tablecellspacer"></div>
                                <div className="tablecellnumber"></div>
                                <div className="tablecellspacer"></div>
                                <div className="tablecellnumber">{getNumber(row[3], false)}</div>
                                <div className="tablecellspacer"></div>
                                <div className="tablecellnumber"></div>
                            </div>
                        </>
                    );
                }
            }else{
                if(!allempty){
                    return(
                        <div key={idx} data-id={idx+lowerLimit} className={`tablecontentrow ${(rowobj.styling.underlined)? "underlined-row": ""} ${(rowobj.styling.bold)? "bold-row": ""} ${(rowobj.styling.special)? "special-row": ""} ${(rowobj.styling.colored)? "colored-row": ""} ${(rowobj.styling.none)? "none-row": ""} ${(rowobj.styling.highlighted)? "highlighted-row": ""} ${(rowobj.styling.noUnderline)? "nounderline": ""}`}>
                            <div className="tablecellwide">
                                <div className="possiblecontent-enum">{row[0]}</div>
                                <div className="possiblecontent-count">{}</div>
                                <div className="possiblecontent-title">{row[1]}</div>
                            </div>
                            <div className="tablecellspacer"></div>
                            <div className="tablecellnumber">{getNumber(row[2], false)}</div>
                            <div className="tablecellspacer"></div>
                            <div className="tablecellnumber">{getNumber(row[3], false)}</div>
                            <div className="tablecellspacer"></div>
                            <div className="tablecellnumber">{getNumber(row[5], false)}</div>
                        </div>
                    );
                }
            }

            
        });


    }

    return(
        <div className="presentation-page">
            <div className="tablestructure">
                <div className="tableheadlinerow">
                        <div className="tablecellwide"></div>
                        <div className="tablecellfiller"></div>
                        <div className="tablecell"></div>
                        <div className="tablecell tablecellfiller"></div>
                        <div className="tablecell">Geschäftsjahr</div>
                        <div className="tablecell tablecellspacer"></div>
                        <div className="tablecell">Vorjahr</div>
                    </div>

                <div className="tableeurorow">
                    <div className="tablecellwide"></div>
                    <div className="tablecellspacer"></div>
                    <div className="tablecellnumber">€</div>
                    <div className="tablecellspacer"></div>
                    <div className="tablecellnumber">€</div>
                    <div className="tablecellspacer"></div>
                    <div className="tablecellnumber">€</div>
                </div>

                {getTableContent()}
            </div>
        </div>
    );


}