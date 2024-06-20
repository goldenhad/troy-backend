import { getColor } from '@/helper/charts';
import { Company } from '@/pages/quick-analyzer';
import { Select } from 'antd';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    PointElement,
    LineElement,
  } from 'chart.js';
import { useEffect, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

type ComponentProps = {
    data: Array<CompanyEntry>,
    selectedYears: Array<string>,
    selectedCompanies: Array<Company>
    mode: string,
    title: string,
    step: number,
    max: number,
    unit: string
}

export type SalesData = {
    year: number,
    value: number
}

export type DataSet = {
    label: string,
    data: Array<number>,
    backgroundColor: string,
    borderColor?: string,
}

type CompanyEntry = {
    key: Company,
    items: Array<SalesData>
}


const CompanyToString = (sel: Company) => {
    switch(sel){
        case(Company.WOHNBAU):
            return "WohnBau Westmünsterland eG";
        case(Company.SIEDLUNG):
            return "Kommunale Siedlungs- und Wohnungsbaugesellschaft mbH";
        case(Company.KREISBAU):
            return "Kreisbauverein GmbH";
        case(Company.STEINFURT):
            return "Wohnungsbaugesellschaft Kreis Steinfurt mbH";
        case(Company.UNDEFINED):
            return "";
    }
}


export default function SalesChart({ data, title, mode, selectedYears, step, max, unit }: ComponentProps){
    const [ datasets, setDatasets ] = useState<Array<DataSet>>([]);

    const options = {
        responsive: true,
        plugins: {
                legend: {
                    position: 'top' as const,
                },
                title: {
                display: true,
                text: `${title} pro Jahr`,
            },
        },
        scales: {
            x: {
              stacked: true
            },
            y: {
                stacked: true,
                beginAtZero: true,
                steps: 10,
                stepValue: (max*step)/10,
                max: max*step,
                ticks : {
                    callback: (val: any) => {
                        return val + " " + unit
                    }
                }
              }
        }
    };

    useEffect(() => {
        console.log(data);
        let sets: Array<DataSet> = [];

        data.forEach((compEntry: CompanyEntry, idx: number) => {
            let datapoints: Array<number> = [];

            if(mode){
                compEntry.items.forEach((entry: SalesData) => {
                    if (selectedYears?.includes(entry.year.toString())){
                        datapoints.push(entry.value * step);
                    }
                });

                sets.push({
                    label: CompanyToString(compEntry.key),
                    data: datapoints,
                    backgroundColor: "000000"
                });
            }
        });

        for(let i=0; i < sets.length; i++){
            const reversedIndex = (sets.length - 1) - i;

            sets[i].backgroundColor = getColor(reversedIndex);
            sets[i].borderColor = getColor(reversedIndex);
        }

        setDatasets(sets);
    }, [selectedYears, data, mode]);


    

    const getChart = () => {
        if(mode=="bar"){
            return(
                <Bar
                options={options}
                data={{
                    labels: selectedYears,
                    datasets: datasets
                }}
            />
            );
        }else{
            return(
                <Line
                options={options}
                data={{
                    labels: selectedYears,
                    datasets: datasets
                }}
            />
            );
        }
    }


    return (
        <>
            {getChart()}
        </>
    );

}
