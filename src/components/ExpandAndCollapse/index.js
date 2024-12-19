import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MiniMap, Controls } from 'reactflow';
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
import initialNodesData from '../../output/output.json';  

const fitViewOptions = {
  padding: 1,
};

const ExpandAndCollapse = () => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), []);

  // Helper function to build nodes for display
  const buildNodes = (data, parentPosition = { x: 0, y: 0 }, parentId = null) => {
    const childOffset = 100; // Space between child nodes
    return data.map((item, index) => ({
      id: item.id,
      type: item.children?.length ? 'default' : 'output',
      data: { label: item.name, children: item.children, parent: parentId },
      position: {
        x: parentPosition.x + (parentId ? 200 : 0), // Indent child nodes
        y: parentPosition.y + index * childOffset,
      },
      sourcePosition: 'right',
      targetPosition: 'left',
    }));
  };

  // Initialize only parent nodes
  useEffect(() => {
    const parentNodes = buildNodes(
      initialNodesData,
      { x: 0, y: 0 },
      null // No parent for root nodes
    );
    setNodes(parentNodes);
  }, []);

  // Handle node click: expand/collapse children
  const handleNodeClick = (e, clickedNode) => {
    const isNodeExpanded = nodes.some(
      (node) => node.data.parent === clickedNode.id
    );

    if (isNodeExpanded) {
      // Collapse all children and their descendants
      const getDescendants = (nodeId) => {
        const directChildren = nodes.filter(
          (node) => node.data.parent === nodeId
        );
        let allDescendants = [...directChildren.map((child) => child.id)];
        directChildren.forEach((child) => {
          allDescendants = [...allDescendants, ...getDescendants(child.id)];
        });
        return allDescendants;
      };

      const descendants = getDescendants(clickedNode.id);
      setNodes(nodes.filter((node) => !descendants.includes(node.id)));
      setEdges(
        edges.filter(
          (edge) =>
            !descendants.includes(edge.source) &&
            !descendants.includes(edge.target)
        )
      );
    } else {
      // Expand immediate children only
      const childNodes = buildNodes(
        clickedNode.data.children || [],
        clickedNode.position,
        clickedNode.id
      );

      const childEdges = childNodes.map((child) => ({
        id: `edge-${clickedNode.id}-${child.id}`,
        source: clickedNode.id,
        target: child.id,
        markerEnd: { type: MarkerType.ArrowClosed },
      }));

      setNodes((prevNodes) => [...prevNodes, ...childNodes]);
      setEdges((prevEdges) => [...prevEdges, ...childEdges]);
    }
  };

  return (
    <div className="wrapper" ref={reactFlowWrapper}>
      {/* Application Header */}
      <h1 style={{ textAlign: 'center', marginTop: '10px', color: '#ffffff' }}>Graphify</h1>
      <p style={{ textAlign: 'center', color: '#cccccc', marginBottom: '20px' }}>
        An interactive application to explore and expand hierarchical data visually.
      </p>
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
    <MiniMap/>
    <Controls/>
  </ReactFlowProvider>
);

