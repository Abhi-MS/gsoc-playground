"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Network,
  DataSet,
  Node,
  Edge,
  Options,
} from "vis-network/standalone/esm/vis-network";

interface TopologyChartProps {
  zoneId: string;
}

const TopologyChart: React.FC<TopologyChartProps> = ({ zoneId }) => {
  const [graph, setGraph] = useState<{ nodes: Node[]; edges: Edge[] }>({
    nodes: [],
    edges: [],
  });
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const networkRef = useRef<Network | null>(null);
  const nodesData = useRef<DataSet<Node> | null>(null);
  const edgesData = useRef<DataSet<Edge> | null>(null);

  const options: Options = {
    layout: { hierarchical: false },
    physics: {
      enabled: true,
      solver: "barnesHut",
      stabilization: { iterations: 100, updateInterval: 25 },
    },
    edges: { color: "#BBBBBB", width: 2 },
    nodes: {
      shape: "dot",
      size: 15,
      color: "#1E90FF",
      font: { size: 12, color: "black" },
    },
    interaction: {
      hover: true,
      tooltipDelay: 100,
      dragNodes: true,
      zoomView: true,
    },
  };

  const fetchZoneTopology = async () => {
    try {
      const response = await fetch(
        "http://localhost:7000/switchmap/api/graphql",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `
            query GetZoneDevices($id: ID!) {
              zone(id: $id) {
                devices {
                  edges {
                    node {
                      sysName
                      l1interfaces {
                        edges {
                          node {
                            cdpcachedeviceid
                            cdpcachedeviceport
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          `,
            variables: { id: zoneId },
          }),
        }
      );

      const result = await response.json();
      const nodesSet = new Set<string>();
      const edgesArray: Edge[] = [];

      const deviceEdges = result?.data?.zone?.devices?.edges ?? [];

      for (const { node: device } of deviceEdges) {
        const sysName = device?.sysName;
        if (!sysName) continue;

        nodesSet.add(sysName);

        for (const { node: iface } of device?.l1interfaces?.edges ?? []) {
          const target = iface?.cdpcachedeviceid;
          const port = iface?.cdpcachedeviceport;

          if (target) {
            nodesSet.add(target);
            edgesArray.push({
              from: sysName,
              to: target,
              label: port,
              color: "#BBBBBB",
            });
          }
        }
      }

      const nodesArray: Node[] = Array.from(nodesSet).map((id) => ({
        id,
        label: id,
        color: "#1E90FF",
      }));

      setGraph({ nodes: nodesArray, edges: edgesArray });
    } catch (err) {
      console.error("Failed to fetch topology:", err);
    }
  };

  useEffect(() => {
    fetchZoneTopology();
  }, [zoneId]);

  useEffect(() => {
    if (!containerRef.current || graph.nodes.length === 0) return;

    nodesData.current = new DataSet<Node>(graph.nodes);
    edgesData.current = new DataSet<Edge>(graph.edges);

    networkRef.current = new Network(
      containerRef.current,
      {
        nodes: nodesData.current,
        edges: edgesData.current,
      },
      options
    );
    networkRef.current.on("click", (params) => {
      if (params.nodes.length === 1) {
        const nodeId = params.nodes[0];
        window.location.href = `/devices/${nodeId}`;
      }
    });

    // Node selection highlighting
    networkRef.current.on("selectNode", ({ nodes }) => {
      const selected = nodes[0];
      if (!nodesData.current || !edgesData.current) return;

      nodesData.current.forEach((node) => {
        nodesData.current!.update({
          id: node.id,
          color: {
            background: node.id === selected ? "#FF6347" : "#D3D3D3",
            border: "#555",
          },
          font: {
            color: node.id === selected ? "black" : "#A9A9A9",
          },
        });
      });

      edgesData.current.forEach((edge) => {
        const connected = edge.from === selected || edge.to === selected;
        edgesData.current!.update({
          id: edge.id,
          color: connected ? "#555" : "#DDD",
        });
      });
    });

    // Reset highlight on deselect
    networkRef.current.on("deselectNode", () => {
      if (!nodesData.current || !edgesData.current) return;

      nodesData.current.forEach((node) => {
        nodesData.current!.update({
          id: node.id,
          color: { background: "#1E90FF", border: "#555" },
          font: { color: "black" },
        });
      });

      edgesData.current.forEach((edge) => {
        edgesData.current!.update({
          id: edge.id,
          color: "#BBBBBB",
        });
      });
    });
  }, [graph]);

  useEffect(() => {
    if (!searchTerm || !nodesData.current || !networkRef.current) return;

    const node = nodesData.current.get(searchTerm);
    if (!node) {
      console.warn(`Node "${searchTerm}" not found.`);
      return;
    }

    networkRef.current.focus(searchTerm, { scale: 1.5, animation: true });

    nodesData.current.get().forEach((n) => {
      nodesData.current!.update({
        id: n.id,
        color: {
          background: n.id === searchTerm ? "#FF6347" : "#D3D3D3",
          border: "#555",
        },
        font: {
          color: n.id === searchTerm ? "black" : "#A9A9A9",
        },
      });
    });
  }, [searchTerm]);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Network Topology</h2>
      <input
        className="border p-2 rounded mb-4 w-full max-w-sm"
        type="text"
        placeholder="Search node ID..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div
        ref={containerRef}
        className="w-full h-[70vh] border rounded shadow"
      />
    </div>
  );
};

export default TopologyChart;
