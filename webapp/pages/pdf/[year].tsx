import Image from "next/image";
import "./style.scss"
import { GetServerSideProps } from "next";
import fs from 'fs';
import { read } from 'xlsx';
import { User } from '../../helper/user'
import { decrypt } from "@/helper/decryptFile";
import yearPublished from "@/helper/filefunctions";
import { Button } from "antd";
import { FilePdfOutlined } from '@ant-design/icons';



interface InitialProps {
    InitialState: User;
    tabletitle: string
    url: string,
}


export const getServerSideProps: GetServerSideProps = async (ctx) => {
    //Get the context of the request
    const { req, res } = ctx;
    //Get the cookies from the current request
    const { cookies } = req;

    let qyear = -1;
    if(ctx.query.year){
        try{
            qyear = parseInt(ctx.query.year as string);
        }catch(e){
            res.writeHead(302, { Location: "/notfound" });
            res.end();
    
            return { props: { InitialState: {} } };
        }

        const available = await yearPublished(qyear);

        if(available){
            if(ctx.query.table){
                const table = ctx.query.table;
                const year = qyear;
    
                let url = "";
                let tabletitle = "";
                let options = {
                    format: "a4",
                    scale: 1,
                    printBackground: true,
                    landscape: false,
                    margin: { left: '2cm', top: '1cm', right: '1cm', bottom: '1cm' }
                };
    
                switch(table){
                    case "guv":
                        options.scale = 0.5;
                        tabletitle = "Gewinn-und-Verlustrechnung";
                        url = `/presentation/guv/${year}?scaled=1`;
                        break;
                    case "aktiva":
                        options.scale = 0.6;
                        tabletitle = "Konzernbilanz-aktiva";
                        url = `/presentation/konzernbilanz/aktiva/${year}?scaled=0`;
                        break;
                    case "passiva":
                        options.scale = 0.6;
                        tabletitle = "Konzernbilanz-passiva";
                        url = `/presentation/konzernbilanz/passiva/${year}?scaled=0`;
                        break;
                    case "eks1":
                        options.scale = 0.6;
                        options.landscape = true;
                        tabletitle = "Eigenkapitalspiegel-I";
                        url = `/presentation/eigenkapitalspiegel/I/${year}?scaled=0`;
                        break;
                    case "eks2":
                        options.scale = 0.6;
                        options.landscape = true;
                        tabletitle = "Eigenkapitalspiegel-II";
                        url = `/presentation/eigenkapitalspiegel/II/${year}?scaled=0`;
                        break;
                    case "kapitalfluss":
                        options.scale = 0.6;
                        tabletitle = "Kapitalfluss";
                        url = `/presentation/kapitalfluss/${year}?scaled=1`;
                        break;
                    case "anlagengitter1":
                        options.scale = 0.6;
                        options.landscape = true;
                        tabletitle = "Anlagengitter-I";
                        url = `/presentation/anlagengitter/I/${year}?scaled=1`;
                        break;
                    case "anlagengitter2":
                        options.scale = 0.6;
                        options.landscape = true;
                        tabletitle = "Anlagengitter-II";
                        url = `/presentation/anlagengitter/II/${year}?scaled=1`;
                        break;
                    case "rueckstellung":
                        options.scale = 0.6;
                        tabletitle = "Rückstellungsspiegel"
                        url = `/presentation/rueckstellung/${year}?scaled=1`;
                        break;
                    case "verbindlichkeiten":
                        options.scale = 0.6;
                        tabletitle = "Verbindlichkeiten"
                        url = `/presentation/verbindlichkeiten/${year}?scaled=1`;
                        break;
                    case "lagebericht-bestand":
                        options.scale = 0.6;
                        tabletitle = "Lagebericht-Bestandsmanagement"
                        url = `/presentation/lagebericht/bestand/${year}?scaled=1`;
                        break;
                    case "lagebericht-neubau":
                        options.scale = 0.6;
                        tabletitle = "Lagebericht-Neubau"
                        url = `/presentation/lagebericht/neubau/${year}?scaled=1`;
                        break;
                    case "lagebericht-ertrag":
                        options.scale = 0.6;
                        tabletitle = "Lagebericht-Ertragslage"
                        url = `/presentation/lagebericht/ertragslage/${year}?scaled=1`;
                        break;
                    case "lagebericht-finanzen":
                        options.scale = 0.6;
                        tabletitle = "Lagebericht-Finanzlage"
                        url = `/presentation/lagebericht/finanzlage/${year}?scaled=1`;
                        break;
                    case "anhang-hausbewirtschaftung":
                        options.scale = 0.6;
                        tabletitle = "Anhang-Umsatzerlös-Hausbewirtschaftung"
                        url = `/presentation/anhang/umsatzerloes/hausbewirtschaftung/${year}?scaled=1`;
                        break;
                    case "anhang-betreuungstaetigkeit":
                        options.scale = 0.6;
                        tabletitle = "Anhang-Umsatzerlös-Betreuungstätigkeit"
                        url = `/presentation/anhang/umsatzerloes/betreuungstaetigkeit/${year}?scaled=1`;
                        break;
                    case "anhang-lieferungenundleistungen":
                        options.scale = 0.6;
                        tabletitle = "Anhang-Umsatzerlös-Lieferung-und-Leistungen"
                        url = `/presentation/anhang/umsatzerloes/lieferungenundleistungen/${year}?scaled=1`;
                        break;
                    case "anhang-betrieblicheertraege":
                        options.scale = 0.6;
                        tabletitle = "Anhang-Sonstige-Betriebliche-Erträge"
                        url = `/presentation/anhang/sonstige/betrieblicheertraege/${year}?scaled=1`;
                        break;
                    case "anhang-betrieblicheaufwendungen":
                        options.scale = 0.6;
                        tabletitle = "Anhang-Sonstige-Betriebliche-Aufwendungen"
                        url = `/presentation/anhang/sonstige/betrieblicheaufwendungen/${year}?scaled=1`;
                        break;
                    case "anhang-mitarbeiterinnen":
                        options.scale = 0.6;
                        tabletitle = "Anhang-Mitarbeiterinnen"
                        url = `/presentation/anhang/sonstige/mitarbeiterinnen/${year}?scaled=1`;
                        break;
                    case "anhang-altersversorgung":
                        options.scale = 0.6;
                        tabletitle = "Anhang-Altersversorgung"
                        url = `/presentation/anhang/sonstige/altersversorgung/${year}?scaled=1`;
                        break;
                }
    
                return {
                    props: {
                        InitialState: {},
                        url: url,
                        tabletitle: tabletitle,
                    },
                };
            }else{
                res.writeHead(302, { Location: "/notfound" });
                res.end();
        
                return { props: { InitialState: {} } };
            }
        }else{
            res.writeHead(302, { Location: "/notfound" });
            res.end();
    
            return { props: { InitialState: {} } };
        }
    }else{
        res.writeHead(302, { Location: "/notfound" });
        res.end();

        return { props: { InitialState: {} } };
    }
};

export default function Guv(props: InitialProps){
    const printIframe = (id: string) => {
      const iframe = (document as any).frames
        ? (document as any).frames[id]
        : (document as any).getElementById(id);
      const iframeWindow = iframe.contentWindow || iframe;
  
      iframe.focus();
      iframeWindow.print();
  
      return false;
    };

    
    if(props.url != ""){
        return(
            <div className="container">
                <div className="filemockup">
                    <FilePdfOutlined />
                </div>
                <span className="title">{props.tabletitle}.pdf</span>
                <div className="buttoncontainer">
                    <Button type="primary" className="downloadbutton" onClick={()=> printIframe('tableframe')}>
                        Download
                    </Button>
                </div>
                <iframe className="frame" id="tableframe" src={props.url} width={1000} height={2000} />
            </div>
        );
    }else{
        return(
            <div className="container">
                <span className="title">Datei nicht gefunden!</span>
            </div>
        );
    }


}