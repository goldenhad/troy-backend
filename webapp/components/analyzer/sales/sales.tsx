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
  } from 'chart.js';
import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

type ComponentProps = {
    data: Array<SalesData>,
    availableYears: Array<string>
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

export const options = {
    responsive: true,
    plugins: {
            legend: {
            position: 'top' as const,
        },
            title: {
            display: true,
            text: 'Chart.js Bar Chart',
        },
    },
};


export default function SalesChart({ data, availableYears }: ComponentProps){
    const [ selectedYears, setSelectedYears ] = useState<Array<string>>([availableYears[availableYears.length - 1]]);
    const [ datasets, setDatasets ] = useState<Array<DataSet>>([]);

    useEffect(() => {
        let sets: Array<DataSet> = [];
        data.forEach((entry: SalesData, idx: number) => {
            if (selectedYears?.includes(entry.year.toString())){
                sets.push({
                    label: entry.year.toString(),
                    data: [ entry.value ],
                    backgroundColor: getColor(idx)
                });
            }
        });

        setDatasets(sets);
    }, [selectedYears, data]);


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


    return (
        <>
            <Bar
                options={options}
                data={{
                    labels: ["Umsatz"],
                    datasets: datasets
                }}
            />
            <Select
                mode="multiple"
                allowClear
                style={{ width: '100%' }}
                placeholder="Please select"
                defaultValue={[availableYears[availableYears.length - 1]]}
                onChange={(selected: Array<string>) => {
                    setSelectedYears(selected);
                }}
                options={constructOptions()}
            />
        </>
    );

}
