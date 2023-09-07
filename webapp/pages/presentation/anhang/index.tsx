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
        const path = `./public/data/${year}/anhang.xlsx`;
        let guvdata: Array<any> = [1, 2, 3];
        if(fs.existsSync(path)){

            const buffer = fs.readFileSync(path);
            const workbook = read(buffer);

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
                        bold: false
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
    const currentYear = new Date().getFullYear();

    const getTableContent = () => {

        return props.data.map((rowobj, idx) => {

            let row = rowobj.columns;

            let allempty = row.every((v: any) => v === null );


            return (
                <tr key={idx} className={`bordered-row ${(allempty)? "row-spacer": ""} ${(rowobj.styling.bold)? "bold-row": ""} ${(rowobj.styling.colored)? "colored-row": ""}`}>
                    <td className="row-meaning">{row[0]}</td>
                    <td className="cell-spacer"><div className="spacer-content"></div></td>
                    <td className="cell-val">{getNumber(row[1])}</td>
                    <td className="cell-spacer"><div className="spacer-content"></div></td>
                    <td className="cell-val">{getNumber(row[2])}</td>
                    <td className="cell-spacer"><div className="spacer-content"></div></td>
                    <td className="cell-val">{getNumber(row[3])}</td>
                    <td className="cell-spacer"><div className="spacer-content"></div></td>
                    <td className="cell-val">{getNumber(row[4])}</td>
                    <td className="cell-spacer"><div className="spacer-content"></div></td>
                    <td className="cell-val">{getNumber(row[6])}</td>
                    <td className="cell-spacer"><div className="spacer-content"></div></td>
                    <td className="cell-val darker-cell">{getNumber(row[7])}</td>
                    <td className="cell-spacer darker-cell"><div className="spacer-content"></div></td>
                    <td className="cell-val darker-cell">{getNumber(row[9])}</td>
                    <td className="cell-spacer darker-cell"><div className="spacer-content"></div></td>
                    <td className="cell-val darker-cell">{getNumber(row[11])}</td>
                    <td className="cell-spacer darker-cell"><div className="spacer-content"></div></td>
                    <td className="cell-val darker-cell">{getNumber(row[12])}</td>
                    <td className="cell-spacer darker-cell"><div className="spacer-content"></div></td>
                    <td className="cell-val darker-cell">{getNumber(row[13])}</td>
                    <td className="cell-spacer"><div className="spacer-content"></div></td>
                    <td className="cell-val special-cell">{getNumber(row[14])}</td>
                </tr>
            );
        });


    }

    return(
        <div className="presentation-page">
            <table>
                <thead>
                    <tr>
                        <th className="cell-headline table-headline">Anlagenspiegel {currentYear}</th>
                        <th className="ecell-spacer"></th>
                        <th className="cell-headline">AK/HK 01.01.{currentYear}</th>
                        <th className="cell-spacer"></th>
                        <th className="cell-headline">Zugänge</th>
                        <th className="cell-spacer"></th>
                        <th className="cell-headline">Abgänge</th>
                        <th className="cell-spacer"></th>
                        <th className="cell-headline">Umbuchungen</th>
                        <th className="cell-spacer"></th>
                        <th className="cell-headline">AK/HK 31.12.{currentYear}</th>
                        <th className="empty-headline-cell cell-spacer"></th>
                        <th className="cell-headline darker-headline">Abschreibungen (kumuliert) 01.01.{currentYear}</th>
                        <th className="cell-spacer darker-headline"></th>
                        <th className="cell-headline darker-headline">Abschreibungen des Geschäftsjahres</th>
                        <th className="cell-spacer darker-headline"></th>
                        <th className="cell-headline darker-headline">Änderungen im Zusammenhang mit Abgängen</th>
                        <th className="cell-spacer darker-headline"></th>
                        <th className="cell-headline darker-headline">Abschreibungen (kumuliert) 31.12.{currentYear}</th>
                        <th className="cell-spacer darker-headline"></th>
                        <th className="cell-headline darker-headline">Buchwert 31.12.{currentYear}</th>
                        <th className="empty-headline-cell cell-spacer"></th>
                        <th className="cell-headline special-headline">Buchwert Vohrjahr</th>
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
                        <td>€</td>
                    </tr>
                    {getTableContent()}
                </tbody>
            </table>
        </div>
    );
}