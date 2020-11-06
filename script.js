Promise.all([d3.json("airports.json"),
d3.json("world-110m.json", d3.autoType)]).then(data=>{
  
    let airports = data[0]
    let worldmap = data[1];

    const features = topojson.feature(worldmap, worldmap.objects.countries).features;
    console.log('features', features);
    console.log("worldmap", worldmap);

    const margin = { top: 100, right: 20, bottom: 50, left: 80 }
    const width = 1000 - margin.left - margin.right
    const height = 500 - margin.top - margin.bottom; 
        
    const projection = d3.geoMercator()
      .fitExtent([[0,0], [width,height]], topojson.feature(worldmap, worldmap.objects.countries));
    
    const path = d3.geoPath()
      .projection(projection);
    
    const svg = d3.select(".chart").append("svg")
      .attr("viewBox", [0,0,width,height]);

  
    const force = d3.forceSimulation(airports.nodes)
        .force("charge", d3.forceManyBody())
        .force("link", d3.forceLink(airports.links))
        .force('x', d3.forceX(width / 2))
        .force('y', d3.forceY(height / 2));
   
  function drawMap(){
    svg.selectAll("path")
    .data(features)
    .join("path")
    .attr("d", path)
    .attr("fill", "steelblue");
    
    svg.append("path")
      .datum(topojson.mesh(worldmap, worldmap.objects.countries))
      .attr('fill', 'none')
      .attr("class", "subunit-boundary")
      .attr('stroke', 'white')
      .attr("d", path);
  }

  forceDiagram();

  d3.selectAll("input[name=display]").on("change", event =>{
    visType = event.target.value
    console.log("vistype", visType)
    
    switchLayout();
  })

  function switchLayout(){
   
    if (visType === "map"){
      drawMap();
      
      let mapSize = d3.scaleLinear()
        .domain(d3.extent(airports.nodes, d=>d.passengers))
        .range([3,10])

      drag = force => {
        drag.filter(event => visType === "force")
      }

      let linksMap = svg.selectAll('.chart')
          .data(data[0].links)
          .enter()
          .append('line')
          .attr('class','map')
          .attr('x1', (d)=> (d.source.x))
          .attr('y1',(d) => (d.source.y))
          .attr('x2', (d) => (d.target.x))
          .attr('y2',(d) => (d.target.y))
          .attr('stroke', 'black')
          .transition()
          .duration(1000)
          .attr("x1", function(d) {
            return projection([d.source.longitude, d.source.latitude])[0];
          })
          .attr("y1", function(d) {
            return projection([d.source.longitude, d.source.latitude])[1];
          })
          .attr("x2", function(d) {
            return projection([d.target.longitude, d.target.latitude])[0];
          })
          .attr("y2", function(d) {
            return projection([d.target.longitude, d.target.latitude])[1];
          });
  
      let nodes = svg.selectAll('.chart')
              .data(data[0].nodes)
              .enter()
              .append('circle')
              .attr('class','map')
              .attr('cx', (d,i)=>(d.x))
              .attr('cy', (d,i)=>(d.y))
              .attr('fill', 'salmon') 
              .attr('r',d=>mapSize(d.passengers))
              .on("mouseenter", (event, d) => {
                const pos = d3.pointer(event, window);
                d3.selectAll(".tooltip")
                  .style("display", "inline-block")
                  .style("position", "fixed")
                  .style("font-size", "15px")
                  .style("color", "white")
                  .style("background-color", "black")
                  .style("top", pos[1] + "px")
                  .style("left", pos[0] + "px")
                  .html(d.name);
              })
              .on("mouseleave", (event, d) => {
                d3.selectAll(".tooltip").style("display", "none");
              })
              .transition()
              .duration(1000)
              .attr("cx", function(d) {
                return projection([d.longitude, d.latitude])[0];
              })
              .attr("cy", function(d) {
                return projection([d.longitude, d.latitude])[1];
              })
       
      
      svg.selectAll("path")
        .attr("opacity", 0);

      svg.selectAll('.force')
        .remove()

    svg.selectAll("path")
        .transition()
        .delay(450)
        .attr("opacity", 1);

    } else { 

      forceDiagram();
      
      svg.selectAll("path")
            .attr("opacity", 0);
    }
  }

  function forceDiagram(){
    svg.selectAll('.map')
    .remove()

      let forceSize = d3.scaleLinear()
        .domain(d3.extent(airports.nodes, d=>d.passengers))
        .range([3,10])
 
      let drag = force => {

        function dragStarted(event) {
          if (!event.active) force.alphaTarget(0.3).restart();
          event.subject.fx = event.subject.x;
          event.subject.fy = event.subject.y;
        }
        
        function dragged(event) {
          event.subject.fx = event.x;
          event.subject.fy = event.y;
        }
        
        function dragEnded(event) {
          if (!event.active) force.alphaTarget(0);
          event.subject.fx = null;
          event.subject.fy = null;
        }
        
        return d3.drag()
            .on("start", dragStarted)
            .on("drag", dragged)
            .on("end", dragEnded); 
      }

      force.alpha(0.5).restart();

     let link = svg
        .selectAll(".chart")
        .data(data[0].links)
        .enter()
        .append("line")
        .attr('class','force')
        .attr("stroke", "black");
      
      let nodes = svg
        .selectAll(".node")
        .data(data[0].nodes)
        .enter()
        .append("circle")
        .attr("class", "force")
        .attr('cx', (d,i)=>(d.x))
        .attr('cy', (d,i)=>(d.y))
        .attr("r", d=>forceSize(d.passengers))
        .attr("fill", "salmon")
        .call(drag(force));
    

      force.on("tick", function() {
        nodes.attr("cx", function(d) {
            return d.x;
          })
          .attr("cy", function(d) {
            return d.y;
          });

        link.attr("x1", function(d) {
            return d.source.x;
          })
          .attr("y1", function(d) {
            return d.source.y;
          })
          .attr("x2", function(d) {
            return d.target.x;
          })
          .attr("y2", function(d) {
            return d.target.y;
          });
      });
  }

})
