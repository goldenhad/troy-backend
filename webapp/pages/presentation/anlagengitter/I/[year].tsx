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
    special: boolean,
    nounderline: boolean
}

type RowObject = {
    columns: Array<any>;
    styling: StylingProps;
}

interface InitialProps {
    InitialState: User;
    data: Array<any>;
}

const FILEREF = 'anhang';

async function parseFile(path: string){
    const buffer = fs.readFileSync(path);
    const decryptedbuffer = await decrypt(buffer);
    const workbook = read(decryptedbuffer);

    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

    const cols: Array<String> = alphabet.slice(0, 17).split("");
    const lowerLimit = 4;
    const higherLimit = 27;

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
                nounderline: false
            }
        }

        cols.forEach((col) => {
            let val = workbook.Sheets['Anlagespiegel'][col.concat(r.toString())];
            if(val){
                rowobj.columns.push(val.v);
            }else{
                rowobj.columns.push(null);
            }
        });

        rows.push(rowobj);
    }

    const boldrows = [4, 8, 20];
    const colorsrows = [6, 18, 25, 27];
    const highlightedrow: number[] = [];
    const nounderline: number[] = [5]
    const specialrow: Array<any> = [];

    specialrow.forEach((row) => {
        rows[row-lowerLimit].styling.special = true;
    })

    boldrows.forEach((row) => {
        rows[row-lowerLimit].styling.bold = true;
    })

    colorsrows.forEach((row) => {
        rows[row-lowerLimit].styling.colored = true;
    })

    highlightedrow.forEach((row) => {
        rows[row-lowerLimit].styling.highlighted = true;
    })

    nounderline.forEach((row) => {
        rows[row-lowerLimit].styling.nounderline = true;
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

export default function Anlagengitter(props: InitialProps){
    const currentYear = new Date().getFullYear();

    const getTableContent = () => {

        return props.data.map((rowobj, idx) => {

            let row = rowobj.columns;

            let allempty = row.every((v: any) => v === null ) || ( row[1] == 0 && row[2] == 0 && row[3] == 0 && row[4] == 0 && row[6] == 0 );


            if(!allempty){
                return (
                    <div key={idx} className={`tablecontentrow ${(rowobj.styling.underlined)? "underlined-row": ""} ${(rowobj.styling.bold)? "bold-row": ""} ${(rowobj.styling.special)? "special-row": ""} ${(rowobj.styling.highlighted)? "highlighted-row": ""} ${(rowobj.styling.colored)? "colored-row": ""} ${(rowobj.styling.none)? "none-row": ""} ${(rowobj.styling.nounderline)? "nounderline": ""}`}>
                        <div className="tablecellwide">
                            {row[0]}
                        </div>
                        <div className="tablecellspacer"></div>
                        <div className="tablecellnumber">{getNumber(row[1], false)}</div>
                        <div className="tablecellspacer"></div>
                        <div className="tablecellnumber">{getNumber(row[2], false)}</div>
                        <div className="tablecellspacer"></div>
                        <div className="tablecellnumber">{getNumber(row[3], false)}</div>
                        <div className="tablecellspacer"></div>
                        <div className="tablecellnumber">{getNumber(row[4], false)}</div>
                        <div className="tablecellspacer"></div>
                        <div className="tablecellnumber">{getNumber(row[6], false)}</div>
                    </div>
                );
            }else{
                if(idx == 3 || idx == 15){
                    return(<><div></div></>)
                }
                if(idx == 22){
                    return(<><div></div><div></div></>)
                }
            }
        });


    }

    
    return(
        <div className="presentation-page">
            <div className="tablestructure">
                <div className="tableheadlinerow">
                    <div className="tablecellwide">Anlagenspiegel {currentYear-1}</div>
                    <div className="tablecell tablecellspacer"></div>
                    <div className="tablecell">AK/HK 01.01.{currentYear-1}</div>
                    <div className="tablecell tablecellspacer"></div>
                    <div className="tablecell">Zugänge</div>
                    <div className="tablecell tablecellspacer"></div>
                    <div className="tablecell">Abgänge</div>
                    <div className="tablecell tablecellspacer"></div>
                    <div className="tablecell">Umbuchungen</div>
                    <div className="tablecell tablecellspacer"></div>
                    <div className="tablecell">AK/HK 31.12.{currentYear-1}</div>
                </div>

                <div className="tableeurorow">
                    <div className="tablecellwide"></div>
                    <div className="tablecellspacer"></div>
                    <div className="tablecellnumber">€</div>
                    <div className="tablecellspacer"></div>
                    <div className="tablecellnumber">€</div>
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