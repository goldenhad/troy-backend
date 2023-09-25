import Layout from "@/components/layout/layout";
import "./style.scss"
import { GetServerSideProps } from "next";
import { Card, List, Space, Button, Form, Alert, Modal, Upload } from "antd"
import { SyntheticEvent, useRef, useState } from "react";
import Link from "next/link";
import axios, { AxiosError, AxiosResponse, isAxiosError } from "axios";
import { prisma } from '../../db';
import { Files } from "@prisma/client";
import { useRouter } from "next/router";
import { fileobjs } from "@/helper/uploadRepresentation";
import { FileExcelOutlined, TableOutlined, UploadOutlined } from '@ant-design/icons';
import { RcFile } from "antd/es/upload";

//Define a type for the cookie
type User = {
    username: string;
    email: string;
    roleid: number;
};
  
interface InitialProps {
    InitialState: User;
    Files: Array<Files> | undefined;
    currentData: boolean;
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
        let currentData = null
        const year = new Date().getFullYear();
        let files: Array<Files> | null = await prisma.files.findMany();
        if(!files){
            files = null;
        }else{
            currentData = files.find((fileobj) => {
                return fileobj.year == year;
            })
        }

        if(!currentData){
            currentData = null;
        }

        return {
        props: {
            InitialState: JSON.parse(
            Buffer.from(cookies.login, "base64").toString("ascii")
            ),
            Files: files,
            currentData: currentData,
        },
        };
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
        "anhang": undefined
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
    });
    
    const router = useRouter();
    const year = new Date().getFullYear();


    const showModal = () => {
        setIsModalOpen(true);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };

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
                            dataSource={[{urlobj: "guv", name: "Datei", icon: "excel"}, ...fileobj.links.representations]}
                            renderItem={(item: {urlobj: string, name: string, icon: any}, index: number) => (
                            <List.Item>
                                <List.Item.Meta
                                    avatar={(item.icon == "excel")? <FileExcelOutlined />: <TableOutlined />}
                                    title={<Link href={`/presentation/${item.urlobj}`} target="_blank">{item.name}</Link>}
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
        if(props.currentData){
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

                const year = new Date().getFullYear();
                const fileres = await axios.post(`/api/files`, {year: year, status: true})

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
                        handleCancel();

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



    return(
        <div>
            <Layout user={props.InitialState}>
                <div className="content">
                    <div className="action-row">
                        <Button type="primary" onClick={showModal}>
                            <UploadOutlined />
                            Upload
                        </Button>
                    </div>

                    <div className="data-presentation">
                        <h2 className="page-headline">Daten Geschäftsbericht {year}</h2>
                        {getPresentation()}
                    </div>

                    <Modal
                        title="Dateien hochladen"
                        open={isModalOpen}
                        onCancel={handleCancel}
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

                                <div className="upload-errors">
                                    {(errorVisible)? getErrors(): <></>}
                                </div>
                            </Space>

                            <div className="upload-hint">
                                Die Daten sind nach dem Upload durch die Anwendung nicht mehr editierbar. Ein Bearbeiten der Daten ist nur durch erneuten Upload möglich!
                            </div>


                            <Form.Item className='modal-buttom-row'>
                                <Space direction='horizontal'>
                                    <Button key="close" onClick={handleCancel}>
                                        Abbrechen
                                    </Button>
                                    <Button onClick={uploadFileToServer}  key="submit" type="primary">
                                        Hochladen
                                    </Button>
                                </Space>
                            </Form.Item>
                        </Form>
                    </Modal>

                    {/* <Modal className="upload-modal" show={show} onHide={handleClose} size="lg">
                        <Modal.Header closeButton>
                            <Modal.Title>Upload</Modal.Title>
                        </Modal.Header>

                        <Modal.Body>
                            <div className="filelist">
                                <div className="fileitem">
                                    <div className="filename">Konzern GuV</div>
                                    <div className="fileuploadbutton">
                                        <input  type="file" name="fileUpload" onChange={(event) => uploadToClient(event, "guv")}/>
                                    </div>
                                </div>

                                <div className="fileitem">
                                    <div className="filename">Konzernbilanz</div>
                                    <div className="fileuploadbutton">
                                        <input  type="file" name="fileUpload" onChange={(event) => uploadToClient(event, "konzernbilanz")}/>
                                    </div>
                                </div>

                                <div className="fileitem">
                                    <div className="filename">Konzern Eigenkapitalspiegel</div>
                                    <div className="fileuploadbutton">
                                        <input  type="file" name="fileUpload" onChange={(event) => uploadToClient(event, "eigenkapitalspiegel")}/>
                                    </div>
                                </div>

                                <div className="fileitem">
                                    <div className="filename">Kapitalflussrechnung</div>
                                    <div className="fileuploadbutton">
                                        <input  type="file" name="fileUpload" onChange={(event) => uploadToClient(event, "kapitalfluss")}/>
                                    </div>
                                </div>

                                <div className="fileitem">
                                    <div className="filename">Konzernanlagengitter</div>
                                    <div className="fileuploadbutton">
                                        <input  type="file" name="fileUpload" onChange={(event) => uploadToClient(event, "anlagengitter")}/>
                                    </div>
                                </div>

                                <div className="fileitem">
                                    <div className="filename">Rückstellungsspiegel</div>
                                    <div className="fileuploadbutton">
                                        <input  type="file" name="fileUpload" onChange={(event) => uploadToClient(event, "rueckstellung")}/>
                                    </div>
                                </div>

                                <div className="fileitem">
                                    <div className="filename">Verbindlichkeitenspiegel</div>
                                    <div className="fileuploadbutton">
                                        <input type="file" name="fileUpload" onChange={(event) => uploadToClient(event, "verbindlichkeiten")}/>
                                    </div>
                                </div>

                                <div className="fileitem">
                                    <div className="filename">Lagebericht</div>
                                    <div className="fileuploadbutton">
                                        <input  type="file" name="fileUpload" onChange={(event) => uploadToClient(event, "lagebericht")}/>
                                    </div>
                                </div>
                                <div className="fileitem">
                                    <div className="filename">Anhang</div>
                                    <div className="fileuploadbutton">
                                        <input  type="file" name="fileUpload" onChange={(event) => uploadToClient(event, "anhang")}/>
                                    </div>
                                </div>
                            </div>

                            <div className="upload-section">
                                <Button onClick={uploadFileToServer}>Upload</Button>
                                <OverlayTrigger
                                    placement="right"
                                    delay={{ show: 250, hide: 400 }}
                                    overlay={renderTooltip}
                                >
                                    <div className="upload-hint-trigger">
                                        <FontAwesomeIcon icon={faCircleInfo} />
                                    </div>
                                </OverlayTrigger>
                            </div>


                            <div className="upload-errors">
                                {(errorVisible)? getErrors(): <></>}
                            </div>
                        </Modal.Body>
                    </Modal> */}
                </div>
            </Layout>
        </div>
    );

}