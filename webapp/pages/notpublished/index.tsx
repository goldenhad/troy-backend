import "./notpublished.module.scss"
import { GetServerSideProps } from "next";
import fs from 'fs';
import { read } from 'xlsx';
import { User } from '../../helper/user'
import getNumber from "@/helper/numberformat";
import { decrypt } from "@/helper/decryptFile";
import yearPublished from "@/helper/filefunctions";
import { Result } from "antd";

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

    return { props: { InitialState: {} } };
};

export default function NotPublished(props: InitialProps){
    
    return(
        <div className="content-blocked">
            <Result
                status="warning"
                title="Die angeforderten Daten sind nicht verfügbar!"
            />
        </div>
    );
}