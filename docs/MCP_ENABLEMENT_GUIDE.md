# 🛠️ MCP Enablement Guide

## Quick Start

### Step 1: Enable MCP Server

Add to your `.env.local` file:

```env
MCP_ENABLED=true
```

### Step 2: Restart Your Server

```bash
npm run dev
```

### Step 3: Verify MCP is Running

Check the server logs for:
```
✅ MCP Server initialized
✅ MCP Server: Initialized with X tools
```

Or check the status API:
```bash
curl http://localhost:3002/api/v1/services/status
```

Look for:
```json
{
  "services": {
    "mcp": {
      "enabled": true,
      "toolsCount": 10,
      "status": "operational"
    }
  }
}
```

## Available MCP Tools

Once enabled, the following tools are available:

### Knowledge Tools
- Knowledge base queries
- Semantic search
- RAG operations

### Quantum Tools (Schrödinger's Truck)
- `get_shipment_quantum_state` - Get quantum state probabilities
- `collapse_quantum_state` - Collapse quantum state

### Chemical Tools
- Chemical analysis
- MSDS processing
- Compliance checking

### Compliance Tools
- Regulatory compliance checks
- Customs requirements
- Document validation

### QHSE Tools
- Quality checks
- Health & safety
- Environmental compliance

### Arabic NLP Tools
- `analyze_arabic_text` - Sentiment, intent, cultural context
- Inshallah usage detection

### Cargo Psychology Tools
- `get_shipment_psychology_state` - Get psychology state
- `execute_psychology_intervention` - Execute interventions

### Evidence Tools
- Evidence packet operations
- Chain of custody tracking

### Graph Tools
- `graph_query` - Query entity graph

### Agent Tools
- `agent_execute` - Execute agent task

## Using MCP Tools

### Via API

**List Tools:**
```bash
GET /api/mcp/tools
```

**Execute Tool:**
```bash
POST /api/mcp/tools
{
  "toolName": "analyze_arabic_text",
  "params": {
    "text": "نص عربي للتحليل"
  }
}
```

### Via Copilot

MCP tools are automatically available to the Copilot. The AI can call them using the tool format:

```
[TOOL:mcp.analyze_arabic_text:{"text":"نص عربي"}]
```

## Integration Status

✅ **Core Server**: Implemented
✅ **Tool Registration**: Complete (10+ tools)
✅ **Service Initialization**: Integrated
✅ **API Route**: `/api/mcp/tools` - Created
✅ **Copilot Integration**: Tool executor updated to support MCP tools

## Next Steps

1. ✅ Enable MCP in `.env.local`
2. ✅ Restart server
3. ✅ Test via API or Copilot
4. ⚠️ Add more domain-specific tools as needed

---

**Status**: ✅ Ready to use!


