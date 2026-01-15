"use client";

import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import type { ChartData } from "chart.js";
import { Loader2 } from "lucide-react";

// Type definitions
type DailyViewData = {
  date: string;
  views: number;
  day: string;
  fullDate: string;
};

interface DailyViewsChartProps {
  data?: DailyViewData[];
  isLoading?: boolean;
}

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip
);

const DailyViewsChart: React.FC<DailyViewsChartProps> = ({
  data,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-[#A1A1AA]" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        No view data available
      </div>
    );
  }

  // Prepare chart data with full date information for tooltips
  const chartData: ChartData<"line"> = {
    labels: data.map((item: DailyViewData) => item.day),
    datasets: [
      {
        label: "Views",
        data: data.map((item: DailyViewData) => item.views),
        borderColor: "#8b5cf6",
        backgroundColor: "rgba(139, 92, 246, 0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointBackgroundColor: "#8b5cf6",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: "index" as const,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        titleColor: "#ffffff",
        bodyColor: "#e2e8f0",
        borderColor: "rgba(148, 163, 184, 0.3)",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: function (context) {
            // Get the full date from the data array using the index
            const index = context[0].dataIndex;
            if (index !== undefined && data[index]) {
              return data[index].fullDate || context[0].label;
            }
            return context[0].label;
          },
          label: function (context) {
            const value = context.parsed.y;
            if (value !== null && value !== undefined) {
              return `Views: ${value.toLocaleString()}`;
            }
            return "Views: 0";
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: "rgba(71, 85, 105, 0.2)",
        },
        border: {
          display: false,
        },
        ticks: {
          color: "#94a3b8",
          font: {
            size: 11,
          },
          maxRotation: 0,
          callback: function (value: any, index: number) {
            // Show every 5th label to avoid crowding
            if (index % 5 === 0 || index === data.length - 1) {
              return this.getLabelForValue(value);
            }
            return "";
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(71, 85, 105, 0.2)",
        },
        border: {
          display: false,
        },
        ticks: {
          color: "#94a3b8",
          font: {
            size: 11,
          },
          callback: function (value: any) {
            if (typeof value === "number") {
              return value.toLocaleString();
            }
            return value;
          },
        },
      },
    },
  };

  return (
    <div className="w-full h-[350px]">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default DailyViewsChart;