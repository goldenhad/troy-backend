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
        const path = `./public/data/${year}/kapitalfluss.xlsx`;
        let guvdata: Array<any> = [1, 2, 3];
        if(fs.existsSync(path)){

            const buffer = fs.readFileSync(path);
            const workbook = read(buffer);

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
                        bold: false
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

            const boldrows = [18, 25, 28];
            const colorsrows = [37];

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

export default function Kapitalfluss(props: InitialProps){
    const currentYear = new Date().getFullYear();

    const getTableContent = () => {

        return props.data.map((rowobj, idx) => {

            let row = rowobj.columns;

            let allempty = row.every((v: any) => v === null );

            console.log(rowobj.styling);

            return (
                <tr key={idx} className={`bordered-row ${(allempty)? "row-spacer": ""} ${(rowobj.styling.bold)? "bold-row": ""} ${(rowobj.styling.colored)? "colored-row": ""}`}>
                    <td className="row-meaning">{row[0]}</td>
                    <td className="cell-spacer"><div className="spacer-content"></div></td>
                    <td className="cell-val">{getNumber(row[1])}</td>
                    <td className="cell-spacer"><div className="spacer-content"></div></td>
                    <td className="cell-val">{getNumber(row[2])}</td>
                    <td className="cell-spacer"><div className="spacer-content"></div></td>
                    <td className="cell-val">{getNumber(row[3])}</td>
                </tr>
            );
        });


    }

    return(
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
    );
}