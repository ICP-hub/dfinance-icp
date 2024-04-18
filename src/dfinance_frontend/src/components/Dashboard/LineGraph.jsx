import React from 'react'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js"
import { Line } from "react-chartjs-2"

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
)

export const options = {
    responsive: true,
    plugins: {
        legend: {
            position: "top",
            display: false,
        }
    },
    elements: {
        line: {
            tension: 0.4,
        },
    },
}

const labels = ["January", "February", "March", "April", "May", "June", "July"]

export const data = {
    labels,
    datasets: [
        {
            label: "Supply APR",
            data: [40, 30, 60, 70, 30, 69, 20, 70, 80, 55],
            borderColor: "#A94DFFA5",
            backgroundColor: "#A94DFFA5",
        },
    ],
}

const LineGraph = () => {
  return (
      <Line options={options} data={data} />
  )
}

export default LineGraph