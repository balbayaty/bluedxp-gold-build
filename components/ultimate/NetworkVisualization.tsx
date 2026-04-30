"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import * as d3 from "d3";

interface NetworkVisualizationProps {
  language: "en" | "ar";
}

export default function NetworkVisualization({
  language,
}: NetworkVisualizationProps) {
  const ref = useRef(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [activeView, setActiveView] = useState<
    "standard" | "compliance" | "bottlenecks" | "digital-twin"
  >("standard");
  const [nodeConnections, setNodeConnections] = useState(0);

  const views = {
    standard: language === "en" ? "Standard Flow" : "التدفق القياسي",
    compliance: language === "en" ? "Compliance Focus" : "تركيز الامتثال",
    bottlenecks: language === "en" ? "Bottleneck Analysis" : "تحليل الاختناقات",
    "digital-twin": language === "en" ? "Digital Twin" : "التوأم الرقمي",
  };

  useEffect(() => {
    if (!svgRef.current || !isInView) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    // Create nodes
    const nodes = [
      { id: "core", label: "Bluedxp Core", group: 1, size: 30 },
      { id: "wms", label: "WMS", group: 2, size: 20 },
      { id: "tms", label: "TMS", group: 2, size: 20 },
      { id: "qms", label: "QMS", group: 2, size: 20 },
      { id: "erp", label: "ERP", group: 3, size: 15 },
      { id: "ai", label: "AI Engine", group: 1, size: 25 },
      { id: "iot", label: "IoT", group: 3, size: 15 },
      { id: "analytics", label: "Analytics", group: 2, size: 18 },
    ];

    const links = [
      { source: "core", target: "wms" },
      { source: "core", target: "tms" },
      { source: "core", target: "qms" },
      { source: "core", target: "ai" },
      { source: "ai", target: "analytics" },
      { source: "wms", target: "erp" },
      { source: "tms", target: "erp" },
      { source: "qms", target: "erp" },
      { source: "wms", target: "iot" },
      { source: "tms", target: "iot" },
    ];

    // Update node connections count when a node is selected
    if (selectedNode) {
      const count = links.filter(
        (link: any) =>
          link.source.id === selectedNode.id ||
          link.target.id === selectedNode.id,
      ).length;
      setNodeConnections(count);
    }

    const simulation = d3
      .forceSimulation(nodes as any)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d: any) => d.id)
          .distance(100),
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collision",
        d3.forceCollide().radius((d: any) => d.size + 10),
      );

    const colorScale = d3
      .scaleOrdinal()
      .domain([1, 2, 3])
      .range(["#05a4ff", "#00d4a8", "#8b5cf6"]);

    // Draw links
    const link = svg
      .append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "rgba(5, 164, 255, 0.3)")
      .attr("stroke-width", 2);

    // Draw nodes
    const node = svg
      .append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(
        d3
          .drag<any, any>()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended) as any,
      );

    node
      .append("circle")
      .attr("r", (d: any) => d.size)
      .attr("fill", (d: any) => colorScale(d.group) as string)
      .attr("stroke", "#fff")
      .attr("stroke-width", 3)
      .style("filter", "drop-shadow(0 0 10px rgba(5, 164, 255, 0.5))")
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", (d: any) => d.size * 1.5)
          .style("filter", `drop-shadow(0 0 20px ${colorScale(d.group)})`);
      })
      .on("mouseout", function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", (d: any) => d.size)
          .style("filter", "drop-shadow(0 0 10px rgba(5, 164, 255, 0.5))");
      })
      .on("click", (event, d) => {
        setSelectedNode(d);
      });

    node
      .append("text")
      .text((d: any) => d.label)
      .attr("text-anchor", "middle")
      .attr("dy", (d: any) => d.size + 20)
      .attr("fill", "#fff")
      .attr("font-size", "12px")
      .attr("font-weight", "bold");

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });
  }, [isInView]);

  return (
    <section ref={ref} className="py-24 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white via-[#05a4ff] to-[#00d4a8] bg-clip-text text-transparent">
              {language === "en"
                ? "Interactive Network Graph"
                : "رسم بياني شبكي تفاعلي"}
            </span>
          </h2>
        </motion.div>

        <div className="flex justify-center gap-4 mb-8 flex-wrap">
          {Object.entries(views).map(([key, label]) => (
            <motion.button
              key={key}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setActiveView(key as typeof activeView);
                // Trigger graph re-render
                if (svgRef.current) {
                  const event = new Event("resize");
                  window.dispatchEvent(event);
                }
              }}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                activeView === key
                  ? "bg-gradient-to-r from-[#05a4ff] to-[#0088d1] text-white shadow-xl shadow-[#05a4ff]/40"
                  : "bg-white/5 border border-white/10 text-white/70 hover:bg-white/10"
              }`}
            >
              {label}
            </motion.button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.8 }}
              className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 rounded-3xl overflow-hidden shadow-2xl"
              style={{ height: "600px" }}
            >
              <svg ref={svgRef} className="w-full h-full" />
            </motion.div>
          </div>

          {selectedNode && (
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-br from-white/15 to-white/10 backdrop-blur-2xl border border-white/30 rounded-3xl p-6"
            >
              <h3 className="text-xl font-bold mb-4">{selectedNode.label}</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#00d4a8]" />
                  <span className="text-sm text-white/80">Status: Online</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#05a4ff]" />
                  <span className="text-sm text-white/80">
                    Connections: {nodeConnections}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
