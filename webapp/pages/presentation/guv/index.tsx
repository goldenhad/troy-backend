import Image from "next/image";
import "./style.scss"
import axios from "axios";
import router from "next/router";
import { GetServerSideProps } from "next";
import fs from 'fs';
import { read } from 'xlsx';
import { User } from '../../../helper/user'
import getNumber from "@/helper/numberformat";

type RowObject = {
    columns: Array<any>;
    styling: String;
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
        const path = `./public/data/${year}/guv.xlsx`;
        let guvdata: Array<any> = [1, 2, 3];
        if(fs.existsSync(path)){

            const buffer = fs.readFileSync(path);
            const workbook = read(buffer);

            console.log(workbook.Sheets['GuV Deckblatt']["E14"]);
            const cols: Array<String> = ["A", "B", "C", "D", "E", "F"];
            const lowerLimit = 9;
            const higherLimit = 63;

            let rows: Array<RowObject> = [];

            for(let r=lowerLimit; r<= higherLimit; r++){
                let rowobj: RowObject = {
                    columns: [],
                    styling: ""
                }

                cols.forEach((col) => {
                    let val = workbook.Sheets['GuV Deckblatt'][col.concat(r.toString())];
                    if(val){
                        rowobj.columns.push(val.v);
                    }else{
                        rowobj.columns.push(null);
                    }
                });

                rows.push(rowobj);
            }

            const boldrows = [52, 56];
            const colorsrows = [58, 63];

            boldrows.forEach((row) => {
                rows[row-lowerLimit].styling = "bold";
            })

            colorsrows.forEach((row) => {
                rows[row-lowerLimit].styling = "color";
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

export default function Guv(props: InitialProps){

    const getTableContent = () => {

        return props.data.map((rowobj, idx) => {

            let row = rowobj.columns;

            let allempty = row.every((v: any) => v === null );

            console.log(rowobj.styling);

            return (
                <tr key={idx} className={`bordered-row ${(allempty)? "row-spacer": ""}${(rowobj.styling == "bold")? "bold-row": ""}${(rowobj.styling == "color")? "colored-row": ""}`}>
                    <td className="cell-enum">{row[0]}</td>
                    <td className="cell-content">{row[1]}</td>
                    <td className="cell-numbers">{getNumber(row[2])}</td>
                    <td className="cell-spacer"><div className="spacer-content"></div></td>
                    <td className="cell-numbers">{getNumber(row[3])}</td>
                    <td className="cell-spacer"><div className="spacer-content"></div></td>
                    <td className="cell-numbers">{getNumber(row[5])}</td>
                </tr>
            );
        });


    }

    return(
        <div className="presentation-page">
            <table>
                <thead>
                    <tr>
                        <th className="cell-spacer"></th>
                        <th className="cell-numbers"></th>

                        <th className="cell-numbers"></th>
                        <th className="cell-spacer"></th>
                        <th className="cell-numbers"><div className="headline">Geschäftsjahr</div></th>
                        <th className="cell-spacer"></th>
                        <th className="cell-numbers"><div className="headline">Vorjahr</div></th>
                    </tr>
                </thead>
                <tbody>
                    <tr className="euro-row">
                        <td></td>
                        <td></td>
                        <td className="cell-spacer">€</td>
                        <td></td>
                        <td className="cell-spacer">€</td>
                        <td></td>
                        <td className="cell-spacer">€</td>
                    </tr>
                    <tr className="row-spacer"></tr>
                    {getTableContent()}
                </tbody>
            </table>
        </div>
    );
}