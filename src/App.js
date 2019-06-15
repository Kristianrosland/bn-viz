import React, { useState } from 'react';
import FontAwesome from 'react-fontawesome';
import * as d3dag from 'd3-dag';
import Graph from './Graph/Graph';
import { getRandomColors } from './utils';
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
  const [ activeTrailsMode, setActiveTrailsMode ] = useState(false);
  const [ trashHovered, setTrashHovered ] = useState(false);
  const [ activeTrailsInformation, setActiveTrailsInformation ] = useState(undefined)

  const calculateActivetrails = (q, e) => {
    const allTrails = findActiveTrails(graph.nodeData, graph.arcs, q[0], q[1], e).flat().map(({source, target})=>`${source}-${target}`)
    const arcColors = {}
    for (const {source, target} of graph.arcs) {
      arcColors[`${source.id}-${target.id}`] = allTrails.includes(`${source.id}-${target.id}`) ? "#2222FF" : "#AAAAAA"
    }
    setActiveTrailsInformation({ ...activeTrailsInformation, queryNodes: q, evidenceNodes: e, arcColors: arcColors })
  }

  const handleNodeClick = (nodes, id, cpds) => {
    if (activeTrailsInformation) {
      const { queryNodes, evidenceNodes } = activeTrailsInformation;

      if (queryNodes.includes(id)) {
        const q = queryNodes.filter(x => x !== id)
        setActiveTrailsInformation({ ...activeTrailsInformation, queryNodes: q, evidenceNodes: [], arcColors: {}})
      }
      else if (queryNodes.length < 2) {
        const q = [...queryNodes, id]
        if (q.length === 2) calculateActivetrails(q, evidenceNodes)
        else setActiveTrailsInformation({ ...activeTrailsInformation, queryNodes: q, arcColors: {} })
      } else if (evidenceNodes.includes(id)) {
        const e = evidenceNodes.filter(x => x !== id)
        if (queryNodes.length === 2) calculateActivetrails(queryNodes, e)
        else setActiveTrailsInformation({ ...activeTrailsInformation, evidenceNodes: e, arcColors: {} })
      } else {
        if (queryNodes.length === 2) calculateActivetrails(queryNodes, [...evidenceNodes, id])
        else setActiveTrailsInformation({ ...activeTrailsInformation, evidenceNodes: [...evidenceNodes, id], arcColors: {} })
      }
    } else {
      requestAnimationFrame(() => {
        const node = nodes[id]
        setClickedNode(node);
        setWidth(50);
        if (cpds && cpds[node.id]) {
          setCpd(cpds[node.id]);
        }
      });
    }
  }
  

  const handleArcStrengthCheckboxClick = () => {
    setShowArcStrengths(!showArcStrengths)
  }
  
  const closeSlideIn = () => {
    requestAnimationFrame(() => {
      setWidth(20);
      setClickedNode(undefined);
      setCpd(undefined);
    });
  }

  const handleActiveTrailsCheckboxClick = () => {
    if (!activeTrailsMode) {
      closeSlideIn();
      const arcColors = {}
      graph.arcs.forEach(({source, target}) => arcColors[`${source.id}-${target.id}`] = "#AAAAAA")
      setActiveTrailsInformation({ arcColors: arcColors, queryNodes: [], evidenceNodes: [] })
    } else {
      setActiveTrailsInformation(undefined)
    }
    setActiveTrailsMode(!activeTrailsMode)
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
    const randomColors = getRandomColors(dag.descendants().map(n => n.id))
    const nodeData = dag.descendants().map((n, idx) => ({ id: n.id, x: n.x, y: n.y, color: randomColors[idx] }))
    
    const strengthDict = {}
    for (let {from, to, strength} of data.arcStrengths) {
        const width = 1.5 + 10*strength 
        strengthDict[`${from}${to}`] = width
    }
    const colorDict = {} 
    nodeData.forEach(n => colorDict[n.id] = n.color)
    const arcData = t.links().map(l => ({ source: l.source, target: l.target, points: l.data.points, color: colorDict[l.source.id], width: strengthDict[`${l.source.id}${l.target.id}`]})) 
    if (graph === undefined) {
      setGraph({nodes: nodes, nodeData: nodeData, arcs: arcData, width: width, height: height, cpds: data.cpds })
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

  const arcStrengthCheckbox = <Checkbox classes={{ root: classes.root, colorSecondary: classes.colorSecondary }} onChange={handleArcStrengthCheckboxClick} />
  const activeTrailsCheckbox = <Checkbox classes={{ root: classes.root, colorSecondary: classes.colorSecondary }} onChange={handleActiveTrailsCheckboxClick} />

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
          { networkName && <p className="arc-strength-checkbox-title"> Show arc strength {arcStrengthCheckbox}</p> }
          { networkName && <p className="arc-strength-checkbox-title"> See active trails {activeTrailsCheckbox}</p> }
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
                                    activeTrailsInformation={activeTrailsInformation}
                                  /> }
      </div>


    </div>
  );
}

export default App;
