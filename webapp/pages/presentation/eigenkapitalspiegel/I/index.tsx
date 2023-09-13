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

        const year = new Date().getFullYear();
        const path = `./public/data/${year}/eigenkapitalspiegel.xlsx`;
        let guvdata: Array<any> = [1, 2, 3];
        if(fs.existsSync(path)){

            const buffer = fs.readFileSync(path);
            const workbook = read(buffer);

            const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

            const cols: Array<String> = alphabet.slice(0, 13).split("");
            const lowerLimit = 19;
            const higherLimit = 28;

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
                    let val = workbook.Sheets['EK Spiegel nach DRS 22'][col.concat(r.toString())];
                    if(val){
                        rowobj.columns.push(val.v);
                    }else{
                        rowobj.columns.push(null);
                    }
                });

                rows.push(rowobj);
            }

            const boldrows = [19, 28];
            const underlinedrows = [19,26, 27];

            boldrows.forEach((row) => {
                rows[row-lowerLimit].styling.bold = true;
            })

            underlinedrows.forEach((row) => {
                rows[row-lowerLimit].styling.underlined = true;
            })

            guvdata = rows;
        }

        return {
            props: {
                InitialState: JSON.parse(
                Buffer.from(cookies.login, "base64").toString("ascii")
                ),
                data: guvdata,
            },
        };
    }
};

export default function Eigenkapitelspiegel(props: InitialProps){

    const getTableContent = () => {

        return props.data.map((rowobj, idx) => {

            let row = rowobj.columns;

            let allempty = row.every((v: any) => v === null );

            console.log(rowobj)

            if(!allempty){
                return (
                    <tr key={idx} className={`bordered-row ${(allempty)? "row-spacer": ""} ${(rowobj.styling.bold)? "bold-row": ""} ${(rowobj.styling.underlined)? "underlined-row": ""} ${(rowobj.styling.colored)? "colored-row": ""} ${(rowobj.styling.highlighted)? "highlighted-row": ""} ${(rowobj.styling.special)? "special-row": ""}`.replace(/\s+/g,' ').trim()}>
                        <td className="row-meaning">{row[0]}</td>
                        <td className="cell-spacer"><div className="spacer-content"></div></td>
                        <td className="cell-val">{getNumber(row[1], true)}</td>
                        <td className="cell-spacer"><div className="spacer-content"></div></td>
                        <td className="cell-val">{getNumber(row[2], true)}</td>
                        <td className="cell-spacer"><div className="spacer-content"></div></td>
                        <td className="cell-val">{getNumber(row[3], true)}</td>
                        <td className="cell-spacer"><div className="spacer-content"></div></td>
                        <td className="cell-val">{getNumber(row[4], true)}</td>
                        <td className="cell-spacer"><div className="spacer-content"></div></td>
                        <td className="cell-val">{getNumber(row[5], true)}</td>
                        <td className="cell-spacer"><div className="spacer-content"></div></td>
                        <td className="cell-val">{getNumber(row[6], true)}</td>
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
                        <th className="empty-headline-cell"></th>
                        <th className="empty-headline-cell"></th>
                        <th colSpan={11} className="cell-headline">Eigenkapital des Mutterunternehmens</th>
                        <th className="empty-headline-cell cell-spacer"></th>
                    </tr>
                </thead>
                <tbody>
                    <tr className="small-row">

                    </tr>
                    <tr className="euro-row">
                        <td className="empty-headline-cell"></td>
                        <td className="cell-spacer empty-headline-cell"><div className="spacer-content"></div></td>
                        <td>Geschäftsguthaben</td>
                        <td colSpan={9} className="long-cell">Ergebnisrücklagen</td>
                        <td>Bilanzgewinn</td>
                    </tr>
                    <tr className="special-headline-row no-border">
                        <td></td>
                        <td className="cell-spacer"><div className="spacer-content"></div></td>
                        <td className="cell-spacer"><div className="spacer-content"></div></td>
                        <td className="cell-spacer"><div className="spacer-content"></div></td>
                        <td></td>
                        <td className="cell-spacer"><div className="spacer-content"></div></td>
                        <td></td>
                        <td className="cell-spacer"><div className="spacer-content"></div></td>
                        <td></td>
                        <td className="cell-spacer"><div className="spacer-content"></div></td>
                        <td></td>
                        <td className="cell-spacer"><div className="spacer-content"></div></td>
                        <td></td>
                    </tr>
                    <tr className="special-headline-row">
                        <td></td>
                        <td className="cell-spacer"><div className="spacer-content"></div></td>
                        <td className="cell-spacer"><div className="spacer-content"></div></td>
                        <td className="cell-spacer"><div className="spacer-content"></div></td>
                        <td>Gesetzliche Rücklage</td>
                        <td className="cell-spacer"><div className="spacer-content"></div></td>
                        <td>Bauerneuerungsrücklage</td>
                        <td className="cell-spacer"><div className="spacer-content"></div></td>
                        <td>Andere Ergebnisrücklagen</td>
                        <td className="cell-spacer"><div className="spacer-content"></div></td>
                        <td>Summe</td>
                        <td className="cell-spacer"><div className="spacer-content"></div></td>
                        <td></td>
                    </tr>
                    <tr className="currency-row">
                        <td></td>
                        <td className="cell-spacer"><div className="spacer-content"></div></td>
                        <td>€</td>
                        <td className="cell-spacer"><div className="spacer-content"></div></td>
                        <td>€</td>
                        <td className="cell-spacer"><div className="spacer-content"></div></td>
                        <td>€</td>
                        <td className="cell-spacer"><div className="spacer-content"></div></td>
                        <td>€</td>
                        <td className="cell-spacer"><div className="spacer-content"></div></td>
                        <td>€</td>
                        <td className="cell-spacer"><div className="spacer-content"></div></td>
                        <td>€</td>
                    </tr>
                    <tr className="row-spacer"></tr>
                    {getTableContent()}
                </tbody>
            </table>
        </div>
    );
}