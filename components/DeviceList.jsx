"use client";

import { useEffect, useState } from "react";

export default function DevicesList() {
  const [devices, setDevices] = useState<{ id: string; sysName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const res = await fetch("http://localhost:7000/switchmap/api/graphql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `
                        {
                          devices {
                            edges {
                              node {
                                id
                                sysName
                              }
                            }
                          }
                        }
                      `,
          }),
        });
        const json = await res.json();
        setDevices(
          json.data?.devices?.edges?.map((edge: any) => edge.node) || []
        );
      } catch (err) {
        setError("Failed to fetch devices");
      } finally {
        setLoading(false);
      }
    };
    fetchDevices();
  }, []);

  if (loading) return <p>Loading devices...</p>;
  if (error) return <p>{error}</p>;
  if (!devices.length) return <p>No devices found.</p>;

  return (
    <ul>
      {devices.map((device) => (
        <li key={device.id}>
          {device.sysName} (ID: {device.id})
        </li>
      ))}
    </ul>
  );
}
