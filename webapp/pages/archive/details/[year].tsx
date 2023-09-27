import Layout from "@/components/layout/layout";
import "./style.scss"
import { GetServerSideProps } from "next";
import { Card, List, Space, Button, Form, Alert, Modal, Upload, Tag, Input, Typography } from "antd"
import { SyntheticEvent, useRef, useState } from "react";
import Link from "next/link";
import axios, { AxiosError, AxiosResponse, isAxiosError } from "axios";
import { prisma } from '../../../db';
import { Role, User } from "@prisma/client";
import { useRouter } from "next/router";
import { fileobjs } from "@/helper/uploadRepresentation";
import { FileExcelOutlined, TableOutlined, UploadOutlined } from '@ant-design/icons';
import { RcFile } from "antd/es/upload";
import { ParsedRole, UserRights } from "@/helper/user";
const { Paragraph } = Typography;

//Define a type for the cookie
type LocalUser = {
    username: string;
    email: string;
    role: ParsedRole;
};

type Files = {
    id: number;
    year: number;
    status: string;
    commentary: string;
    responsible: User;
}
  
interface InitialProps {
    InitialState: LocalUser;
    Files: Array<Files> | undefined;
    currentData: Files;
    year: number,
}

type FileObjKey = "guv" | "konzernbilanz" | "eigenkapitalspiegel" | "kapitalfluss" | "anlagengitter" | "rueckstellung" | "verbindlichkeiten"  | "lagebericht" | "anhang";
type ErrorCode = "XMIMETYPE" | "XSIZE" | "XINVALID" | "OK" | "GENERIC";
type FileError = {
    "code": ErrorCode,
    "message": string,
}

type Fileobj = {
    "guv": undefined | File,
    "konzernbilanz": undefined | File,
    "eigenkapitalspiegel": undefined | File,
    "kapitalfluss": undefined | File,
    "anlagengitter": undefined | File,
    "rueckstellung": undefined | File,
    "verbindlichkeiten": undefined | File,
    "lagebericht": undefined | File,
    "anhang": undefined | File
}

type FileobjErr = {
    "guv": undefined | FileError,
    "konzernbilanz": undefined | FileError,
    "eigenkapitalspiegel": undefined | FileError,
    "kapitalfluss": undefined | FileError,
    "anlagengitter": undefined | FileError,
    "rueckstellung": undefined | FileError,
    "verbindlichkeiten": undefined | FileError,
    "lagebericht": undefined | FileError,
    "anhang": undefined | FileError,
    "generic": undefined | FileError,
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

        let userobj: LocalUser = JSON.parse(Buffer.from(cookies.login, "base64").toString("ascii"));

        if(userobj.role.capabilities.canUnfreeze || userobj.role.capabilities.canUploadFiles){
            let currentData = null
            const year = new Date().getFullYear();
            let files: Array<Files> | null = await prisma.files.findMany({include: {responsible: true}});
            if(!files){
                files = null;
            }else{
                currentData = files.find((fileobj) => {
                    return fileobj.year == year;
                })
            }

            if(!currentData){
                currentData = {id: -1, year: -1, status: "undefined", responsible: {id: -1, name: "", email: ""}};
            }

            return {
                props: {
                    InitialState: userobj,
                    Files: files,
                    currentData: currentData,
                    year: qyear
                },
            };
        }else{
            res.writeHead(302, { Location: "/" });
            res.end();

            return { props: { InitialState: {} } };
        }
    }
};


export default function UploadPage(props: InitialProps){
    const router = useRouter();
    const year = props.year;

    const getFileOptions = (fileobjs: Array<{text: string, links: { file: string, representations: Array<{ urlobj: string, name: string, icon: string }> }}>) => {
        
        return fileobjs.map((fileobj, idx) => {
                return(

                    <Card
                        key={idx}
                        title={fileobj.text}
                        style={{
                            width: "100%"
                        }}
                        >
                        <List
                            itemLayout="horizontal"
                            dataSource={[{urlobj: `/data/${year}/${fileobj.links.file}`, name: "Datei", icon: "excel"}, ...fileobj.links.representations]}
                            renderItem={(item: {urlobj: string, name: string, icon: any}, index: number) => (
                            <List.Item>
                                <List.Item.Meta
                                    avatar={(item.icon == "excel")? <FileExcelOutlined />: <TableOutlined />}
                                    title={(item.name == "Datei")? <Link href={`${item.urlobj}`} target="_blank">{item.name}</Link>: <Link href={`${item.urlobj}/${year}`} target="_blank">{item.name}</Link>}
                                    description=""
                                />
                            </List.Item>
                            )}
                        />
                    </Card>
                );
        })
    }

    const getPresentation = () => {
        if(props.currentData.id != -1){
            return(
                <div className="data-list">
                    <Space size="large" direction="vertical" style={{
                            width: "100%"
                    }}>
                        {getFileOptions(fileobjs)}
                    </Space>
                </div>
            );
        }else{
            return (
                <div className="no-data-notice">
                    Für das aktuelle Jahr wurden noch keine Daten hochgeladen. Wenn Sie Daten aus den vorherigen Jahren suchen finden Sie diese im <Link href="/href">Archiv</Link>
                </div>
            );
        }
    }


    const getTag = (status: string) => {
        console.log(status);
        if(status == "erstellt"){
            return(<Tag color="processing" style={{marginLeft: 20}}>Erstellt</Tag>);
        }else if(status == "freigegeben"){
            return(<Tag color="success" style={{marginLeft: 20}}>Freigegeben</Tag>);
        }else if(status == "revision"){
            return(<Tag color="error" style={{marginLeft: 20}}>Revision nötig</Tag>);
        }else{
            return <></>;
        }
    }


    return(
        <div>
            <Layout user={props.InitialState}>
                <div className="content">
                    <Space style={{marginBottom: 50}} direction="horizontal" size="large">
                    </Space>

                    <div className="data-presentation">
                        <div className="data-headline"><h2 className="page-headline">Daten Geschäftsbericht {year}</h2>{getTag(props.currentData.status)}</div>
                        {getPresentation()}
                    </div>
                </div>
            </Layout>
        </div>
    );

}