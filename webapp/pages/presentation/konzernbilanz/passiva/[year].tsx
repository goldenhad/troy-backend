import "./style.scss"
import { GetServerSideProps } from "next";
import fs from 'fs';
import { read } from 'xlsx';
import { User } from '../../../../helper/user'
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
    scale: boolean;
}

const FILEREF = 'konzernbilanz';

async function parseFile(path: string){
    const buffer = fs.readFileSync(path);
        const decryptedbuffer = await decrypt(buffer);
        const workbook = read(decryptedbuffer);

        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

        const cols: Array<String> = alphabet.slice(0, 7).split("");
        const lowerLimit = 9;
        const higherLimit = 55;

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
                let val = workbook.Sheets['Passiva'][col.concat(r.toString())];
                if(val){
                    rowobj.columns.push(val.v);
                }else{
                    rowobj.columns.push(null);
                }
            });

            rows.push(rowobj);
        }

        const underlinedrows = [9, 11, 14, 20, 22, 29, 36, 49, 51];
        const boldrows = [18, 26, 34, 46]
        const highlightedrow = [16, 23, 32, 38, 42, 43,];
        const colorsrows = [53];
        const specialrow: Array<any> = [55];

        specialrow.forEach((row) => {
            rows[row-lowerLimit].styling.special = true;
        })

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
        const path = `./public/data/${year}/${FILEREF}.xlsx`;
        let guvdata: Array<any> = [1, 2, 3];
        if(fs.existsSync(path)){
    
            guvdata = await parseFile(path);
        
    
            return {
                props: {
                    InitialState: {},
                    data: guvdata,
                    scale: (ctx.query.scaled)? ctx.query.scaled=="1": false
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

export default function KonzernbilanzII(props: InitialProps){
    const currentYear = new Date().getFullYear();

    const getTableContent = () => {

        return props.data.map((rowobj, idx) => {
            let row = rowobj.columns;
            let allempty = row.every((v: any) => v === null ) || (row[3] == 0 && row[6] == 0);

            if(row[0] == "Eigenkapital insgesamt" || row[0] == "Bilanzsumme" || row[0] == "Treuhandverbindlichkeiten"  ){
                row[2] = row[0];
                row[0] = "";
            }
            
            /* return (
                <tr key={idx} className={`bordered-row ${(allempty)? "row-spacer": ""} ${(rowobj.styling.bold)? "bold-row": ""} ${(rowobj.styling.underlined)? "underlined-row": ""} ${(rowobj.styling.colored)? "colored-row": ""} ${(rowobj.styling.highlighted)? "highlighted-row": ""} ${(rowobj.styling.special)? "special-row": ""}`.replace(/\s+/g,' ').trim()}>
                    <td className="cell-enum">{row[0]}</td>
                    <td className="cell-add">{row[1]}</td>
                    <td className="cell-title">{row[2]}</td>
                    <td className="cell-spacer"><div className="spacer-content"></div></td>
                    <td className="cell-val">{getNumber(row[3])}</td>
                    <td className="cell-spacer"><div className="spacer-content"></div></td>
                    <td className="cell-val">{getNumber(row[4])}</td>
                    <td className="cell-spacer"><div className="spacer-content"></div></td>
                    <td className="cell-val">{getNumber(row[6])}</td>
                </tr>
            ); */
            if(!allempty){
                return (
                    <div key={idx} className={`tablecontentrow ${(rowobj.styling.underlined)? "underlined-row": ""} ${(rowobj.styling.bold)? "bold-row": ""} ${(rowobj.styling.special)? "special-row": ""} ${(rowobj.styling.colored)? "colored-row": ""} ${(rowobj.styling.none)? "none-row": ""}`}>
                        <div className="tablecellwide">
                            <div className="possiblecontent-enum">{row[0]}</div>
                            <div className="possiblecontent-count">{row[1]}</div>
                            <div className="possiblecontent-title">{row[2]}</div>
                        </div>
                        <div className="tablecellspacer"></div>
                        <div className="tablecellnumber">{getNumber(row[3], false)}</div>
                        <div className="tablecellspacer"></div>
                        <div className="tablecellnumber">{getNumber(row[4], false)}</div>
                        <div className="tablecellspacer"></div>
                        <div className="tablecellnumber">{getNumber(row[6], false)}</div>
                    </div>
                );
            }
        });


    }

    return(
        <div className="presentation-page" style={{zoom: (props.scale)? 0.6: 1}}>
            <div className="tablestructure">
                <div className="tableheadlinerow">
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