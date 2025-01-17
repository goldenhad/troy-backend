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
    STEINFURT,
    UNDEFINED
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
    const [ company, setCompany ] = useState<Company>(Company.UNDEFINED);
    const [ selectedYears, setSelectedYears ] = useState<Array<string>>([availableYears[availableYears.length - 1]]);
    const [ selectedCompanies, setSelectedCompanies ] = useState<Array<Company>>([]);
    const [ mode, setMode ] = useState("bar");
    const [ stepSize, setStepSize ] = useState(1000);
    const [ max, setMax ] = useState(15000);
    const [ unit, setUnit ] = useState("€");

    const [ data, setData ] = useState<Array<{ key: Company, items: Array<{ year: number, value: number }> }>>([]);

    useEffect(() => {
        const getData = async () => {
            try{
                console.log("selected:", selectedCompanies)
                const locData = await axios.post("/api/analyzer/data", { years: availableYears, datasource: refName(source), companies: selectedCompanies });
                console.log(locData);
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
                return "Bauleistungen Neubau"
            case SourceReference.MODERNIZINGS:
                return "Bauleistungen Instandhaltung/Modernisierung"
            case SourceReference.FLATS:
                return "Wohneinheiten"
            case SourceReference.BUSINESSES:
                return "Gewerbeeinheiten"
        }
    }

    const constructOptions = () => {
        const options: Array<{label: string, value: string}> = [];
        const years = availableYears.sort((a, b) => {
            const yearA = parseInt(a);
            const yearB = parseInt(b);

            if(yearA > yearB) return 1;
            if(yearA < yearB) return -1;
            return 0;
        });

        years.forEach((year) => {
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
                <SalesChart unit={unit} data={data} step={stepSize} max={max} selectedYears={selectedYears} selectedCompanies={selectedCompanies} title={getTitle()} mode={mode} />
            </div>
            <div className="inputcontainer">
                <h5 style={{ marginBottom: 13, marginLeft: 16 }}>Bitte auswählen:</h5>
                <Select
                    className="chartselect"
                    placeholder="Einzelunternehmen der WohnBau Gruppe"
                    onChange={(selected: string) => {
                        let compdata: Array<Company> = [];
                        //selected.forEach((sel: string) => {
                            const sel = selected;
                            console.log(sel);
                            switch(sel){
                                case("WOHNBAU"):
                                    compdata.push(Company.WOHNBAU);
                                    break;
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
                        //})

                        //compdata.push(Company.WOHNBAU);

                        setSelectedCompanies(compdata);
                    }}
                    options={[
                        {label: "WohnBau Westmünsterland eG", value: "WOHNBAU"},
                        {label: "Kommunale Siedlungs- und Wohnungsbaugesellschaft mbH", value: "SIEDLUNG"},
                        {label: "Kreisbauverein GmbH", value: "KREISBAU"},
                        {label: "Wohnungsbaugesellschaft Kreis Steinfurt mbH", value: "STEINFURT"},
                    ]}
                />
                <Select
                    className="chartselect"
                    placeholder="Bitte auswählen"
                    defaultValue={"SALES"}
                    onChange={(selected: string) => {
                        switch(selected){
                            case "SALES":
                                setStepSize(1);
                                setMax(15000);
                                setSource(SourceReference.SALES);
                                setUnit("T€");
                                break;
                            case "OVERSHOOT":
                                setStepSize(1);
                                setMax(5000);
                                setSource(SourceReference.OVERSHOOT);
                                setUnit("T€");
                                break;
                            case "PROCEEDS":
                                setStepSize(1);
                                setMax(150000);
                                setSource(SourceReference.PROCEEDS);
                                setUnit("T€");
                                break;
                            case "CAPITAL":
                                setStepSize(1);
                                setMax(100);
                                setSource(SourceReference.CAPITAL);
                                setUnit("%");
                                break;
                            case "NEWBUILDINGS":
                                setStepSize(1);
                                setMax(10000);
                                setSource(SourceReference.NEWBUILDINGS);
                                setUnit("T€");
                                break;
                            case "MODERNIZINGS":
                                setStepSize(1);
                                setMax(5000);
                                setSource(SourceReference.MODERNIZINGS);
                                setUnit("T€");
                                break;
                            case "FLATS":
                                setStepSize(1);
                                setMax(2500);
                                setSource(SourceReference.FLATS);
                                setUnit("");
                                break;
                            case "BUSINESSES":
                                setStepSize(1);
                                setMax(10);
                                setSource(SourceReference.BUSINESSES);
                                setUnit("");
                                break;
                        }
                    }}
                    options={[
                        {label: "Umsatzerlöse", value: "SALES"},
                        {label: "Jahresüberschuss", value: "OVERSHOOT"},
                        {label: "Bilanzsumme", value: "PROCEEDS"},
                        {label: "Eigenkapitalquote", value: "CAPITAL"},
                        {label: "Bauleistungen Neubau", value: "NEWBUILDINGS"},
                        {label: "Bauleistungen Instandhaltung/Modernisierung", value: "MODERNIZINGS"},
                        {label: "Wohneinheiten", value: "FLATS"},
                        {label: "Gewerbeeinheiten", value: "BUSINESSES"},
                    ]}
                />
                <Select
                    className="chartselect"
                    mode="multiple"
                    allowClear
                    placeholder="Bitte auswählen"
                    defaultValue={[availableYears[availableYears.length - 1]]}
                    onChange={(selected: Array<string>) => {
                        const sortedYears = selected.sort((a, b) => {
                            if(parseInt(a) > parseInt(b)){
                                return 1;
                            }else if(parseInt(a) < parseInt(b)){
                                return -1;
                            }else{
                                return 0;
                            }
                        });

                        setSelectedYears(sortedYears);
                    }}
                    options={constructOptions()}
                />
                <Select
                    className="chartselect"
                    placeholder="Bitte auswählen"
                    defaultValue={"bar"}
                    onChange={(selected: string) => {
                        setMode(selected);
                    }}
                    options={[
                        {label: "Balkendiagramm", value: "bar"},
                        {label: "Liniendiagramm", value: "line"}
                    ]}
                />
            </div>
        </>
    );
}