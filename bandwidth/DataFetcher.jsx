import React, { useEffect, useState } from 'react';

const DataFetcher = ({ onDataFetched }) => {
  const [loading, setLoading] = useState(true);

  const fetchDataFromAPI = async () => {
    try {
      // Replace with your actual API URL and GraphQL query
      const response = await fetch('http://localhost:7000/switchmap/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            {
              l1interfaces {
                edges {
                  node {
                    cdpcachedeviceid
                    cdpcachedeviceport
                    device {
                      sysName
                    }
                  }
                }
              }
            }
          `,
        }),
      });

      const data = await response.json();


      const sysNames = new Set();  // Use Set to store unique sysNames
      const edges = [];

      if (data?.data?.l1interfaces?.edges) {
        data.data.l1interfaces.edges.forEach((edge) => {
          const sysName = edge.node.device?.sysName;  // Get sysName from the nested device field
          const deviceName = edge.node.cdpcachedeviceid;
          const devicePort = edge.node.cdpcachedeviceport;

          if (sysName && deviceName) {
            sysNames.add(sysName);  // Adding sysName ensures uniqueness
            edges.push({
              from: sysName,  // Connection from system (sysName of the CDP device)
              to: deviceName, // Connection to the device port (label)
              label: devicePort,
            });
          }
        });
      }

      // Convert sysNames Set to an array
      const uniqueSysNames = Array.from(sysNames);

      // Once data is fetched, pass unique sysNames and edges to the parent component
      onDataFetched(uniqueSysNames, edges);
      setLoading(false); // Set loading state to false after fetching is complete
    } catch (error) {
      console.error('Error fetching data from API:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loading) {
      fetchDataFromAPI(); // Trigger API fetch when component is loaded
    }
  }, [loading]); // Empty dependency array ensures it runs once on mount

  return null; // This component doesn't render any UI
};

export default DataFetcher;
