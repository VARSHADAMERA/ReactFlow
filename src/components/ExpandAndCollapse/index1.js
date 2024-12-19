import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactFlow, {
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowProvider,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';

import './index.css';

const initialNodes = [
    {
        id: '1',
        name : 'a',
        children: [
            {
                id: '2',
                name : 'b',
                parent: '1',
                children : [
                    {
                        id: '3',
                        name: 'c',
                        parent: '2',
                        children: [
                            {
                                id: '4',
                                parent: '3',
                                name: 'd',
                            }
                        ]
                    }
                ]
            },
            {
                id: '5',
                name : 'b',
                parent: '1',
                children : [
                    {
                        id: '6',
                        name: 'c',
                        parent: '5',
                        children: [
                            {
                                id: '7',
                                parent: '6',
                                name: 'd',
                            }
                        ]
                    }
                ]
            },
            {
                id: '8',
                name : 'b',
                parent: '1',
                children : [
                    {
                        id: '9',
                        name: 'c',
                        parent: '8',
                        children: [
                            {
                                id: '10',
                                parent: '9',
                                name: 'd',
                            }
                        ]
                    }
                ]
            },
            {
                id: '11',
                name : 'f',
                parent: '1',
            }
        ]
    }
]

const initialEdges = [
  {
    id: 'edges-e5-7',
    source: '0',
    target: '1',
    label: '+',
    labelBgPadding: [8, 4],
    labelBgBorderRadius: 4,
    labelBgStyle: { fill: '#FFCC00', color: '#fff', fillOpacity: 0.7 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  }
]

let id = 1;
const getId = () => `${id++}`;

const fitViewOptions = {
  padding: 1,
};

const ExpandAndCollapse = (props) => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), []);

  useEffect(()=>{
    setNodes([...initialNodes.map((item)=>{
        return {
            id: item.id,
            type: item?.children?.length ? 'default': 'output',
            data: { label: item.name, children: item.children },
            position: { x: 0, y: 0 },
            sourcePosition: 'right',
            targetPosition: 'left'
        }
    })])
  },[])

  const handleNodeClick = (e, data) => {
    // Helper function to recursively find all descendant node IDs
    const getDescendants = (nodeId) => {
      const directChildren = nodes.filter((node) => node?.data?.parent === nodeId);
      let allDescendants = [...directChildren.map((child) => child.id)];
  
      directChildren.forEach((child) => {
        allDescendants = [...allDescendants, ...getDescendants(child.id)];
      });
  
      return allDescendants;
    };
  
    // Find all existing children and descendants of the clicked node
    const descendants = getDescendants(data.id);
  
    if (descendants.length === 0) {
      // If there are no descendants, add child nodes
      const itemChildren = data.data.children.map((item, i) => ({
        id: item.id,
        type: item?.children?.length ? 'default' : 'output',
        data: { label: item.name, children: item.children, parent: item.parent },
        position: {
          x: data.position.x + 200,
          y: i === 0 ? data.position.y : data.position.y + i * 100,
        },
        sourcePosition: 'right',
        targetPosition: 'left',
      }));
  
      // Add edges for the new child nodes
      const newEdges = itemChildren.map((item) => ({
        id: String(parseInt(Math.random() * 1000000)),
        source: item?.data?.parent,
        target: item.id,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      }));
  
      setNodes(nodes.concat(itemChildren));
      setEdges(edges.concat(newEdges));
    } else {
      // Remove all descendants and their edges
      setNodes(nodes.filter((node) => !descendants.includes(node.id)));
      setEdges(edges.filter((edge) => !descendants.includes(edge.source) && !descendants.includes(edge.target)));
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
        defaultViewport={{x:1, y:1, zoom:0.5}}
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