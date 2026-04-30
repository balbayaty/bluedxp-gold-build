# 🔗 ML Module & LLM Provider Pages - Complete Links Guide

## 📋 **All Available Links**

---

## 🎯 **Main Pages**

### **1. ML Registry (Model Management)**
**URL**: `/ml-registry`  
**Description**: View and manage all ML models, including trained LLMs  
**Features**:
- List all registered models
- View model metrics
- Training history
- A/B testing
- Model deployment

**Direct Link**: `http://localhost:3000/ml-registry` (or your domain)

---

### **2. AI Settings (LLM Provider Configuration)**
**URL**: `/settings/ai`  
**Description**: Configure AI API keys and LLM providers  
**Features**:
- OpenAI API key configuration
- Anthropic API key configuration
- Ollama (Local LLM) settings
- Provider selection
- Model preferences

**Direct Link**: `http://localhost:3000/settings/ai`

---

### **3. Settings Main Page**
**URL**: `/settings`  
**Description**: Main settings hub with all configuration options  
**Features**:
- AI & Intelligence settings
- Module management
- User management
- System parameters

**Direct Link**: `http://localhost:3000/settings`

---

## 🔧 **API Endpoints (For Integration)**

### **LLM Provider APIs**

#### **1. List All Providers**
**URL**: `/api/llm/providers`  
**Method**: `GET`  
**Description**: Get all available LLM providers and their status

**Example Response**:
```json
{
  "success": true,
  "providers": [
    {
      "id": "ollama",
      "name": "Ollama (Local)",
      "status": "online",
      "supportedModels": ["llama2", "mistral", ...]
    },
    {
      "id": "openai",
      "name": "OpenAI",
      "status": "online",
      "supportedModels": ["gpt-4o", "gpt-4", ...]
    }
  ]
}
```

**Direct Link**: `http://localhost:3000/api/llm/providers`

---

#### **2. Generate with LLM**
**URL**: `/api/llm/generate`  
**Method**: `POST`  
**Description**: Generate text using any LLM provider

**Example Request**:
```json
{
  "provider": "ollama",
  "model": "llama2",
  "messages": [{"role": "user", "content": "Hello!"}]
}
```

**Direct Link**: `http://localhost:3000/api/llm/generate`

---

#### **3. Smart Provider Selection**
**URL**: `/api/llm/smart-select`  
**Method**: `POST`  
**Description**: Automatically select best provider based on context

**Example Request**:
```json
{
  "messages": [{"role": "user", "content": "Analyze MSDS..."}],
  "dataSensitivity": "high",
  "taskType": "analysis"
}
```

**Direct Link**: `http://localhost:3000/api/llm/smart-select`

---

#### **4. Get LLM Metrics**
**URL**: `/api/llm/metrics`  
**Method**: `GET`  
**Description**: Get metrics and learning progress for LLM models

**Query Parameters**:
- `modelId` (optional): Specific model ID
- `type` (optional): `metrics` or `progress`

**Examples**:
- All models: `/api/llm/metrics`
- Specific model: `/api/llm/metrics?modelId=hazalyze-msds-analyzer`
- Learning progress: `/api/llm/metrics?modelId=hazalyze-msds-analyzer&type=progress`

**Direct Links**:
- All: `http://localhost:3000/api/llm/metrics`
- Model: `http://localhost:3000/api/llm/metrics?modelId=hazalyze-msds-analyzer`
- Progress: `http://localhost:3000/api/llm/metrics?modelId=hazalyze-msds-analyzer&type=progress`

---

#### **5. Submit Feedback**
**URL**: `/api/llm/feedback`  
**Method**: `POST`  
**Description**: Submit feedback for LLM learning

**Example Request**:
```json
{
  "modelId": "hazalyze-msds-analyzer",
  "type": "positive",
  "comment": "Accurate analysis!"
}
```

**Direct Link**: `http://localhost:3000/api/llm/feedback`

---

#### **6. Start Retraining**
**URL**: `/api/llm/retrain`  
**Method**: `POST`  
**Description**: Start retraining from collected learning data

**Example Request**:
```json
{
  "modelId": "hazalyze-msds-analyzer",
  "baseModel": "llama2"
}
```

**Direct Link**: `http://localhost:3000/api/llm/retrain`

---

#### **7. LLM Training**
**URL**: `/api/llm/training`  
**Method**: `POST`  
**Description**: Start/manage LLM training jobs

**Example Request**:
```json
{
  "action": "start",
  "config": {
    "baseModel": "llama2",
    "modelName": "hazalyze-msds-analyzer",
    "trainingData": [...]
  }
}
```

**Direct Link**: `http://localhost:3000/api/llm/training`

---

## 📊 **ML Module Pages**

### **1. ML Registry Dashboard**
**URL**: `/ml-registry`  
**Description**: Main ML model management dashboard

**Features**:
- View all registered models
- Model performance metrics
- Training status
- A/B testing
- Model deployment

**Direct Link**: `http://localhost:3000/ml-registry`

---

### **2. ML Analytics Dashboard**
**URL**: `/dashboards/ml-analytics`  
**Description**: ML analytics and insights dashboard

**Direct Link**: `http://localhost:3000/dashboards/ml-analytics`

---

## ⚙️ **Settings Pages**

### **1. AI Settings**
**URL**: `/settings/ai`  
**Description**: AI and LLM provider configuration

**Features**:
- API key management
- Provider selection
- Model preferences
- Local LLM (Ollama) configuration

**Direct Link**: `http://localhost:3000/settings/ai`

---

### **2. Module Management**
**URL**: `/settings/module-management`  
**Description**: Module lifecycle and management

**Features**:
- Module enable/disable
- Module health monitoring
- Module dependencies
- Module isolation

**Direct Link**: `http://localhost:3000/settings/module-management`

---

### **3. System Parameters**
**URL**: `/settings/parameters`  
**Description**: System-wide configuration

**Direct Link**: `http://localhost:3000/settings/parameters`

---

## 🧠 **AI & Intelligence Pages**

### **1. Knowledge Base**
**URL**: `/knowledge-base`  
**Description**: Knowledge base management and search

**Features**:
- Search knowledge base
- View stored LLM responses
- Semantic search
- RAG (Retrieval Augmented Generation)

**Direct Link**: `http://localhost:3000/knowledge-base`

---

### **2. Agent Showcase**
**URL**: `/agents/showcase`  
**Description**: AI agent demonstrations

**Direct Link**: `http://localhost:3000/agents/showcase`

---

### **3. Intelligent Orchestration**
**URL**: `/intelligent-orchestration/process-mining`  
**Description**: AI-powered process intelligence

**Direct Link**: `http://localhost:3000/intelligent-orchestration/process-mining`

---

## 📈 **Quick Access Links**

### **For LLM Management:**
1. **Configure Providers**: `/settings/ai`
2. **View Providers**: `/api/llm/providers`
3. **Generate Text**: `/api/llm/generate`
4. **View Metrics**: `/api/llm/metrics`
5. **Submit Feedback**: `/api/llm/feedback`
6. **Start Training**: `/api/llm/training`

### **For ML Module:**
1. **ML Registry**: `/ml-registry`
2. **ML Analytics**: `/dashboards/ml-analytics`
3. **Model Metrics**: `/api/llm/metrics`

### **For Settings:**
1. **AI Settings**: `/settings/ai`
2. **Module Management**: `/settings/module-management`
3. **Main Settings**: `/settings`

---

## 🔗 **Complete Link List**

### **UI Pages:**
- `/ml-registry` - ML Model Registry
- `/settings/ai` - AI & LLM Settings
- `/settings` - Main Settings
- `/settings/module-management` - Module Management
- `/knowledge-base` - Knowledge Base
- `/dashboards/ml-analytics` - ML Analytics
- `/agents/showcase` - Agent Showcase

### **API Endpoints:**
- `/api/llm/providers` - List providers
- `/api/llm/generate` - Generate text
- `/api/llm/smart-select` - Smart selection
- `/api/llm/metrics` - Get metrics
- `/api/llm/metrics?modelId=xxx&type=progress` - Learning progress
- `/api/llm/feedback` - Submit feedback
- `/api/llm/retrain` - Start retraining
- `/api/llm/training` - Training management

---

## 🎯 **Usage Examples**

### **Example 1: Configure LLM Providers**
1. Go to: `/settings/ai`
2. Enter API keys
3. Select default provider
4. Save settings

### **Example 2: View All Providers**
1. Go to: `/api/llm/providers` (API)
2. Or check in: `/settings/ai` (UI)

### **Example 3: View ML Models**
1. Go to: `/ml-registry`
2. See all registered models
3. View metrics and training status

### **Example 4: Check Learning Progress**
1. Go to: `/api/llm/metrics?modelId=xxx&type=progress`
2. See interactions, feedback, ready for retraining?

### **Example 5: Submit Feedback**
1. Use: `/api/llm/feedback`
2. Submit positive/negative feedback
3. Help model learn

---

## 📝 **Quick Reference**

### **Most Used Links:**

**For Configuration:**
- `/settings/ai` - Configure LLM providers

**For Monitoring:**
- `/ml-registry` - View ML models
- `/api/llm/metrics` - View metrics

**For Usage:**
- `/api/llm/generate` - Use LLM
- `/api/llm/smart-select` - Smart selection

**For Learning:**
- `/api/llm/feedback` - Submit feedback
- `/api/llm/retrain` - Retrain model

---

## ✅ **Summary**

### **Main Pages:**
- ✅ `/ml-registry` - ML Model Registry
- ✅ `/settings/ai` - AI & LLM Settings
- ✅ `/settings` - Main Settings

### **API Endpoints:**
- ✅ `/api/llm/providers` - List providers
- ✅ `/api/llm/generate` - Generate text
- ✅ `/api/llm/metrics` - Get metrics
- ✅ `/api/llm/feedback` - Submit feedback
- ✅ `/api/llm/retrain` - Retrain model
- ✅ `/api/llm/training` - Training management

**All links are ready to use!**


