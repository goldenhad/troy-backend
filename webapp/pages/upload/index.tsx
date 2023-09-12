import Layout from "@/components/layout/layout";
import "./style.scss"
import { GetServerSideProps } from "next";
import { faFileUpload, faCircleInfo, faFileExcel, faChartSimple } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Alert, Button, Card, Modal } from "react-bootstrap";
import { SyntheticEvent, useRef, useState } from "react";
import Link from "next/link";
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import axios, { AxiosError, AxiosResponse, isAxiosError } from "axios";
import { rejects } from "assert";
import { prisma } from '../../db';
import { Files } from "@prisma/client";
import { useRouter } from "next/router";
import Router from "next/dist/server/router";

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
enum FileTypes{ "guv", "konzernbilanz", "eigenkapitalspiegel", "kapitalfluss", "anlagengitter", "rueckstellung", "verbindlichkeiten", "lagebericht", "anhang" }; 


type ErrorCode = "XMIMETYPE" | "XSIZE" | "XINVALID" | "OK" | "GENERIC";

type FileErrorKey = "code" | "message";

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



export default function Upload(props: InitialProps){
    const [dataPresent, setDataPresent ] = useState(false);
    //Define a state to handle the popups state
    const [show, setShow] = useState(false);
    //Helper functions to handle setState for the popup
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
    //State to handle file
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


    const getFileOptions = (fileobjs: Array<{text: string, links: { file: string, representations: Array<{ urlobj: string, name: string }> }}>) => {
        
        return fileobjs.map((fileobj, idx) => {
                return(
                    <Card className="file-card" key={idx}>
                        <Card.Header className="file-header">{fileobj.text}</Card.Header>
                        <Card.Body>
                            <div className="data-content">
                                <ul className="option-list">
                                    <li>
                                        <Link href={`/data/${year}/${fileobj.links.file}.xlsx`}>
                                            <div className="file-options">
                                                <FontAwesomeIcon className="option-icon" icon={faFileExcel} />
                                                <div className="option-name">Datei</div>
                                            </div>
                                        </Link>
                                    </li>
                                    { 
                                        fileobj.links.representations.map((repobj, idy) => {
                                            return(
                                                <li key={idy}>
                                                    <Link href={`/presentation/${repobj.urlobj}`} target="_blank">
                                                        <div className="file-options">
                                                            <FontAwesomeIcon className="option-icon" icon={faChartSimple} />
                                                            <div className="option-name">{repobj.name}</div>
                                                        </div>
                                                    </Link>
                                                </li>
                                            );
                                        })
                                    }
                                </ul>
                            </div>
                        </Card.Body>
                    </Card>
                );
        })
    }

    const getPresentation = () => {
        
        const fileobjs = [
            {text: "Guv", links: { file: "guv", representations: [{ urlobj: "guv", name: "GUV Tabelle"  }] }},
            {text: "Konzernbilanz", links: { file: "konzernbilanz", representations: [{ urlobj: "konzernbilanz/aktiva", name: "Konzernbilanz Aktiva"  }, { urlobj: "konzernbilanz/passiva", name: "Konzernbilanz Passiva"  }] }},
            {text: "Eigenkapitalspiegel", links: { file: "eigenkapitalspiegel", representations: [{ urlobj: "eigenkapitalspiegel", name: "Eigenkapitalspiegel Tabelle"  }] }},
            {text: "Kapitalfluss", links: { file: "kapitalfluss", representations: [{ urlobj: "kapitalfluss", name: "Kapitalfluss Tabelle"  }] }},
            {text: "Anlagengitter", links: { file: "anlagengitter", representations: [{ urlobj: "anlagengitter", name: "Anlagengitter Tabelle"  }] }},
            {text: "Rueckstellung", links: { file: "rueckstellung", representations: [{ urlobj: "rueckstellung", name: "Rueckstellungs Tabelle"  }] }},
            {text: "Verbindlichkeiten", links: { file: "verbindlichkeiten", representations: [{ urlobj: "verbindlichkeiten", name: "Verbindlichkeiten Tabelle"  }] }},
            {text: "Lagebericht", links: { file: "lagebericht", representations: [{ urlobj: "lagebericht", name: "Lagebericht Tabelle"  }] }},
            {text: "Anhang", links: { file: "anhang", representations: [{ urlobj: "anhang", name: "anhang"  }] }},
        ]

        if(props.currentData){

            return(
                <div className="data-list">
                    {getFileOptions(fileobjs)}
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

    const uploadToClient = (event: SyntheticEvent & {target: {files: FileList | null}}, file: FileObjKey) => {
        if (event.target.files && event.target.files[0]) {
          const i = event.target.files[0];
    
          if(i){
            let currobj = files;
            currobj[file] = i;

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
                        handleClose();

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

    const renderTooltip = (props: any) => (
        <Tooltip className="upload-hover-hint" {...props}>
          <div className="upload-hint">
            Die Daten sind nach dem Upload durch die Anwendung nicht mehr editierbar. Ein Bearbeiten der Daten ist nur durch erneuten Upload möglich!
         </div>
        </Tooltip>
    );

    const getErrors = () => {
        return Object.keys(errorObj).map((key) => {
            let file: FileError | undefined = errorObj[key as FileObjKey];

            if(file){
                return <Alert key={key} variant="danger">{file.message}</Alert>
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
                        <Button className="upload-button" variant="secondary" onClick={handleShow}>
                            <FontAwesomeIcon icon={faFileUpload} />
                            <div className="upload-button-text">Upload</div>
                        </Button>
                    </div>

                    <div className="data-presentation">
                        <h2>Daten Geschäftsbericht {year}</h2>
                        {getPresentation()}
                    </div>

                    <Modal className="upload-modal" show={show} onHide={handleClose} size="lg">
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
                                <Button variant="primary" onClick={uploadFileToServer}>Upload</Button>
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
                    </Modal>
                </div>
            </Layout>
        </div>
    );

}