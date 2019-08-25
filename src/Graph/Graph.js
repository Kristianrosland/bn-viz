import React, { Component } from 'react';
import * as d3 from 'd3';

class Graph extends Component {

    componentDidMount() {
        this.renderGraph();
    }
    
    idToText(id) {
        return isNaN(id) ? id.toUpperCase().substring(0,4) : id;
    }

    renderGraph() {
        const { width, height, nodes, arcs, handleNodeClick, handleClose, showArcStrengths, activeTrailsInformation } = this.props;
        const dx = 50
        const dy = 100
        const radius =  25;

        d3.select('.main-svg').remove()

        /* CANVAS */
        const svg = d3.select('.graph')
            .append('svg')
            .attr('width', width+300)
            .attr('height', height+300)
            .attr('class', 'main-svg')
            .style('position', 'absolute')
            .style('left', 25)
            .style('top', 0)
            .on("click", handleClose);

        /* LINKS */
        const lineFunction = d3.line()
            .x(d => d.x+dx)
            .y(d => d.y+dy)
            .curve(d3.curveCatmullRom); 
        
        svg.selectAll('.link')
            .data(arcs)
            .enter()
            .append('path')
            .attr('d', d => lineFunction(d.points))
            .attr('stroke', d => {
                if (!activeTrailsInformation) return d.color
                else if (activeTrailsInformation.arcColors[`${d.source.id}-${d.target.id}`]) return activeTrailsInformation.arcColors[`${d.source.id}-${d.target.id}`];
                else return "#AAAAAA"
            })
            .attr('stroke-width', d => d.width && showArcStrengths ? d.width : 3)
            .attr('fill', 'none')
            .attr('class', 'link')

        /* NODE CIRCLES */
        svg.selectAll('circle')
            .data(nodes)
            .enter()
            .append('circle')
            .attr('cx', (d, _) => d.x + dx)
            .attr('cy', (d, _) => d.y + dy)
            .attr('r', radius)
            .attr('fill', (d, _) => {
                if (!activeTrailsInformation) return d.color
                else if (activeTrailsInformation.queryNodes.includes(d.id)) return '#2222FF'
                else if (activeTrailsInformation.queryNodes.length === 2 && activeTrailsInformation.evidenceNodes.includes(d.id)) return "#FF2222"
                else return "#AAAAAA"
            })
            .on("click", d => {
                handleNodeClick(d.id);
                d3.event.stopPropagation();
            })
            .style("cursor", "pointer")

        /* ARROWS */
        const arrow = d3.symbol().type(d3.symbolTriangle).size(radius * radius / 5.0);
        svg.selectAll('.arrow')
            .data(arcs)
            .enter()
            .append('path')
            .attr('d', arrow)
            .attr('transform', ({ points }) => {
                const pointsCopy = [...points]
                const [end, start] = pointsCopy.reverse();
                const deltaX = start.x - end.x;
                const deltaY = start.y - end.y;
                const scale = radius * 1.25 / Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                const angle = Math.atan2(-deltaY, -deltaX) * 180 / Math.PI + 90;
                return `translate(${end.x + dx + deltaX * scale}, ${end.y + dy + deltaY * scale}) rotate(${angle})`;
            })
            .attr('fill', d => {
                if (!activeTrailsInformation) return d.color
                else if(activeTrailsInformation.arcColors[`${d.source.id}-${d.target.id}`]) return activeTrailsInformation.arcColors[`${d.source.id}-${d.target.id}`]
                else return "#AAAAAA" 
            })
            .attr('stroke', 'white')
            .attr('stroke-width', 1.5)
            .attr('class', 'arrow')
        

        /* NODE TEXT */
        svg.selectAll('text')
            .data(nodes)
            .enter()
            .append('text')
            .attr('x', (d,_) => d.x + dx)
            .attr('y', (d,_) => d.y + 6 + dy)
            .attr('width', radius*2)
            .attr('text-anchor', 'middle')
            .style('fill', 'white')
            .style('font-size', `${radius*0.6}px`)
            .style('font-weight', 'bold')
            .style('user-select', 'none')
            .text(d => this.idToText(d.id))
            .on("click", d => {
                handleNodeClick(d.id);
                d3.event.stopPropagation();
            })
            .style("cursor", "pointer")
            
    }

    render() {
        const { activeTrailsInformation } = this.props;
        this.renderGraph(this.props);
        return (
            <div className='graph'>
                { activeTrailsInformation && <p className='help-text'> {
                    activeTrailsInformation.queryNodes.length < 2 
                        ? "Select two nodes"
                        : "Click on a node to mark it as observed"
                } </p> }
                
            </div>
        );
    }
}

export default Graph;