import Layout from "@/components/layout/layout";
import "./style.scss"
import { GetServerSideProps } from "next";
import { faFileExcel, faChartSimple } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Card} from "react-bootstrap";
import Link from "next/link";
import { prisma } from '../../../db';
import { Files } from "@prisma/client";

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
    year: number;
}

type FileObjKey = "guv" | "konzernbilanz" | "einkommensspiegel" | "kapitalfluss" | "anlagengitter" | "rueckstellung" | "verbindlichkeiten"  | "lagebericht" | "anhang";


type ErrorCode = "XMIMETYPE" | "XSIZE" | "XINVALID" | "OK" | "GENERIC";


type FileError = {
    "code": ErrorCode,
    "message": string,
}

type Fileobj = {
    "guv": undefined | File,
    "konzernbilanz": undefined | File,
    "einkommensspiegel": undefined | File,
    "kapitalfluss": undefined | File,
    "anlagengitter": undefined | File,
    "rueckstellung": undefined | File,
    "verbindlichkeiten": undefined | File,
    "lagebericht": undefined | File,
    "anhang": undefined | File
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
        let param = "";
        if( ctx.query.page ){
            param = ctx.query.page[0] as string;
        }

        const year = parseInt(param);

        let files = await prisma.files.findMany();

        const currentData = files.find((fileobj) => {
            return fileobj.year == year;
        })

        return {
        props: {
            InitialState: JSON.parse(
            Buffer.from(cookies.login, "base64").toString("ascii")
            ),
            Files: files,
            currentData: currentData,
            year: year,
        },
        };
    }
};



export default function Details(props: InitialProps){
    const year = props.year;


    const getFileOptions = (fileobjs: Array<{text: string, link: string}>) => {
        return fileobjs.map((fileobj, idx) => {
                return(
                    <Card className="file-card" key={idx}>
                        <Card.Header className="file-header">{fileobj.text}</Card.Header>
                        <Card.Body>
                            <div className="data-content">
                                <ul className="option-list">
                                    <li>
                                        <Link href={`/data/${year}/${fileobj.link}.xlsx`}>
                                            <div className="file-options">
                                                <FontAwesomeIcon className="option-icon" icon={faFileExcel} />
                                                <div className="option-name">Datei</div>
                                            </div>
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href={`#`}>
                                            <div className="file-options">
                                                <FontAwesomeIcon className="option-icon" icon={faChartSimple} />
                                                <div className="option-name">Darstellung</div>
                                            </div>
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                        </Card.Body>
                    </Card>
                );
        })
    }

    const getPresentation = () => {

        const fileobjs = [
            {text: "Guv", link: "guv"},
            {text: "Konzernbilanz", link: "konzernbilanz"},
            {text: "Einkommensspiegel", link: "einkommensspiegel"},
            {text: "Kapitalfluss", link: "kapitalfluss"},
            {text: "Anlagengitter", link: "anlagengitter"},
            {text: "Rueckstellung", link: "rueckstellung"},
            {text: "Verbindlichkeiten", link: "verbindlichkeiten"},
            {text: "Lagebericht", link: "lagebericht"},
            {text: "Anhang", link: "anhang"},
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


    return(
        <div>
            <Layout user={props.InitialState}>
                <div className="content">
                    <div className="action-row">
                        
                    </div>

                    <div className="data-presentation">
                        <h2>Daten Geschäftsbericht {props.year}</h2>
                        {getPresentation()}
                    </div>

                </div>
            </Layout>
        </div>
    );

}