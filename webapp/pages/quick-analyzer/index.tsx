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

const refCompany = (val: Company) => {
    switch(val){
        case Company.WOHNBAU:
            return "WOHNBAU"
        case Company.SIEDLUNG:
            return "SIEDLUNG"
        case Company.KREISBAU:
            return "KREISBAU"
        case Company.STEINFURT:
            return "STEINFURT"
    }
}

export enum Company {
    WOHNBAU,
    SIEDLUNG,
    KREISBAU,
    STEINFURT
}

export type CompRef = {
    label: string,
    key: Company,
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
    const [ company, setCompany ] = useState<Company>(Company.WOHNBAU);
    const [ selectedYears, setSelectedYears ] = useState<Array<string>>([availableYears[availableYears.length - 1]]);
    const [ selectedCompanies, setSelectedCompanies ] = useState<Array<Company>>([ Company.WOHNBAU ]);
    const [ mode, setMode ] = useState("bar");

    const [ data, setData ] = useState<Array<{ key: Company, items: Array<{ year: number, value: number }> }>>([]);

    useEffect(() => {
        const getData = async () => {
            try{
                const locData = await axios.post("/api/analyzer/data", { years: availableYears, datasource: refName(source), companies: selectedCompanies });
                setData(locData.data.message);
            }catch(e){
                setData([]);
            }
        }

        getData();
    }, [source, selectedCompanies, availableYears]);


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

    const constructOptions = () => {
        const options: Array<{label: string, value: string}> = [];
        availableYears.forEach((year) => {
            options.push({
                label: year,
                value: year
            })
        });
        return options;
    }

    return(
        <>
            <div className="container">
                <SalesChart data={data} selectedYears={selectedYears} selectedCompanies={selectedCompanies} title={getTitle()} mode={mode} />
            </div>
            <div className="inputcontainer">
                <Select
                    className="chartselect"
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
                    className="chartselect"
                    mode="multiple"
                    allowClear
                    placeholder="Please select"
                    onChange={(selected: Array<string>) => {
                        let compdata: Array<Company> = [];
                        selected.forEach((sel: string) => {
                            switch(sel){
                                case("SIEDLUNG"):
                                    compdata.push(Company.SIEDLUNG);
                                    break;
                                case("KREISBAU"):
                                    compdata.push(Company.KREISBAU);
                                    break;
                                case("STEINFURT"):
                                    compdata.push(Company.STEINFURT);
                                    break;
                            }
                        })

                        compdata.push(Company.WOHNBAU);

                        setSelectedCompanies(compdata);
                    }}
                    options={[
                        {label: "Kommunale Siedlungs- und Wohnungsbaugesellschaft mbH", value: "SIEDLUNG"},
                        {label: "Kreisbauverein GmbH", value: "KREISBAU"},
                        {label: "Wohnungsbaugesellschaft Kreis Steinfurt mbH", value: "STEINFURT"},
                    ]}
                />
                <Select
                    className="chartselect"
                    placeholder="Please select"
                    defaultValue={"bar"}
                    onChange={(selected: string) => {
                        setMode(selected);
                    }}
                    options={[
                        {label: "Balkendiagramm", value: "bar"},
                        {label: "Liniendiagramm", value: "line"}
                    ]}
                />
                <Select
                    className="chartselect"
                    mode="multiple"
                    allowClear
                    placeholder="Please select"
                    defaultValue={[availableYears[availableYears.length - 1]]}
                    onChange={(selected: Array<string>) => {
                        /* const sortedYears = selected.toSorted((a, b) => {
                            if(parseInt(a) > parseInt(b)){
                                return 1;
                            }else if(parseInt(a) < parseInt(b)){
                                return -1;
                            }else{
                                return 0;
                            }
                        }); */

                        setSelectedYears(selected);
                    }}
                    options={constructOptions()}
                />
            </div>
        </>
    );
}