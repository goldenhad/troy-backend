import "./style.scss"
import { GetServerSideProps } from "next";
import fs from 'fs';
import { read } from 'xlsx';
import { User } from '../../../helper/user'
import getNumber from "@/helper/numberformat";

type StylingProps = {
    bold: boolean,
    colored: boolean
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
            const lowerLimit = 10;
            const higherLimit = 28;

            let rows: Array<RowObject> = [];

            for(let r=lowerLimit; r<= higherLimit; r++){
                let rowobj: RowObject = {
                    columns: [],
                    styling: {
                        colored: false,
                        bold: false
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

            const boldrows = [28];
            const colorsrows = [10, 19, 28];

            boldrows.forEach((row) => {
                rows[row-lowerLimit].styling.bold = true;
            })

            colorsrows.forEach((row) => {
                rows[row-lowerLimit].styling.colored = true;
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

            console.log(rowobj.styling);

            return (
                <tr key={idx} className={`bordered-row ${(allempty)? "row-spacer": ""} ${(rowobj.styling.bold)? "bold-row": ""} ${(rowobj.styling.colored)? "colored-row": ""}`}>
                    <td className="row-meaning">{row[0]}</td>
                    <td className="cell-val">{getNumber(row[1])}</td>
                    <td className="cell-val">{getNumber(row[2])}</td>
                    <td className="cell-val">{getNumber(row[3])}</td>
                    <td className="cell-val">{getNumber(row[4])}</td>
                    <td className="cell-val">{getNumber(row[5])}</td>
                    <td className="cell-val">{getNumber(row[6])}</td>
                    <td className="cell-spacer"><div className="spacer-content"></div></td>
                    <td className="cell-val">{getNumber(row[8])}</td>
                    <td className="cell-val">{getNumber(row[9])}</td>
                    <td className="cell-val">{getNumber(row[10])}</td>
                    <td className="cell-spacer"><div className="spacer-content"></div></td>
                    <td className="cell-val">{getNumber(row[12])}</td>
                </tr>
            );
        });


    }

    return(
        <div className="presentation-page">
            <table>
                <thead>
                    <tr>
                        <th className="empty-headline-cell"></th>
                        <th colSpan={6} className="cell-headline">Eigenkapital des Mutterunternehmens</th>
                        <th className="empty-headline-cell cell-spacer"></th>
                        <th colSpan={3} className="cell-headline">Nicht beherrschbare Anteile</th>
                        <th className="empty-headline-cell cell-spacer"></th>
                        <th className="cell-headline">Konzerneigenkapital</th>
                    </tr>
                </thead>
                <tbody>
                    <tr className="euro-row">
                        <td></td>
                        <td>Geschäftsguthaben</td>
                        <td className="special-spacer-row">Ergebnisrücklagen</td>
                        <td className="special-spacer-row"></td>
                        <td className="special-spacer-row"></td>
                        <td className="special-spacer-row"></td>
                        <td>Bilanzgewinn</td>
                        <td className="cell-spacer"></td>
                        <td>am Kapital</td>
                        <td>am Jahresüberschuss</td>
                        <td>Summe</td>
                        <td className="cell-spacer"></td>
                        <td></td>
                    </tr>
                    <tr className="euro-row">
                        <td></td>
                        <td></td>
                        <td>Gesetzliche Rücklage</td>
                        <td>Bauerneuerungsrücklage</td>
                        <td>Andere Ergebnisrücklagen</td>
                        <td>Summe</td>
                        <td></td>
                        <td className="cell-spacer"></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td className="cell-spacer"></td>
                        <td></td>
                    </tr>
                    <tr className="euro-row">
                        <td></td>
                        <td>€</td>
                        <td>€</td>
                        <td>€</td>
                        <td>€</td>
                        <td>€</td>
                        <td>€</td>
                        <td className="cell-spacer"></td>
                        <td>€</td>
                        <td>€</td>
                        <td>€</td>
                        <td className="cell-spacer"></td>
                        <td>€</td>
                    </tr>
                    <tr className="row-spacer"></tr>
                    {getTableContent()}
                </tbody>
            </table>
        </div>
    );
}