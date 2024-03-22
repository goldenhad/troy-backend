import { getColor } from '@/helper/charts';
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
    data: Array<SalesData>,
    selectedYears: Array<string>,
    mode: string,
    title: string
}

export type SalesData = {
    year: number,
    value: number
}

export type DataSet = {
    label: string,
    data: Array<number>,
    backgroundColor: string
}



export default function SalesChart({ data, title, mode, selectedYears }: ComponentProps){
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
    };

    useEffect(() => {
        let sets: Array<DataSet> = [];
        if(mode == "bar"){
            data.forEach((entry: SalesData, idx: number) => {
                if (selectedYears?.includes(entry.year.toString())){
                    sets.push({
                        label: entry.year.toString(),
                        data: [ entry.value ],
                        backgroundColor: getColor(idx)
                    });
                }
            });
        }else{
            let labels = selectedYears;
            let datavalues: number[] = [];
            data.forEach((entry: SalesData, idx: number) => {
                if (selectedYears?.includes(entry.year.toString())){
                    datavalues.push(entry.value);
                }
            });

            sets.push({
                label: "Umsatz",
                data: datavalues,
                backgroundColor: getColor(1)
            });
        }

        setDatasets(sets);
    }, [selectedYears, data, mode]);


    

    const getChart = () => {
        if(mode=="bar"){
            return(
                <Bar
                options={options}
                data={{
                    labels: [title],
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
