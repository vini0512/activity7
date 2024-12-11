function scatter_plot(data, ax, title = "", xCol = "", yCol = "", rCol = "", legend = [], colorCol = "", margin = 50) {
    const X = data.map(d => d[xCol]);
    const Y = data.map(d => d[yCol]);
    const R = data.map(d => d[rCol]);
    const colorCategories = [...new Set(data.map(d => d[colorCol]))];
    const colorScale = d3.scaleOrdinal()
        .domain(colorCategories)
        .range(d3.schemeTableau10);

    const xExtent = d3.extent(X, d => +d);
    const yExtent = d3.extent(Y, d => +d);

    const xPadding = (xExtent[1] - xExtent[0]) * 0.05;
    const yPadding = (yExtent[1] - yExtent[0]) * 0.05;

    const xScale = d3.scaleLinear()
        .domain([xExtent[0] - xPadding, xExtent[1] + xPadding])
        .range([margin, 1000 - margin]);

    const yScale = d3.scaleLinear()
        .domain([yExtent[0] - yPadding, yExtent[1] + yPadding])
        .range([1000 - margin, margin]);

    const rScale = d3.scaleSqrt()
        .domain(d3.extent(R, d => +d))
        .range([4, 12]);

    const Fig = d3.select(ax);

    Fig.selectAll(".markers")
        .data(data)
        .join("g")
        .attr("transform", d => `translate(${xScale(d[xCol])}, ${yScale(d[yCol])})`)
        .append("circle")
        .attr("class", (d, i) => `cls_${i} ${d[colorCol]}`)
        .attr("id", (d, i) => `id_${i} ${d[colorCol]}`)
        .attr("r", d => rScale(d[rCol]))
        .attr("fill", d => colorScale(d[colorCol]));

    const xAxis = d3.axisBottom(xScale).ticks(4);
    const yAxis = d3.axisLeft(yScale).ticks(4);

    Fig.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${1000 - margin})`)
        .call(xAxis);

    Fig.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(${margin},0)`)
        .call(yAxis);

    Fig.append("g")
        .attr("class", "label")
        .attr("transform", `translate(${500},${1000 - 10})`)
        .append("text")
        .attr("class", "label")
        .text(xCol)
        .attr("fill", "black");

    Fig.append("g")
        .attr("transform", `translate(${35},${500}) rotate(270)`)
        .append("text")
        .attr("class", "label")
        .text(yCol)
        .attr("fill", "black");

    Fig.append("text")
        .attr("x", 500)
        .attr("y", 80)
        .attr("text-anchor", "middle")
        .text(title)
        .attr("class", "title")
        .attr("fill", "black");

    const brush = d3
        .brush()
        .on("start", brushStart) // Brush start callback
        .on("brush end", updateBrushSelection) // Brush end callback
        .extent([
            [margin, margin],
            [1000 - margin, 1000 - margin],
        ]);

    Fig.call(brush);

    function brushStart() {
        // If no selection already exists, remove the class and reset the style of all circles
        if (!d3.brushSelection(this)) {
            d3.selectAll("circle")
                .classed("selected", false) // Remove "selected" class
                .style("stroke", null) // Reset stroke style
                .style("stroke-width", null); // Reset stroke width
        }
    }

    function updateBrushSelection() {
        const selection = d3.brushSelection(this);
        if (!selection) {
            d3.selectAll("circle")
                .classed("selected", false)
                .style("stroke", null)
                .style("stroke-width", null)
                .style("opacity", d => (window.visibilityMap[d[colorCol]] ? 1 : 0.1));
            return;
        }

        const [[x1, y1], [x2, y2]] = selection;
        const X1 = xScale.invert(x1);
        const X2 = xScale.invert(x2);
        const Y1 = yScale.invert(y2);
        const Y2 = yScale.invert(y1);

        d3.selectAll("circle")
            .classed("selected", d =>
                window.visibilityMap[d[colorCol]] &&
                d[xCol] >= X1 && d[xCol] <= X2 &&
                d[yCol] >= Y1 && d[yCol] <= Y2
            )
            .style("stroke", d =>
                window.visibilityMap[d[colorCol]] &&
                d[xCol] >= X1 && d[xCol] <= X2 &&
                d[yCol] >= Y1 && d[yCol] <= Y2 ? "black" : null
            )
            .style("stroke-width", d =>
                window.visibilityMap[d[colorCol]] &&
                d[xCol] >= X1 && d[xCol] <= X2 &&
                d[yCol] >= Y1 && d[yCol] <= Y2 ? "2px" : null
            )
            .style("opacity", d =>
                window.visibilityMap[d[colorCol]] ? 1 : 0.1
            );
    }

    if (!window.visibilityMap) {
        window.visibilityMap = Object.fromEntries(colorCategories.map(cat => [cat, true]));
    }

    const legendGroup = Fig.append("g")
        .attr("transform", `translate(${800},${margin})`)
        .attr("class", "legendContainer");

    if (!legend.length) {
        legend = colorCategories;
    }

    const legendItems = legendGroup.selectAll("legends")
        .data(legend)
        .join("g")
        .attr("transform", (d, i) => `translate(0, ${i * 45})`);

    legendItems.append("rect")
        .attr("fill", d => colorScale(d))
        .attr("width", 40)
        .attr("height", 40)
        .attr("class", d => d);

    legendItems.on("click", (event, d) => {
        const isVisible = window.visibilityMap[d] = !window.visibilityMap[d];
        d3.selectAll("circle")
            .style("opacity", circle =>
                window.visibilityMap[circle[colorCol]] ? 1 : 0.1
            )
            .classed("selected", false);
        d3.selectAll(`rect.${d}`)
            .style("opacity", isVisible ? 1 : 0.1);
    });

    legendItems.append("text")
        .text(d => d)
        .attr("dx", 45)
        .attr("dy", 25)
        .attr("class", "legend")
        .attr("fill", "black");
}
