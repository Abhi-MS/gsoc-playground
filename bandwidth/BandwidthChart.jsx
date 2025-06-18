import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const BandwidthChart = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("http://localhost:7000/switchmap/api/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
          {
            allBandwidthUsage {
              id
              deviceId
              timestamp
              totalBps
            }
          }
        `,
      }),
    })
      .then((res) => res.json())
      .then((result) => {
        const formattedData = result.data.allBandwidthUsage.map((entry) => ({
          timestamp: new Date(entry.timestamp).toLocaleTimeString(),
          totalBps: entry.totalBps,
        }));
        setData(formattedData);
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  return (
    <div style={{ width: "100%", height: "300px" }}>
      <LineChart width={500} height={300} data={data}>
        <XAxis dataKey="timestamp" />
        <YAxis />
        <Tooltip />
        <CartesianGrid strokeDasharray="3 3" />
        <Line type="monotone" dataKey="totalBps" stroke="#8884d8" />
      </LineChart>
    </div>
  );
};

export default BandwidthChart;
