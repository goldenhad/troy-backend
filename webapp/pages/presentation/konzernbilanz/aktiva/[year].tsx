import "./style.scss"
import { GetServerSideProps } from "next";
import fs from 'fs';
import { read } from 'xlsx';
import { User } from '../../../../helper/user'
import getNumber from "@/helper/numberformat";

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
        const path = `./public/data/${year}/konzernbilanz.xlsx`;
        let guvdata: Array<any> = [1, 2, 3];
        if(fs.existsSync(path)){

            const buffer = fs.readFileSync(path);
            const workbook = read(buffer);

            const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

            const cols: Array<String> = alphabet.slice(0, 7).split("");
            const lowerLimit = 7;
            const higherLimit = 58;

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
                    let val = workbook.Sheets['Aktiva'][col.concat(r.toString())];
                    if(val){
                        rowobj.columns.push(val.v);
                    }else{
                        rowobj.columns.push(null);
                    }
                });

                rows.push(rowobj);
            }

            const underlinedrows = [7, 9, 11, 25, 32, 35, 37, 43, 50, 54];
            const boldrows = [23, 30, 41, 48]
            const highlightedrow = [12, 18, 19, 44];
            const colorsrows = [56];
            const specialrow = [22, 29, 40, 47];

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

export default function KonzernbilanzI(props: InitialProps){
    const currentYear = new Date().getFullYear();

    const getTableContent = () => {

        return props.data.map((rowobj, idx) => {
            let row = rowobj.columns;
            let allempty = row.every((v: any) => v === null );

            if(row[0] == "Anlagevermögen insgesamt" || row[0] == "Bilanzsumme" || row[0] == "Treuhandvermögen"  ){
                row[1] = row[0];
                row[0] = "";
            }
            
            return (
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
            );
        });


    }

    return(
        <div className="presentation-page">
            <table>
                <thead>
                    <tr>
                        <th className="cell-enum"></th>
                        <th className="cell-add-information"></th>
                        <th className="cell-title"></th>
                        <th className="cell-spacer"></th>
                        <th className="cell-headline"></th>
                        <th className="cell-spacer"></th>
                        <th className="cell-headline">Geschäftsjahr</th>
                        <th className="empty-headline-cell cell-spacer"></th>
                        <th className="cell-headline">Vorjahr</th>
                    </tr>
                </thead>
                <tbody>
                    <tr className="euro-row">
                        <td></td>
                        <td></td>
                        <td></td>
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
    );
}