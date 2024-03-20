import "./style.scss"
import { GetServerSideProps } from "next";
import fs from 'fs';
import { getAllYearsPublished } from "@/helper/filefunctions";
import SalesChart from "@/components/analyzer/sales/sales";
import { decrypt } from "@/helper/decryptFile";
import { read, write, writeFile } from 'xlsx';
import { useEffect, useState } from "react";
import { Select } from "antd";
import axios from "axios";


export type InitialProps = {
    availableYears: Array<string>,
    data: Array<{ year: number, value: number }>
}

enum SourceReference {
    SALES,
    OVERSHOOT,
    PROCEEDS,
    CAPITAL,
    NEWBUILDINGS,
    MODERNIZINGS,
    FLATS,
    BUSINESSES
}

const refName = (val: SourceReference) => {
    switch(val){
        case SourceReference.SALES:
            return "SALES"
        case SourceReference.OVERSHOOT:
            return "OVERSHOOT"
        case SourceReference.PROCEEDS:
            return "PROCEEDS"
        case SourceReference.CAPITAL:
            return "CAPITAL"
        case SourceReference.NEWBUILDINGS:
            return "NEWBUILDINGS"
        case SourceReference.MODERNIZINGS:
            return "MODERNIZINGS"
        case SourceReference.FLATS:
            return "FLATS"
        case SourceReference.BUSINESSES:
            return "BUSINESSES"
    }
}

enum Company {
    WOHNBAU,
    SIEDLUNG,
    KREISBAU,
    STEINFURT
}



export const getServerSideProps: GetServerSideProps = async (ctx) => {
    //Get the context of the request
    const { req, res } = ctx;
    //Get the cookies from the current request
    const { cookies } = req;

    const yearsPublished: Array<number> = await getAllYearsPublished();
    const years: Array<string> = [];

    yearsPublished.forEach(year => {
        years.push(year.toString());
    });

    const data: Array<{ year: number, value: number }> = [];

    return { props: { availableYears: years } };
};

export default function QuickAnalyzer({ availableYears }: InitialProps){
    const [ source, setSource ] = useState<SourceReference>(SourceReference.SALES);
    const [ company, setCompany ] = useState<Company>();

    const [ data, setData ] = useState<Array<{year: number, value: number}>>([]);

    useEffect(() => {
        const getData = async () => {
            try{
                const locData = await axios.post("/api/analyzer/data", { years: availableYears, datasource: refName(source), company: company });
                setData(locData.data.message);
            }catch(e){
                setData([]);
            }
        }

        getData();
    }, [source, company]);


    const getTitle = () => {
        switch(source){
            case SourceReference.SALES:
                return "Umsatz"
            case SourceReference.OVERSHOOT:
                return "Jahresüberschuss"
            case SourceReference.PROCEEDS:
                return "Bilanzsumme"
            case SourceReference.CAPITAL:
                return "Eigenkapitalquote"
            case SourceReference.NEWBUILDINGS:
                return "Neubau"
            case SourceReference.MODERNIZINGS:
                return "Instandhaltung/Modernisierung"
            case SourceReference.FLATS:
                return "Wohneinheiten"
            case SourceReference.BUSINESSES:
                return "Gewerbeeinheiten"
        }
    }

    return(
        <>
            <SalesChart data={data} availableYears={availableYears} title={getTitle()}/>
            <Select 
                style={{ width: '100%' }}
                placeholder="Please select"
                defaultValue={"SALES"}
                onChange={(selected: string) => {
                    switch(selected){
                        case "SALES":
                            setSource(SourceReference.SALES);
                            break;
                        case "OVERSHOOT":
                            setSource(SourceReference.OVERSHOOT);
                            break;
                        case "PROCEEDS":
                            setSource(SourceReference.PROCEEDS);
                            break;
                        case "CAPITAL":
                            setSource(SourceReference.CAPITAL);
                            break;
                        case "NEWBUILDINGS":
                            setSource(SourceReference.NEWBUILDINGS);
                            break;
                        case "MODERNIZINGS":
                            setSource(SourceReference.MODERNIZINGS);
                            break;
                        case "FLATS":
                            setSource(SourceReference.FLATS);
                            break;
                        case "BUSINESSES":
                            setSource(SourceReference.BUSINESSES);
                            break;
                    }
                }}
                options={[
                    {label: "Umsatzerlöse", value: "SALES"},
                    {label: "Jahresüberschuss", value: "OVERSHOOT"},
                    {label: "Bilanzsumme", value: "PROCEEDS"},
                    {label: "Eigenkapitalquote", value: "CAPITAL"},
                    {label: "Neubau", value: "NEWBUILDINGS"},
                    {label: "Instandhaltung/Modernisierung", value: "MODERNIZINGS"},
                    {label: "Wohneinheiten", value: "FLATS"},
                    {label: "Gewerbeeinheiten", value: "BUSINESSES"},
                ]}
            />
            <Select 
                style={{ width: '100%' }}
                placeholder="Please select"
                defaultValue={"WOHNBAU"}
                onChange={(selected: string) => {
                    switch(selected){
                        case "WOHNBAU":
                            setCompany(Company.WOHNBAU);
                            break;
                        case "SIEDLUNG":
                            setCompany(Company.SIEDLUNG);
                            break;
                        case "KREISBAU":
                            setCompany(Company.KREISBAU);
                            break;
                        case "STEINFURT":
                            setCompany(Company.STEINFURT);
                            break;
                    }
                }}
                options={[
                    {label: "WohnBau Westmünsterland eG", value: "WOHNBAU"},
                    {label: "Kommunale Siedlungs- und Wohnungsbaugesellschaft mbH", value: "SIEDLUNG"},
                    {label: "Kreisbauverein GmbH", value: "KREISBAU"},
                    {label: "Wohnungsbaugesellschaft Kreis Steinfurt mbH", value: "STEINFURT"},
                ]}
            />
        </>
    );
}