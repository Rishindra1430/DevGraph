import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function NetworkGraph({ data, selectedNode, onSelectNode }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !data || !data.nodes) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 600;

    // Clear previous drawing
    const svgElement = d3.select(svgRef.current);
    svgElement.selectAll('*').remove();

    // Create a group for all graph elements to support zoom/pan
    const g = svgElement.append('g').attr('class', 'graph-content');

    // Setup zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svgElement.call(zoom);

    // Initial scale and center
    svgElement.call(zoom.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(0.8));

    // Clone nodes and relationships to prevent mutating read-only React props
    const nodes = data.nodes.map(n => ({ ...n }));
    const links = data.relationships.map(r => ({
      ...r,
      source: r.startNode,
      target: r.endNode
    }));

    // Force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links)
        .id(d => d.id)
        .distance(120)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(0, 0))
      .force('collision', d3.forceCollide().radius(50));

    // Draw Links
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('class', 'network-link')
      .attr('stroke', '#30363D')
      .attr('stroke-width', 1.5)
      .attr('opacity', 0.6);

    // Draw Node Groups
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'network-node cursor-pointer')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
      )
      .on('click', (event, d) => {
        onSelectNode(d);
      });

    // Render node shapes based on entity type
    node.each(function(d) {
      const el = d3.select(this);
      const isSelected = selectedNode && selectedNode.id === d.id;

      if (d.type === 'Developer') {
        // Circle for Developers
        el.append('circle')
          .attr('r', 18)
          .attr('fill', '#161B22')
          .attr('stroke', isSelected ? '#00daf3' : '#30363D')
          .attr('stroke-width', isSelected ? 2.5 : 1.5)
          .attr('class', isSelected ? 'drop-shadow-[0_0_8px_rgba(0,218,243,0.5)]' : '');

        // Developer Initials (or standard placeholder icon)
        const name = d.properties.name || d.properties.username || 'D';
        const initials = name.slice(0, 2).toUpperCase();
        el.append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', '.3em')
          .attr('fill', isSelected ? '#00daf3' : '#849396')
          .attr('font-size', '10px')
          .attr('font-weight', 'bold')
          .text(initials);

      } else if (d.type === 'Repository') {
        // Rect for Repositories
        el.append('rect')
          .attr('x', -16)
          .attr('y', -16)
          .attr('width', 32)
          .attr('height', 32)
          .attr('rx', 4)
          .attr('fill', '#161B22')
          .attr('stroke', isSelected ? '#00daf3' : '#30363D')
          .attr('stroke-width', isSelected ? 2.5 : 1.5);

        // Icon inside folder
        el.append('text')
          .attr('text-anchor', 'middle')
          .attr('class', 'material-symbols-outlined')
          .attr('dy', '.3em')
          .attr('fill', '#849396')
          .attr('font-size', '16px')
          .text('folder');

      } else if (d.type === 'Technology') {
        // Hexagon for Technologies
        el.append('polygon')
          .attr('points', '0,-16 14,-8 14,8 0,16 -14,8 -14,-8')
          .attr('fill', '#161B22')
          .attr('stroke', isSelected ? '#00daf3' : '#ffb4ab') // tertiary/error color tone for tech
          .attr('stroke-width', isSelected ? 2.5 : 1.5);

        // Tech initials
        const name = d.properties.name || 'T';
        const initials = name.slice(0, 2);
        el.append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', '.3em')
          .attr('fill', '#bac9cc')
          .attr('font-size', '9px')
          .text(initials);
      }

      // Add Name label underneath the node
      const labelText = d.properties.username || d.properties.name;
      el.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', 28)
        .attr('fill', isSelected ? '#00daf3' : '#d4e4fa')
        .attr('font-size', '10px')
        .attr('font-family', 'Inter')
        .text(labelText && labelText.length > 15 ? labelText.slice(0, 12) + '...' : labelText);
    });

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Fit-to-screen controls inside component
    const fitScreenBtn = d3.select(svgRef.current.parentNode).select('.fit-screen-btn');
    fitScreenBtn.on('click', () => {
      svgElement.transition().duration(750).call(
        zoom.transform,
        d3.zoomIdentity.translate(width / 2, height / 2).scale(0.8)
      );
    });

    // Zoom Buttons
    const zoomInBtn = d3.select(svgRef.current.parentNode).select('.zoom-in-btn');
    zoomInBtn.on('click', () => {
      svgElement.transition().duration(300).call(zoom.scaleBy, 1.3);
    });

    const zoomOutBtn = d3.select(svgRef.current.parentNode).select('.zoom-out-btn');
    zoomOutBtn.on('click', () => {
      svgElement.transition().duration(300).call(zoom.scaleBy, 0.7);
    });

    // Drag helpers
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [data, selectedNode]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-background overflow-hidden">
      {/* Decorative Grid Background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20" 
        style={{
          backgroundImage: 'radial-gradient(#30363D 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />
      
      {/* Canvas */}
      <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating Zoom & Fit controls */}
      <div className="absolute bottom-lg right-lg flex flex-col gap-xs bg-surface-level-1 border border-outline-variant rounded p-1 shadow-lg z-10">
        <button className="zoom-in-btn w-8 h-8 flex items-center justify-center text-on-surface hover:text-electric-cyan hover:bg-surface-level-2 rounded transition-colors" title="Zoom In">
          <span className="material-symbols-outlined text-sm">add</span>
        </button>
        <div className="h-px w-full bg-outline-variant" />
        <button className="zoom-out-btn w-8 h-8 flex items-center justify-center text-on-surface hover:text-electric-cyan hover:bg-surface-level-2 rounded transition-colors" title="Zoom Out">
          <span className="material-symbols-outlined text-sm">remove</span>
        </button>
        <div className="h-px w-full bg-outline-variant" />
        <button className="fit-screen-btn w-8 h-8 flex items-center justify-center text-on-surface hover:text-electric-cyan hover:bg-surface-level-2 rounded transition-colors" title="Fit to screen">
          <span className="material-symbols-outlined text-sm">fit_screen</span>
        </button>
      </div>
    </div>
  );
}
