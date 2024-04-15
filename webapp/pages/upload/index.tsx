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
}

type FileObjKey = "guv" | "konzernbilanz" | "eigenkapitalspiegel" | "kapitalfluss" | "anlagengitter" | "rueckstellung" | "verbindlichkeiten"  | "lagebericht" | "anhang" | "kennzahlen";
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
    "anhang": undefined | File,
    "kennzahlen": undefined | File
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
    "kennzahlen": undefined | FileError,
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
                let firstresponsible = await prisma.user.findFirst({where: { roleid: 3 }});
                currentData = {id: -1, year: -1, status: "undefined", responsible: firstresponsible};
            }

            return {
                props: {
                    InitialState: userobj,
                    Files: files,
                    currentData: currentData,
                },
            };
        }else{
            res.writeHead(302, { Location: "/" });
            res.end();

            return { props: { InitialState: {} } };
        }
    }
};

const keyToName = (key: FileObjKey) => {
    switch(key){
        case "guv":
            return "Gewinn und Verlustrechnung";
        case "konzernbilanz":
            return "Konzernbilanz";
        case "eigenkapitalspiegel":
            return "Eigenkapitalspiegel";
        case "kapitalfluss":
            return "Kapitelflussrechnung";
        case "anlagengitter":
            return "Konzernanlagengitter";
        case "rueckstellung":
            return "Rückstellungsspiegel";
        case "verbindlichkeiten":
            return "Verbindindlichkeitenspiegel";
        case "lagebericht":
            return "Datentabelle Lageberericht";
        case "anhang":
            return "Datentabelle Anlage";
        default:
            return "";   
    }
}


export default function UploadPage(props: InitialProps){
    const [dataPresent, setDataPresent ] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [files, setFiles] = useState<Fileobj>({
        "guv": undefined,
        "konzernbilanz": undefined,
        "eigenkapitalspiegel": undefined,
        "kapitalfluss": undefined,
        "anlagengitter": undefined,
        "rueckstellung": undefined,
        "verbindlichkeiten": undefined,
        "lagebericht": undefined,
        "anhang": undefined,
        "kennzahlen": undefined
    });
    const uploadButtonRef = useRef<HTMLInputElement>(null);
    const [errorVisible, setErrorVisible] = useState(false);
    const [errorObj, setErrorObj] = useState<FileobjErr>({
        "guv": undefined,
        "konzernbilanz": undefined,
        "eigenkapitalspiegel": undefined,
        "kapitalfluss": undefined,
        "anlagengitter": undefined,
        "rueckstellung": undefined,
        "verbindlichkeiten": undefined,
        "lagebericht": undefined,
        "anhang": undefined,
        "generic": undefined,
        "kennzahlen": undefined
    });
    const router = useRouter();
    const year = new Date().getFullYear();

    const [isFreezeOpen, setIsFreezeOpen] = useState(false);
    const [isRevisionOpen, setIsRevisionOpen] = useState(false);
    const [ isResetOpen, setIsResetOpen ] = useState(false);    


    const showModal = (modal: "upload" | "freeze" | "revision" | "reset") => {
        if(modal == "upload"){
            setIsModalOpen(true);
        }else if(modal == "freeze"){
            setIsFreezeOpen(true);
        }else if(modal == "reset"){
            setIsResetOpen(true);
        }else{
            setIsRevisionOpen(true);
        }
    };

    const handleCancel = (modal: "upload" | "freeze" | "revision" | "reset") => {
        if(modal == "upload"){
            setIsModalOpen(false);
        }else if(modal == "freeze"){
            setIsFreezeOpen(false);
        }else if(modal == "reset"){
            setIsResetOpen(false);
        }else{
            setIsRevisionOpen(false);
        }
    };

    const getFileOptions = (fileobjs: Array<{text: string, links: { file: string, representations: Array<{ urlobj: string, name: string, icon: string }> }}>) => {
        
        return fileobjs.map((fileobj, idx) => {
                return (
                    <Collapse
                        size="large"
                        key={idx}
                        items={[
                            {
                            key: idx,
                            label: fileobj.text,
                            children: <List
                                itemLayout="horizontal"
                                dataSource={[{urlobj: `/api/download?filename=${Path.parse(fileobj.links.file).name}&year=${year}`, name: "Datei", icon: "excel"}, ...fileobj.links.representations]}
                                renderItem={(item: {urlobj: string, name: string, icon: any}, index: number) => (
                                <List.Item>
                                    <List.Item.Meta
                                        avatar={(item.icon == "excel")? <FileExcelOutlined />: <TableOutlined />}
                                        title={(item.name == "Datei")? <Link href={`${item.urlobj}`} target="_blank">{item.name}</Link>: <Link href={`${item.urlobj}`} target="_blank">{item.name}</Link>}
                                        description=""
                                    />
                                </List.Item>
                            )}
                        />,
                            },
                        ]}
                        />
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

    const uploadToClient = (file: RcFile, filename: FileObjKey) => {
        if (file) {
          const i = file;
    
          if(i){
            let currobj = files;
            currobj[filename] = i;

            setFiles(currobj);

            setErrorVisible(false);
            setErrorObj({
                "guv": undefined,
                "konzernbilanz": undefined,
                "eigenkapitalspiegel": undefined,
                "kapitalfluss": undefined,
                "anlagengitter": undefined,
                "rueckstellung": undefined,
                "verbindlichkeiten": undefined,
                "lagebericht": undefined,
                "anhang": undefined,
                "generic": undefined,
                "kennzahlen": undefined
            });
          }
        }
    };

    const uploadFileToServer = async (event: SyntheticEvent) => {
        if(files){
            let allPresent = true;
            Object.keys(files).forEach(async (key) => {
                allPresent = allPresent && files[key as FileObjKey] != undefined;
            });

            setErrorVisible(false);
            setErrorObj({
                "guv": undefined,
                "konzernbilanz": undefined,
                "eigenkapitalspiegel": undefined,
                "kapitalfluss": undefined,
                "anlagengitter": undefined,
                "rueckstellung": undefined,
                "verbindlichkeiten": undefined,
                "lagebericht": undefined,
                "anhang": undefined,
                "generic": undefined,
                "kennzahlen": undefined
            });

            if(allPresent){
                let errArr: Array<any> = [];
                let errorProm = new Promise<void>((resolve, reject) => {
                    let keyArr = Object.keys(files);
                    keyArr.forEach(async (key, idx) => {

                        let locFile = files[key as FileObjKey];
                        
    
                        if(locFile){
                            const body = new FormData();
                            body.append("file", locFile);
                            
    
                            try{
                                const res = await axios.post(`/api/data/upload/${key}`, body);

                            }catch(error: any){
                                let reason = "";
    
                                if(error.response.data.errorcode == "XMIMETYPE"){
                                    reason = "Die hochgeladene Datei ist nicht vom Typ .xls. Bitte achten Sie auf das korrekte Dateiformat!"
                                }else if(error.response.data.errorcode == "XSIZE"){
                                    reason = "Die hochgeladene Datei ist zu groß!"
                                }else if(error.response.data.errorcode == "XINVALID"){
                                    reason = "Die hochgeladene Datei ist ungültig! Achten Sie darauf, das alle definierten Daten vorhanden sind."
                                }else{
                                    reason = "UNKNOWN"
                                }
    
                                console.log("pushing");
                                errArr.push({code: error.response.data.errorcode, reason: reason, key: key})
                                console.log(errArr);
                            }
                            
                        }

                        if(idx == keyArr.length - 1){
                            resolve();
                        }
                    });
                })

                console.log(props.currentData);
                const year = new Date().getFullYear();
                const fileres = await axios.post(`/api/files`, {year: year, status: "erstellt"})
                const mailret = await axios.post(`/api/message`, { type: "erstellt", reponsiblemail: props.currentData.responsible.email, reponsiblename: props.currentData.responsible.username })

                errorProm.then(() => {
                    if(errArr.length > 0){
                        errArr.forEach((obj: any) => {
                            console.log(obj.key);
                            let nErr: FileError = {
                                code: obj.code,
                                message: `${keyToName(obj.key as FileObjKey)}: ${obj.reason}`
                            }
                            let currobj = errorObj;
                            errorObj[obj.key as FileObjKey] = nErr;
                            setErrorObj(currobj);
                        });

                        setErrorVisible(true);
                    }else{
                        let currobj = files;
                        Object.keys(errorObj).forEach((key) => {
                            currobj[key as FileObjKey] = undefined;
                        });
                        setFiles(currobj);
                        handleCancel("upload");

                        router.reload()
                    }

                    
                })
            }else{
                let currErrObj = errorObj;
                let nErr: FileError = {
                    code: "GENERIC",
                    message: "Es wurden keine Dateien ausgewählt. Bitte wählen Sie erst alle Dateien aus und klicken dann auf den Upload-Button."
                }
                currErrObj["generic"] = nErr;
                setErrorObj(currErrObj);
                setErrorVisible(true);
            }
        }else{
            let currErrObj = errorObj;
            let nErr: FileError = {
                code: "GENERIC",
                message: "Es wurden keine Dateien ausgewählt. Bitte wählen Sie erst alle Dateiem aus und klicken dann auf den Upload-Button."
            }
            currErrObj["generic"] = nErr;
            setErrorObj(currErrObj);
            setErrorVisible(true);
        }
    }

    const freezeFiles = async () => {
        const fileres = await axios.put(`/api/files`, {id: props.currentData.id, status: "freigegeben"});
        const mailret = await axios.post(`/api/message`, { type: "freeze", reponsiblemail: props.currentData.responsible.email, reponsiblename: props.currentData.responsible.username })
        handleCancel("freeze");
        router.reload();
    }

    const resetFiles = async () => {
        const fileres = await axios.put(`/api/files`, {id: props.currentData.id, status: "erstellt"});
        handleCancel("reset");
        router.reload();
    }

    const requestRevision = async (values: any) => {
        const fileres = await axios.put(`/api/files`, {id: props.currentData.id, status: "revision", commentary: values.commentary});
        const mailret = await axios.post(`/api/message`, { type: "revision", reponsiblemail: props.currentData.responsible.email, reponsiblename: props.currentData.responsible.username })
        handleCancel("revision");
        router.reload();
    }

    const getErrors = () => {
        return Object.keys(errorObj).map((key) => {
            let file: FileError | undefined = errorObj[key as FileObjKey];

            if(file){
                return <Alert key={key} type="error" message={file.message}/>
            }else{
                return <></>
            }
        })
    }

    const getUploadButton = () => {
        if(props.InitialState.role.capabilities.canUploadFiles && props.currentData.status != "freigegeben"){
            return (
                <Button type="primary" onClick={() => {showModal("upload")}}>
                    <UploadOutlined />
                    Upload
                </Button>
            );
        }else{
            return <></>;
        }
    }

    const getFreezeButton = () => {
        if(props.InitialState.role.capabilities.canUnfreeze && props.currentData.status == "erstellt"){
            return (
                <Button type="primary" style={{backgroundColor: "#52c41a", color: "white"}} onClick={() => {showModal("freeze")}}>
                    Freigeben
                </Button>
            );
        }else{
            return <></>;
        }
    }

    const getResetButton = () => {
        if(props.InitialState.role.capabilities.canUnfreeze && props.currentData.status == "freigegeben"){
            return (
                <Button type="primary" style={{backgroundColor: "#FFCC03", color: "white"}} onClick={() => {showModal("reset")}}>
                    Freigabe aufheben
                </Button>
            );
        }else{
            return <></>;
        }
    }

    const getRevisionButton = () => {
        if(props.InitialState.role.capabilities.canUnfreeze && props.currentData.status == "erstellt"){
            return (
                <Button type="primary" style={{backgroundColor: "#ff4d4f", color: "white"}} onClick={() => {showModal("revision")}}>
                    Revision anfordern
                </Button>
            );
        }else{
            return <></>;
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

    const getComment = () => {
        if(props.currentData.status == "revision"){
            return <Paragraph>Kommentar der Qualitätsmanager:in:<pre>{props.currentData.commentary}</pre></Paragraph>;
        }else{
            return <></>;
        }
    }


    return(
        <div>
            <Layout user={props.InitialState}>
                <div className="content">
                    <Space style={{marginBottom: 50}} direction="horizontal" size="large">
                        {getUploadButton()}
                        {getFreezeButton()}
                        {getRevisionButton()}
                        {getResetButton()}
                    </Space>

                    <div className="data-presentation">
                        <div className="data-headline"><h2 className="page-headline">Daten Geschäftsbericht {year}</h2>{getTag(props.currentData.status)}</div>
                        {getComment()}
                        {getPresentation()}
                    </div>

                    <Modal
                        title="Dateien hochladen"
                        open={isModalOpen}
                        onCancel={() => {handleCancel("upload")}}
                        footer = {[]}
                    >
                        <Form 
                            layout='horizontal'
                        >
                            <Space direction="vertical">
                                <Form.Item
                                    label="Konzern GuV"
                                    name="guv" 
                                    labelAlign="left"
                                >
                                    <Upload beforeUpload={(info) => uploadToClient(info, "guv")}>
                                        <Button icon={<UploadOutlined />}>Datei hochladen</Button>
                                    </Upload>
                                </Form.Item>

                                <Form.Item
                                    label="Konzernbilanz"
                                    name="konzernbilanz" 
                                    labelAlign="left"
                                >
                                    <Upload beforeUpload={(info) => uploadToClient(info, "konzernbilanz")}>
                                        <Button icon={<UploadOutlined />}>Datei hochladen</Button>
                                    </Upload>
                                </Form.Item>

                                <Form.Item
                                    label="Eigenkapitalspiegel"
                                    name="eigenkapitalspiegel" 
                                    labelAlign="left"
                                >
                                    <Upload beforeUpload={(info) => uploadToClient(info, "eigenkapitalspiegel")}>
                                        <Button icon={<UploadOutlined />}>Datei hochladen</Button>
                                    </Upload>
                                </Form.Item>

                                <Form.Item
                                    label="Kapitalfluss"
                                    name="kapitalfluss" 
                                    labelAlign="left"
                                >
                                    <Upload beforeUpload={(info) => uploadToClient(info, "kapitalfluss")}>
                                        <Button icon={<UploadOutlined />}>Datei hochladen</Button>
                                    </Upload>
                                </Form.Item>

                                <Form.Item
                                    label="Anlagengitter"
                                    name="anlagengitter" 
                                    labelAlign="left"
                                >
                                    <Upload beforeUpload={(info) => uploadToClient(info, "anlagengitter")}>
                                        <Button icon={<UploadOutlined />}>Datei hochladen</Button>
                                    </Upload>
                                </Form.Item>

                                <Form.Item
                                    label="Rueckstellung"
                                    name="rueckstellung" 
                                    labelAlign="left"
                                >
                                    <Upload beforeUpload={(info) => uploadToClient(info, "rueckstellung")}>
                                        <Button icon={<UploadOutlined />}>Datei hochladen</Button>
                                    </Upload>
                                </Form.Item>

                                <Form.Item
                                    label="Verbindlichkeiten"
                                    name="verbindlichkeiten" 
                                    labelAlign="left"
                                >
                                    <Upload beforeUpload={(info) => uploadToClient(info, "verbindlichkeiten")}>
                                        <Button icon={<UploadOutlined />}>Datei hochladen</Button>
                                    </Upload>
                                </Form.Item>

                                <Form.Item
                                    label="Lagebericht"
                                    name="lagebericht" 
                                    labelAlign="left"
                                >
                                    <Upload beforeUpload={(info) => uploadToClient(info, "lagebericht")}>
                                        <Button icon={<UploadOutlined />}>Datei hochladen</Button>
                                    </Upload>
                                </Form.Item>

                                <Form.Item
                                    label="Anhang"
                                    name="anhang"
                                    labelAlign="left"
                                >
                                    <Upload beforeUpload={(info) => uploadToClient(info, "anhang")}>
                                        <Button icon={<UploadOutlined />}>Datei hochladen</Button>
                                    </Upload>
                                </Form.Item>

                                <Form.Item
                                    label="Kennzahlen"
                                    name="kennzahlen"
                                    labelAlign="left"
                                >
                                    <Upload beforeUpload={(info) => uploadToClient(info, "kennzahlen")}>
                                        <Button icon={<UploadOutlined />}>Datei hochladen</Button>
                                    </Upload>
                                </Form.Item>

                                <div className="upload-errors">
                                    {(errorVisible)? getErrors(): <></>}
                                </div>
                            </Space>

                            <div className="upload-hint">
                                Die Daten sind nach dem Upload durch die Anwendung nicht mehr editierbar. Ein Bearbeiten der Daten ist nur durch erneuten Upload möglich!
                            </div>


                            <Form.Item className='modal-buttom-row'>
                                <Space direction='horizontal'>
                                    <Button key="close" onClick={() => {handleCancel("upload")}}>
                                        Abbrechen
                                    </Button>
                                    <Button onClick={uploadFileToServer}  key="submit" type="primary">
                                        Hochladen
                                    </Button>
                                </Space>
                            </Form.Item>
                        </Form>
                    </Modal>

                    <Modal
                        title="Daten freigeben"
                        open={isFreezeOpen}
                        onCancel={() => {handleCancel("freeze")}}
                        footer = {[]}
                    >
                        <Form 
                            layout='horizontal'
                        >
                            
                            <div className="upload-hint">
                               Wollen Sie die Daten wirklich freigeben? Ein Upload ist danach nicht mehr möglich!
                            </div>


                            <Form.Item className='modal-buttom-row'>
                                <Space direction='horizontal'>
                                    <Button key="close" onClick={() => {handleCancel("freeze")}}>
                                        Abbrechen
                                    </Button>
                                    <Button onClick={freezeFiles}  key="submit" type="primary">
                                        Freigeben
                                    </Button>
                                </Space>
                            </Form.Item>
                        </Form>
                    </Modal>

                    <Modal
                        title="Freigabe aufheben"
                        open={isResetOpen}
                        onCancel={() => {handleCancel("reset")}}
                        footer = {[]}
                    >
                        <Form 
                            layout='horizontal'
                        >
                            
                            <div className="upload-hint">
                               Wollen Sie die Freigabe wirklich aufheben?
                            </div>


                            <Form.Item className='modal-buttom-row'>
                                <Space direction='horizontal'>
                                    <Button key="close" onClick={() => {handleCancel("reset")}}>
                                        Abbrechen
                                    </Button>
                                    <Button onClick={resetFiles}  key="submit" type="primary">
                                        Aufheben
                                    </Button>
                                </Space>
                            </Form.Item>
                        </Form>
                    </Modal>

                    <Modal
                        title="Revision anfordern"
                        open={isRevisionOpen}
                        onCancel={() => {handleCancel("revision")}}
                        footer = {[]}
                    >
                        <Form 
                            layout='vertical'
                            onFinish={requestRevision}
                        >
                            <Paragraph>
                                Wollen Sie eine Revision durch den zuständigen Mitarbeiter anfordern? Der Mitarbeiter erhält eine Benachrichtung, dass die Daten überarbeitet werden müssen.
                            </Paragraph>

                            <Form.Item name={"commentary"} label="Anmerkung" >
                                <Input.TextArea />
                            </Form.Item>
                            
                            <Form.Item className='modal-buttom-row'>
                                <Space direction='horizontal'>
                                    <Button key="close" onClick={() => {handleCancel("revision")}}>
                                        Abbrechen
                                    </Button>
                                    <Button  key="submit" type="primary" htmlType="submit">
                                        Revision anfordern
                                    </Button>
                                </Space>
                            </Form.Item>
                        </Form>
                    </Modal>
                </div>
            </Layout>
        </div>
    );

}