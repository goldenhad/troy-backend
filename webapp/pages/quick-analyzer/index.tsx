import "./style.scss"
import { GetServerSideProps } from "next";
import fs from 'fs';
import { getAllYearsPublished } from "@/helper/filefunctions";
import SalesChart from "@/components/analyzer/sales/sales";

export type InitialProps = {
    availableYears: Array<string>
}


const labels = ['January', 'February', 'March', 'April', 'May', 'June', 'July'];



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


    return { props: { availableYears: years } };
};

export default function QuickAnalyzer({ availableYears }: InitialProps){

    const fakedata = [
        {
            year: 2019,
            value: 3333,
        },
        {
            year: 2020,
            value: 4444,
        },
        {
            year: 2021,
            value: 5555,
        },
        {
            year: 2022,
            value: 6666,
        },
        {
            year: 2023,
            value: 3333,
        },
        {
            year: 2024,
            value: 4444,
        },
        {
            year: 2025,
            value: 5555,
        },
        {
            year: 2026,
            value: 6666,
        },
    ]

    return(
        <SalesChart data={fakedata} availableYears={["2023", "2024", "2025", "2026"]}/>
    );
}