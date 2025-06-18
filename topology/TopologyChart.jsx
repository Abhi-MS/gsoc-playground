import React, { useState, useEffect, useRef } from 'react';
import { Network } from 'vis-network/standalone';

const TopologyChart = () => {
  const [graph, setGraph] = useState({ nodes: [], edges: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const networkRef = useRef(null);

  const options = {
    layout: { hierarchical: false, improvedLayout: false },
    physics: {
      enabled: true,
      solver: 'barnesHut',
      timestep: 0.1,
      stabilization: { iterations: 100, updateInterval: 25 },
    },
    edges: { color: '#BBBBBB', width: 2 },
    nodes: {
      shape: 'dot',
      size: 15,
      color: '#1E90FF',
      font: { size: 12, color: 'black' },
    },
    interaction: { hover: true, tooltipDelay: 100, dragNodes: true, zoomView: true },
    manipulation: { enabled: false },
  };

  useEffect(() => {
    if (graph.nodes.length === 0 || graph.edges.length === 0 || !containerRef.current) return;

    const network = new Network(containerRef.current, graph, options);
    networkRef.current = network;

    console.log("Nodes:", graph.nodes);
    console.log("Edges:", graph.edges);

    // Cluster every 10 nodes
    for (let i = 0; i < graph.nodes.length; i += 10) {
      const clusterId = `cluster-${i}`;
      const nodeRange = graph.nodes.slice(i, i + 10).map(n => n.id);

      network.cluster({
        joinCondition: node => nodeRange.includes(node.id),
        clusterNodeProperties: {
          id: clusterId,
          label: `Group ${i}-${i + 9}`,
          shape: 'dot',
          size: 35,
          color: 'rgba(255,165,0,0.6)',
        },
      });

      const clustered = network.getNodesInCluster?.(clusterId) || [];
      if (clustered.length > 0) {
        console.log(`Cluster ${clusterId} created with nodes:`, clustered);
      } else {
        console.warn(`Cluster ${clusterId} was not applied.`);
      }
    }

    // Handle cluster open on click
    network.on('click', (params) => {
      if (params.nodes.length === 1 && network.isCluster(params.nodes[0])) {
        console.log(`Opening cluster ${params.nodes[0]}`);
        network.openCluster(params.nodes[0]);
      }
    });

    // Handle node selection: highlight one, grey out others
    network.on('selectNode', (event) => {
      const selectedNodeId = event.nodes[0];
      const nodes = network.body.data.nodes.get();
      const edges = network.body.data.edges.get();

      nodes.forEach((node) => {
        network.body.data.nodes.update({
          id: node.id,
          color: {
            background: node.id === selectedNodeId ? '#FF6347' : '#D3D3D3',
            border: '#555',
          },
          font: {
            color: node.id === selectedNodeId ? 'black' : '#A9A9A9',
          },
        });
      });

      edges.forEach((edge) => {
        const isConnected = edge.from === selectedNodeId || edge.to === selectedNodeId;
        network.body.data.edges.update({
          id: edge.id,
          color: isConnected ? '#555' : '#DDD',
        });
      });
    });

    // Reset on deselect
    network.on('deselectNode', () => {
      const nodes = network.body.data.nodes.get();
      const edges = network.body.data.edges.get();

      nodes.forEach((node) => {
        network.body.data.nodes.update({
          id: node.id,
          color: { background: '#1E90FF', border: '#555' },
          font: { color: 'black' },
        });
      });

      edges.forEach((edge) => {
        network.body.data.edges.update({
          id: edge.id,
          color: '#BBBBBB',
        });
      });
    });

  }, [graph]);

  useEffect(() => {
    if (!networkRef.current || !searchTerm) return;

    const network = networkRef.current;
    const node = network.body.data.nodes.get(searchTerm);

    if (node) {
      network.focus(searchTerm, { scale: 1.5, animation: false });

      const nodes = network.body.data.nodes.get();
      nodes.forEach((n) => {
        network.body.data.nodes.update({
          id: n.id,
          color: {
            background: n.id === searchTerm ? '#FF6347' : '#D3D3D3',
            border: '#555',
          },
          font: {
            color: n.id === searchTerm ? 'black' : '#A9A9A9',
          },
        });
      });
    } else {
      console.warn(`Node with ID ${searchTerm} does not exist.`);
    }
  }, [searchTerm]);

  const handleDataFetched = () => {
    const nodeCount = 100;
    const edgeCount = 200;
    const nodesArray = Array.from({ length: nodeCount }, (_, i) => ({
      id: `node-${i}`,
      label: `Node ${i}`,
      color: '#1E90FF',
    }));

    const edgesArray = [];
    const edgeSet = new Set();

    for (let i = 0; i < edgeCount; i++) {
      let from, to;
      do {
        from = `node-${Math.floor(Math.random() * nodeCount)}`;
        to = `node-${Math.floor(Math.random() * nodeCount)}`;
      } while (from === to || edgeSet.has(`${from}-${to}`) || edgeSet.has(`${to}-${from}`));

      edgeSet.add(`${from}-${to}`);
      edgesArray.push({ from, to });
    }

    setGraph({ nodes: nodesArray, edges: edgesArray });
  };

  return (
    <div>
      <h1>Network Topology</h1>
      <button onClick={handleDataFetched}>Generate Data</button>
      <input
        type="text"
        placeholder="Search for node..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ margin: '10px', padding: '5px' }}
      />
      {graph.nodes.length > 0 && (
        <div ref={containerRef} style={{ height: '640px', width: '100%' }} />
      )}
    </div>
  );
};

export default TopologyChart;
