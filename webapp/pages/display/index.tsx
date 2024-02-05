import Layout from "@/components/layout/layout";
import "./style.scss"
import { GetServerSideProps } from "next";
import { Card, List, Space, Button, Form, Alert, Modal, Upload, Tag, Input, Typography, Collapse } from "antd"
import { SyntheticEvent, useRef, useState } from "react";
import Link from "next/link";
import axios, { AxiosError, AxiosResponse, isAxiosError } from "axios";
import { prisma } from '../../db';
import { Role, User } from "@prisma/client";
import { useRouter } from "next/router";
import { fileobjs } from "@/helper/uploadRepresentation";
import { FileExcelOutlined, TableOutlined, UploadOutlined } from '@ant-design/icons';
import { RcFile } from "antd/es/upload";
import { ParsedRole, UserRights } from "@/helper/user";
import Path from 'path'
const { Paragraph } = Typography;

  
type LocalUser = {
    username: string;
    email: string;
    role: ParsedRole;
};
  
interface InitialProps {
    InitialState: LocalUser;
    table: string;
    year: string;
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
        let userobj: LocalUser = JSON.parse(Buffer.from(cookies.login, "base64").toString("ascii"));
        let reqTable = ctx.query.table;
        let year = ctx.query.year;

        console.log(reqTable);

        return { props: {
            InitialState: userobj, 
            table: reqTable,
            year: year,
        } };
    }
};


export default function DisplayPage(props: InitialProps){
    
    const parseTable = () => {
        let tl = props.table;
        if(tl == "guv" ||
            tl == "konzernbilanz/aktiva" ||
            tl == "konzernbilanz/passiva" ||
            tl == "eigenkapitalspiegel/I" ||
            tl == "eigenkapitalspiegel/II" ||
            tl == "kapitalfluss" ||
            tl == "anlagengitter/I" ||
            tl == "anlagengitter/II" ||
            tl == "rueckstellung" ||
            tl == "verbindlichkeiten" ||
            tl == "lagebericht/bestand" ||
            tl == "lagebericht/neubau" ||
            tl == "lagebericht/ertragslage" ||
            tl == "lagebericht/finanzlage" ||
            tl == "anhang/sonstige/altersversorgung" ||
            tl == "anhang/sonstige/betrieblicheaufwendungen" ||
            tl == "anhang/sonstige/betrieblicheertraege" ||
            tl == "anhang/sonstige/mitarbeiterinnen" ||
            tl == "anhang/umsatzerloes/betreuungstaetigkeit" ||
            tl == "anhang/umsatzerloes/hausbewirtschaftung" ||
            tl == "anhang/umsatzerloes/lieferungenundleistungen"
        ){
            return `/presentation/${tl}/${props.year}?scaled=1`;
        }else{
            return "";
        }
    }

    return(
        <div>
            <Layout user={props.InitialState}>
                <div className="content">
                    <div className="data-presentation">
                        <iframe src={parseTable()} width={912} height={480}></iframe>
                    </div>
                </div>
            </Layout>
        </div>
    );

}