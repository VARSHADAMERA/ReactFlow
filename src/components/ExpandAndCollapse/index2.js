import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactFlow, {
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowProvider,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './index.css';

// Import JSON Data
import initialNodesData from './output.json';

const fitViewOptions = {
  padding: 1,
};

const ExpandAndCollapse = () => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), []);

  // Recursively build initial nodes from nested JSON
  const buildNodes = (data, parentPosition = { x: 0, y: 0 }, depth = 0) => {
    let builtNodes = [];
    const childOffset = 100; // Space between children nodes

    data.forEach((item, index) => {
      const position = {
        x: parentPosition.x + 200,
        y: parentPosition.y + index * childOffset,
      };

      builtNodes.push({
        id: item.id,
        type: item.children?.length ? 'default' : 'output',
        data: { label: item.name, children: item.children, parent: item.parent },
        position,
        sourcePosition: 'right',
        targetPosition: 'left',
      });

      // Recursively add child nodes
      if (item.children && item.children.length) {
        builtNodes = [
          ...builtNodes,
          ...buildNodes(item.children, position, depth + 1),
        ];
      }
    });

    return builtNodes;
  };

  // Initialize nodes and edges
  useEffect(() => {
    const newNodes = buildNodes(initialNodesData);
    setNodes(newNodes);

    const newEdges = newNodes
      .filter((node) => node.data.parent)
      .map((node) => ({
        id: `edge-${node.data.parent}-${node.id}`,
        source: node.data.parent,
        target: node.id,
        markerEnd: { type: MarkerType.ArrowClosed },
      }));

    setEdges(newEdges);
  }, []);

  const handleNodeClick = (e, data) => {
    // Recursive helper to find descendant node IDs
    const getDescendants = (nodeId) => {
      const directChildren = nodes.filter((node) => node.data.parent === nodeId);
      let allDescendants = [...directChildren.map((child) => child.id)];

      directChildren.forEach((child) => {
        allDescendants = [...allDescendants, ...getDescendants(child.id)];
      });

      return allDescendants;
    };

    // Toggle visibility of children
    const descendants = getDescendants(data.id);
    if (descendants.length === 0 && data.data.children?.length) {
      const childNodes = buildNodes(data.data.children, data.position);
      const childEdges = childNodes.map((child) => ({
        id: `edge-${data.id}-${child.id}`,
        source: data.id,
        target: child.id,
        markerEnd: { type: MarkerType.ArrowClosed },
      }));

      setNodes([...nodes, ...childNodes]);
      setEdges([...edges, ...childEdges]);
    } else {
      setNodes(nodes.filter((node) => !descendants.includes(node.id)));
      setEdges(
        edges.filter(
          (edge) =>
            !descendants.includes(edge.source) &&
            !descendants.includes(edge.target)
        )
      );
    }
  };

  return (
    <div className="wrapper" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        fitView
        maxZoom={0.9}
        defaultViewport={{ x: 1, y: 1, zoom: 0.5 }}
        fitViewOptions={fitViewOptions}
      />
    </div>
  );
};

export default () => (
  <ReactFlowProvider>
    <ExpandAndCollapse />
  </ReactFlowProvider>
);


