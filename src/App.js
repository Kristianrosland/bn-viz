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

/**
 * The main component of the application
 * - This component keeps track of the graph data structure, and renders the <Graph /> component
 * - If there is no graph data available, this component renders the <FileUploader /> component
 */
function App() {
  const [ width, setWidth ] = useState(20)
  const [ clickedNode, setClickedNode ] = useState(undefined);
  const [ graph, setGraph ] = useState(undefined);
  const [ networkName, setNetworkName ] = useState(undefined);
  const [ cpd, setCpd ] = useState(undefined);
  const [ showArcStrengths, setShowArcStrengths ] = useState(false);
  const [ hasAllArcStrengths, setHasAllArcStrengths ] = useState(false);
  const [ activeTrailsMode, setActiveTrailsMode ] = useState(false);
  const [ trashHovered, setTrashHovered ] = useState(false);
  const [ closeHovered, setCloseHovered ] = useState(false);
  const [ activeTrailsInformation, setActiveTrailsInformation ] = useState(undefined);

  /** Calculates all active trails from q=[from, to] given the evidence set e */
  const calculateActivetrails = (q, e) => {
    const allTrails = findActiveTrails(graph.nodeData, graph.arcs, q[0], q[1], e).flat().map(({source, target})=>`${source}-${target}`)
    const arcColors = {}
    for (const {source, target} of graph.arcs) {
      arcColors[`${source.id}-${target.id}`] = allTrails.includes(`${source.id}-${target.id}`) ? "#2222FF" : "#AAAAAA"
    }
    setActiveTrailsInformation({ ...activeTrailsInformation, queryNodes: q, evidenceNodes: e, arcColors: arcColors })
  }

  /** When the user clicks a node, we must (potentially) update active trails */
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

  /** 
   * If user enables the active trails: Generate all active trails information
   * If user disables the active trails: Clean up and remove trails
   */
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

  /**
   * When user clicks trash icon, reset all data
   */
  const trash = () => {
    closeSlideIn();
    setClickedNode(undefined)
    setGraph(undefined)
    setNetworkName(undefined)
    setCpd(undefined)
    setShowArcStrengths(false)
    setActiveTrailsInformation(undefined)
    setActiveTrailsMode(false)
    setTrashHovered(false)
  }

  /**
   * Callback passed to the <FileUpload /> component. Gets a graph data object as input, 
   * and sets all the necessary variables for the <Graph /> component to render the SVG.
   */
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
    if (data.arcStrengths && data.arcStrengths.length === t.links().length) {
      for (let {from, to, strength} of data.arcStrengths) {
          const width = 1.5 + 10*strength
          strengthDict[`${from}${to}`] = width
      }

      // If every arc has a strength, activate the "Show arc strength" checkbox
      setHasAllArcStrengths((Object.keys(strengthDict).length === t.links().length));
    }
    const colorDict = {} 
    nodeData.forEach(n => colorDict[n.id] = n.color)
    const arcData = t.links().map(l => ({ source: l.source, target: l.target, points: l.data.points, color: colorDict[l.source.id], width: strengthDict[`${l.source.id}${l.target.id}`]})) 
    if (graph === undefined) {
      setGraph({nodes: nodes, nodeData: nodeData, arcs: arcData, width: width, height: height, cpds: data.cpds })
    }
  }


  /** The two checkboxes on the left panel */
  const arcStrengthClasses = makeStyles({
    colorSecondary: {
      color: hasAllArcStrengths ? 'white !important' : 'gray !important'
    }
  })()

  const activeTrailsClasses = makeStyles({
    colorSecondary: {
      color: 'white !important'
    }
  })()

  const arcStrengthCheckbox = <Checkbox disabled={!hasAllArcStrengths} classes={arcStrengthClasses} onChange={handleArcStrengthCheckboxClick} />
  const activeTrailsCheckbox = <Checkbox classes={activeTrailsClasses} onChange={handleActiveTrailsCheckboxClick} />

  return (
    <>
    { /** Render an error if the screen is < 1000px wide (App not useable)  **/}
    <div className="only-mobile too-small">
      Your screen is too small for this application
    </div>
    { /** Render the application HTML and sub-components */}
    <div className="App hidden-mobile">
      <div className="left-pane" style={{ width: `${width}%`, transition: 'all 0.3s' }}>
        <div className="upper-left-pane">
          { clickedNode && <FontAwesome 
                              className={`${closeHovered ? 'icon-hovered' : ''} close-icon`}
                              name="times-circle" onClick={() => closeSlideIn()}
                              onMouseEnter={() => setCloseHovered(true)}
                              onMouseLeave={() => setCloseHovered(false)}/> }
          { networkName && <div className="network-name-container">
            <p className="network-name label">{ networkName }</p>
            <FontAwesome 
              className={`${trashHovered ? 'icon-hovered' : ''} trash-icon`} 
              name="trash" onClick={() => trash()}
              onMouseEnter={() => setTrashHovered(true)}
              onMouseLeave={() => setTrashHovered(false)}
              />
          </div> }
          { networkName && 
            <p className={`${!hasAllArcStrengths ? 'disabled tool' : ''} arc-strength-checkbox-title`} data-tip={'You must add arc strengths to your BIF-file'}> 
                Show arc strength {arcStrengthCheckbox}
            </p> 
          }
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
    </>
  );
}

export default App;
