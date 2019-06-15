import React, { useState } from 'react';
import FontAwesome from 'react-fontawesome';
import * as d3dag from 'd3-dag';
import Graph from './Graph/Graph';
import { randomColor } from './utils';
import FileUploader from './FileUploader/';
import CPD from './CPD/'
import Checkbox from '@material-ui/core/Checkbox';
import { makeStyles } from '@material-ui/core/styles';
import { findActiveTrails } from './Graph/GraphUtils'
import './App.css';

const dagStratify = d3dag.dagStratify();

function App() {
  const [ width, setWidth ] = useState(20)
  const [ clickedNode, setClickedNode ] = useState(undefined);
  const [ graph, setGraph ] = useState(undefined);
  const [ networkName, setNetworkName ] = useState(undefined);
  const [ cpd, setCpd ] = useState(undefined);
  const [ showArcStrengths, setShowArcStrengths ] = useState(false);
  const [ trashHovered, setTrashHovered ] = useState(false);

  const handleNodeClick = (nodes, id, cpds) => {
    requestAnimationFrame(() => {
      const node = nodes[id]
      setClickedNode(node);
      setWidth(50);
      if (cpds && cpds[node.id]) {
        setCpd(cpds[node.id]);
      }
    });
  }

  const handleCheckboxClick = () => {
    setShowArcStrengths(!showArcStrengths)
  }
  
  const closeSlideIn = () => {
    requestAnimationFrame(() => {
      setWidth(20);
      setClickedNode(undefined);
      setCpd(undefined);
    });
  }

  const trash = () => {
    closeSlideIn();
    setClickedNode(undefined)
    setGraph(undefined)
    setNetworkName(undefined)
    setCpd(undefined)
    setShowArcStrengths(false)
    setTrashHovered(false)
  }

  const uploadCallback = data => {
    const { network, nodes } = data;
    if (network && network.name) {
      setNetworkName(network.name)
    }

    const width = window.innerWidth*0.80 - 200;
    const height = window.innerHeight-200;
    const dag = dagStratify(Object.values(nodes))
    const layout = d3dag.sugiyama().size([width, height]);
    const t = layout(dag)
    const nodeData = dag.descendants().map(n => ({ id: n.id, x: n.x, y: n.y, color: randomColor() }))
    
    const strengthDict = {}
    for (let {from, to, strength} of data.arcStrengths) {
        const width = 1.5 + 10*strength 
        strengthDict[`${from}${to}`] = width
    }
    const colorDict = {} 
    nodeData.forEach(n => colorDict[n.id] = n.color)
    const arcData = t.links().map(l => ({ points: l.data.points, color: colorDict[l.source.id], width: strengthDict[`${l.source.id}${l.target.id}`]})) 
    if (graph === undefined) {
      setGraph({nodes: nodes, nodeData: nodeData, arcs: arcData, width: width, height: height, cpds: data.cpds })
    }
    if (network.name === 'Alarm') {
      const arcs = [...t.links()]
      const nodes = [...dag.descendants().map(n => ({ id: n.id }))];
      findActiveTrails(nodes, arcs, nodes[0], nodes[5], ['PRESS'])
    }
  }

  const classes = makeStyles({
    root: {
      color: 'white'
    }, 
    colorSecondary: {
      color: 'white !important'
    }
  })()

  const checkbox = <Checkbox 
                    classes={{ root: classes.root, colorSecondary: classes.colorSecondary }} 
                    onChange={handleCheckboxClick} />



  return (
    <div className="App">
      <div className="left-pane" style={{ width: `${width}%`, transition: 'all 0.3s' }}>
        <div className="upper-left-pane">
          { clickedNode && <FontAwesome className="close-icon" name="times-circle" onClick={() => closeSlideIn()}/> }
          { networkName && <div className="network-name-container">
            <p className="network-name label">{ networkName }</p>
            <FontAwesome 
              className={`${trashHovered ? 'trash-icon-hovered' : ''} trash-icon`} 
              name="trash" onClick={() => trash()}
              onMouseEnter={() => setTrashHovered(true)}
              onMouseLeave={() => setTrashHovered(false)}
              />
          </div> }
          { networkName && <p className="arc-strength-checkbox-title"> Show arc strength {checkbox}</p> }
        </div>
        <div className="lower-left-pane">
          { clickedNode && cpd && <CPD cpd={cpd} node={clickedNode} parents={clickedNode.parentIds}/> }
        </div>
      </div>
      <div className={`right-pane ${clickedNode ? 'clickable' : ''}`}>
        { graph === undefined && <FileUploader callback={uploadCallback}/> }
        { graph !== undefined && <Graph 
                                    nodes={graph.nodeData} 
                                    arcs={graph.arcs} 
                                    width={graph.width} 
                                    height={graph.height} 
                                    handleNodeClick={nodeId => handleNodeClick(graph.nodes, nodeId, graph.cpds)}
                                    handleClose={closeSlideIn}
                                    showArcStrengths={showArcStrengths}
                                  /> }
      </div>


    </div>
  );
}

export default App;
