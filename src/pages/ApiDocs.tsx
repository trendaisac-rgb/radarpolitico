/**
 * RadarPolítico - API Documentation
 * Comprehensive REST API documentation for RadarPolítico platform
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Code2, Copy, Check, ChevronRight, ArrowLeft, Key, Eye, EyeOff,
  Terminal, Globe, Lock, Zap
} from 'lucide-react'

// ============================================
// THEME COLORS
// ============================================

type ThemeKey = 'azul' | 'verde' | 'vermelho' | 'amarelo' | 'roxo' | 'teal'

const themeColors: Record<ThemeKey, { primary: string; accent: string; bg: string; gradient: string }> = {
  azul: { primary: 'hsl(217, 91%, 60%)', accent: 'hsl(217, 91%, 75%)', bg: 'hsl(217, 50%, 15%)', gradient: 'from-blue-500/20 to-blue-600/10' },
  verde: { primary: 'hsl(142, 71%, 45%)', accent: 'hsl(142, 71%, 65%)', bg: 'hsl(142, 40%, 15%)', gradient: 'from-green-500/20 to-green-600/10' },
  vermelho: { primary: 'hsl(0, 84%, 60%)', accent: 'hsl(0, 84%, 75%)', bg: 'hsl(0, 50%, 15%)', gradient: 'from-red-500/20 to-red-600/10' },
  amarelo: { primary: 'hsl(45, 93%, 47%)', accent: 'hsl(45, 93%, 65%)', bg: 'hsl(45, 50%, 15%)', gradient: 'from-yellow-500/20 to-yellow-600/10' },
  roxo: { primary: 'hsl(263, 70%, 50%)', accent: 'hsl(263, 70%, 70%)', bg: 'hsl(263, 40%, 15%)', gradient: 'from-purple-500/20 to-purple-600/10' },
  teal: { primary: 'hsl(175, 80%, 40%)', accent: 'hsl(175, 80%, 60%)', bg: 'hsl(175, 40%, 15%)', gradient: 'from-teal-500/20 to-teal-600/10' },
}

const THEME_LABELS: Record<ThemeKey, string> = {
  azul: 'Azul',
  verde: 'Verde',
  vermelho: 'Vermelho',
  amarelo: 'Amarelo',
  roxo: 'Roxo',
  teal: 'Teal',
}

// ============================================
// API ENDPOINTS DATA
// ============================================

interface Parameter {
  name: string
  type: string
  required: boolean
  description: string
}

interface Endpoint {
  id: string
  category: string
  method: 'GET' | 'POST' | 'DELETE' | 'PUT'
  path: string
  title: string
  description: string
  parameters: Parameter[]
  requestExample: string
  responseExample: string
  rateLimitNote?: string
}

const API_ENDPOINTS: Endpoint[] = [
  // Authentication
  {
    id: 'auth-token',
    category: 'Authentication',
    method: 'POST',
    path: '/auth/token',
    title: 'Get Access Token',
    description: 'Authenticate using OAuth2 client credentials flow. Returns access token for subsequent API calls.',
    parameters: [
      { name: 'client_id', type: 'string', required: true, description: 'Your application client ID' },
      { name: 'client_secret', type: 'string', required: true, description: 'Your application client secret' },
      { name: 'grant_type', type: 'string', required: true, description: 'Must be "client_credentials"' },
    ],
    requestExample: `{
  "client_id": "your_client_id_here",
  "client_secret": "your_client_secret_here",
  "grant_type": "client_credentials"
}`,
    responseExample: `{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "read write"
}`,
    rateLimitNote: 'No rate limit for authentication endpoint'
  },

  // Politicians - List
  {
    id: 'politicians-list',
    category: 'Politicians',
    method: 'GET',
    path: '/politicians',
    title: 'List Monitored Politicians',
    description: 'Retrieve a paginated list of all politicians currently being monitored on your account.',
    parameters: [
      { name: 'page', type: 'integer', required: false, description: 'Page number (default: 1)' },
      { name: 'limit', type: 'integer', required: false, description: 'Results per page (default: 20, max: 100)' },
      { name: 'state', type: 'string', required: false, description: 'Filter by state code (e.g., "SP", "RJ")' },
      { name: 'party', type: 'string', required: false, description: 'Filter by political party' },
    ],
    requestExample: `GET /politicians?page=1&limit=20&state=SP`,
    responseExample: `{
  "data": [
    {
      "id": "pol_123abc",
      "name": "João Silva",
      "position": "Senador",
      "state": "SP",
      "party": "PSDB",
      "image_url": "https://...",
      "monitoring_since": "2024-01-15T10:30:00Z",
      "mentions_count": 1250,
      "sentiment_score": 65
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}`,
  },

  // Politicians - Get Detail
  {
    id: 'politicians-detail',
    category: 'Politicians',
    method: 'GET',
    path: '/politicians/:id',
    title: 'Get Politician Details',
    description: 'Retrieve detailed information about a specific politician including recent mentions and sentiment analysis.',
    parameters: [
      { name: 'id', type: 'string', required: true, description: 'Politician ID' },
    ],
    requestExample: `GET /politicians/pol_123abc`,
    responseExample: `{
  "id": "pol_123abc",
  "name": "João Silva",
  "position": "Senador",
  "state": "SP",
  "party": "PSDB",
  "bio": "Senator from São Paulo...",
  "image_url": "https://...",
  "social_media": {
    "twitter": "@joaosilva",
    "instagram": "joaosilva.senador",
    "facebook": "joaosilva.oficial"
  },
  "monitoring_since": "2024-01-15T10:30:00Z",
  "mentions_24h": 89,
  "mentions_7d": 450,
  "avg_sentiment": 68,
  "trending_topics": ["economia", "educação", "saúde"]
}`,
  },

  // Politicians - Add
  {
    id: 'politicians-add',
    category: 'Politicians',
    method: 'POST',
    path: '/politicians',
    title: 'Add Politician to Monitor',
    description: 'Add a new politician to your monitoring dashboard. Returns the created politician object.',
    parameters: [
      { name: 'name', type: 'string', required: true, description: 'Full name of politician' },
      { name: 'position', type: 'string', required: true, description: 'Political position (Senador, Deputado, Prefeito, etc.)' },
      { name: 'state', type: 'string', required: true, description: 'State code (UF)' },
      { name: 'party', type: 'string', required: true, description: 'Political party abbreviation' },
    ],
    requestExample: `{
  "name": "Maria Santos",
  "position": "Deputada Federal",
  "state": "RJ",
  "party": "PT"
}`,
    responseExample: `{
  "id": "pol_456def",
  "name": "Maria Santos",
  "position": "Deputada Federal",
  "state": "RJ",
  "party": "PT",
  "monitoring_since": "2024-03-02T14:22:00Z",
  "status": "active"
}`,
  },

  // Mentions - List
  {
    id: 'mentions-list',
    category: 'Mentions',
    method: 'GET',
    path: '/politicians/:id/mentions',
    title: 'Get Politician Mentions',
    description: 'Retrieve mentions of a politician across multiple social media platforms with sentiment analysis.',
    parameters: [
      { name: 'id', type: 'string', required: true, description: 'Politician ID' },
      { name: 'start_date', type: 'string', required: false, description: 'ISO 8601 date (e.g., 2024-01-01)' },
      { name: 'end_date', type: 'string', required: false, description: 'ISO 8601 date (e.g., 2024-01-31)' },
      { name: 'sentiment', type: 'string', required: false, description: 'Filter: positivo, neutro, negativo' },
      { name: 'source', type: 'string', required: false, description: 'Filter: twitter, instagram, youtube, etc.' },
      { name: 'limit', type: 'integer', required: false, description: 'Results per page (default: 50, max: 500)' },
    ],
    requestExample: `GET /politicians/pol_123abc/mentions?start_date=2024-02-01&sentiment=negativo&limit=50`,
    responseExample: `{
  "data": [
    {
      "id": "mention_789ghi",
      "politician_id": "pol_123abc",
      "text": "João Silva apresentou importante projeto de lei...",
      "source": "twitter",
      "author_handle": "@user123",
      "author_followers": 5420,
      "engagement": {
        "likes": 150,
        "retweets": 45,
        "replies": 12
      },
      "sentiment": "positivo",
      "sentiment_score": 0.82,
      "published_at": "2024-02-28T15:30:00Z",
      "url": "https://twitter.com/user123/status/..."
    }
  ],
  "summary": {
    "total": 1250,
    "positive": 680,
    "neutral": 350,
    "negative": 220
  }
}`,
  },

  // Mentions - Trending
  {
    id: 'mentions-trending',
    category: 'Mentions',
    method: 'GET',
    path: '/mentions/trending',
    title: 'Get Trending Topics',
    description: 'Get the most discussed topics and trends across all monitored politicians in the last 24 hours.',
    parameters: [
      { name: 'limit', type: 'integer', required: false, description: 'Number of trending topics (default: 10, max: 50)' },
      { name: 'time_period', type: 'string', required: false, description: '24h (default), 7d, 30d' },
    ],
    requestExample: `GET /mentions/trending?limit=10&time_period=24h`,
    responseExample: `{
  "data": [
    {
      "rank": 1,
      "topic": "reforma tributária",
      "mentions": 2540,
      "growth": 45,
      "sentiment_avg": 62,
      "sentiment_distribution": {
        "positive": 1400,
        "neutral": 800,
        "negative": 340
      },
      "sources": {
        "twitter": 1200,
        "instagram": 650,
        "youtube": 350,
        "telegram": 340
      }
    }
  ],
  "updated_at": "2024-02-28T20:00:00Z"
}`,
  },

  // Sentiment - Timeline
  {
    id: 'sentiment-timeline',
    category: 'Sentiment',
    method: 'GET',
    path: '/politicians/:id/sentiment',
    title: 'Get Sentiment Timeline',
    description: 'Retrieve sentiment analysis timeline for a politician over a specified period.',
    parameters: [
      { name: 'id', type: 'string', required: true, description: 'Politician ID' },
      { name: 'start_date', type: 'string', required: true, description: 'ISO 8601 date' },
      { name: 'end_date', type: 'string', required: true, description: 'ISO 8601 date' },
      { name: 'granularity', type: 'string', required: false, description: 'hourly, daily (default), weekly' },
    ],
    requestExample: `GET /politicians/pol_123abc/sentiment?start_date=2024-02-01&end_date=2024-02-28&granularity=daily`,
    responseExample: `{
  "data": [
    {
      "date": "2024-02-01",
      "score": 65,
      "positive": 240,
      "neutral": 150,
      "negative": 85,
      "total_mentions": 475,
      "engagement": 5200
    }
  ],
  "overall_statistics": {
    "average_score": 64,
    "highest_score": 78,
    "lowest_score": 42,
    "trend": "stable"
  }
}`,
  },

  // Sentiment - Breakdown
  {
    id: 'sentiment-breakdown',
    category: 'Sentiment',
    method: 'GET',
    path: '/politicians/:id/sentiment/breakdown',
    title: 'Get Sentiment by Source',
    description: 'Analyze sentiment distribution across different social media sources.',
    parameters: [
      { name: 'id', type: 'string', required: true, description: 'Politician ID' },
      { name: 'start_date', type: 'string', required: false, description: 'ISO 8601 date' },
      { name: 'end_date', type: 'string', required: false, description: 'ISO 8601 date' },
    ],
    requestExample: `GET /politicians/pol_123abc/sentiment/breakdown?start_date=2024-02-01&end_date=2024-02-28`,
    responseExample: `{
  "data": {
    "twitter": {
      "score": 68,
      "positive": 450,
      "neutral": 320,
      "negative": 130,
      "total": 900,
      "engagement": 12500
    },
    "instagram": {
      "score": 72,
      "positive": 280,
      "neutral": 150,
      "negative": 70,
      "total": 500,
      "engagement": 8900
    },
    "youtube": {
      "score": 64,
      "positive": 180,
      "neutral": 200,
      "negative": 120,
      "total": 500,
      "engagement": 35000
    }
  },
  "overall": {
    "score": 68,
    "total_mentions": 1900
  }
}`,
  },

  // Alerts - List
  {
    id: 'alerts-list',
    category: 'Alerts',
    method: 'GET',
    path: '/alerts',
    title: 'List Alert Rules',
    description: 'Get all alert rules configured for your account.',
    parameters: [
      { name: 'page', type: 'integer', required: false, description: 'Page number (default: 1)' },
      { name: 'limit', type: 'integer', required: false, description: 'Results per page (default: 20, max: 100)' },
    ],
    requestExample: `GET /alerts?page=1&limit=20`,
    responseExample: `{
  "data": [
    {
      "id": "alert_123abc",
      "name": "Spike Detection - João Silva",
      "politician_id": "pol_123abc",
      "trigger_type": "sentiment_drop",
      "threshold": 20,
      "enabled": true,
      "created_at": "2024-02-15T10:30:00Z",
      "last_triggered": "2024-02-28T18:45:00Z",
      "notifications": {
        "email": true,
        "webhook": true,
        "slack": false
      }
    }
  ]
}`,
  },

  // Alerts - Create
  {
    id: 'alerts-create',
    category: 'Alerts',
    method: 'POST',
    path: '/alerts',
    title: 'Create Alert Rule',
    description: 'Create a new alert rule to monitor changes in sentiment, mentions spikes, or keyword tracking.',
    parameters: [
      { name: 'name', type: 'string', required: true, description: 'Alert rule name' },
      { name: 'politician_id', type: 'string', required: true, description: 'Politician to monitor' },
      { name: 'trigger_type', type: 'string', required: true, description: 'sentiment_drop, sentiment_spike, mentions_spike, keyword_mention' },
      { name: 'threshold', type: 'number', required: true, description: 'Trigger threshold value' },
      { name: 'webhook_url', type: 'string', required: false, description: 'Webhook endpoint for notifications' },
    ],
    requestExample: `{
  "name": "Mention Spike Alert",
  "politician_id": "pol_123abc",
  "trigger_type": "mentions_spike",
  "threshold": 100,
  "webhook_url": "https://yourapp.com/webhook/alerts"
}`,
    responseExample: `{
  "id": "alert_456def",
  "name": "Mention Spike Alert",
  "politician_id": "pol_123abc",
  "trigger_type": "mentions_spike",
  "threshold": 100,
  "enabled": true,
  "created_at": "2024-03-02T14:22:00Z"
}`,
  },

  // Alerts - Delete
  {
    id: 'alerts-delete',
    category: 'Alerts',
    method: 'DELETE',
    path: '/alerts/:id',
    title: 'Delete Alert Rule',
    description: 'Remove an alert rule from your account. This action cannot be undone.',
    parameters: [
      { name: 'id', type: 'string', required: true, description: 'Alert ID' },
    ],
    requestExample: `DELETE /alerts/alert_123abc`,
    responseExample: `{
  "success": true,
  "message": "Alert rule deleted successfully",
  "deleted_id": "alert_123abc"
}`,
  },

  // Reports - Daily
  {
    id: 'reports-daily',
    category: 'Reports',
    method: 'GET',
    path: '/politicians/:id/reports/daily',
    title: 'Get Daily Report',
    description: 'Retrieve a comprehensive daily report with mentions, sentiment, and trends for a politician.',
    parameters: [
      { name: 'id', type: 'string', required: true, description: 'Politician ID' },
      { name: 'date', type: 'string', required: true, description: 'ISO 8601 date (e.g., 2024-02-28)' },
    ],
    requestExample: `GET /politicians/pol_123abc/reports/daily?date=2024-02-28`,
    responseExample: `{
  "date": "2024-02-28",
  "politician": {
    "id": "pol_123abc",
    "name": "João Silva"
  },
  "summary": {
    "total_mentions": 145,
    "sentiment_score": 68,
    "viral_events": 2,
    "top_sources": ["twitter", "instagram"]
  },
  "mentions": {
    "breakdown": {
      "positive": 95,
      "neutral": 35,
      "negative": 15
    }
  },
  "trends": {
    "top_topics": ["economia", "projetos de lei"],
    "keywords": ["reforma", "senador"]
  },
  "generated_at": "2024-02-29T03:00:00Z"
}`,
  },

  // Reports - Weekly
  {
    id: 'reports-weekly',
    category: 'Reports',
    method: 'GET',
    path: '/politicians/:id/reports/weekly',
    title: 'Get Weekly Report',
    description: 'Generate a comprehensive weekly report summarizing all monitored data and trends.',
    parameters: [
      { name: 'id', type: 'string', required: true, description: 'Politician ID' },
      { name: 'week', type: 'string', required: true, description: 'ISO week year (e.g., 2024-W09)' },
    ],
    requestExample: `GET /politicians/pol_123abc/reports/weekly?week=2024-W09`,
    responseExample: `{
  "week": "2024-W09",
  "start_date": "2024-02-26",
  "end_date": "2024-03-03",
  "politician": {
    "id": "pol_123abc",
    "name": "João Silva"
  },
  "summary": {
    "total_mentions": 890,
    "avg_sentiment": 66,
    "mentions_growth": 15,
    "major_events": 3
  },
  "daily_breakdown": [
    {
      "date": "2024-02-26",
      "mentions": 120,
      "sentiment": 65
    }
  ],
  "comparison": {
    "week_before": {
      "total_mentions": 750,
      "avg_sentiment": 64
    }
  }
}`,
  },

  // Reports - Export
  {
    id: 'reports-export',
    category: 'Reports',
    method: 'POST',
    path: '/reports/export',
    title: 'Export Report',
    description: 'Export reports in PDF or CSV format for sharing or archival purposes.',
    parameters: [
      { name: 'politician_id', type: 'string', required: true, description: 'Politician ID' },
      { name: 'report_type', type: 'string', required: true, description: 'daily, weekly, or custom' },
      { name: 'format', type: 'string', required: true, description: 'pdf or csv' },
      { name: 'start_date', type: 'string', required: false, description: 'For custom reports' },
      { name: 'end_date', type: 'string', required: false, description: 'For custom reports' },
    ],
    requestExample: `{
  "politician_id": "pol_123abc",
  "report_type": "weekly",
  "format": "pdf",
  "start_date": "2024-02-26",
  "end_date": "2024-03-03"
}`,
    responseExample: `{
  "success": true,
  "file_url": "https://api.radarpolitico.com.br/exports/report_abc123.pdf",
  "file_size": "2.5MB",
  "expires_in": 86400,
  "created_at": "2024-03-02T14:22:00Z"
}`,
  },

  // Webhooks - Register
  {
    id: 'webhooks-register',
    category: 'Webhooks',
    method: 'POST',
    path: '/webhooks',
    title: 'Register Webhook',
    description: 'Register a webhook endpoint to receive real-time notifications for monitored events.',
    parameters: [
      { name: 'url', type: 'string', required: true, description: 'HTTPS endpoint to receive events' },
      { name: 'events', type: 'array', required: true, description: 'Array of events to subscribe to' },
      { name: 'active', type: 'boolean', required: false, description: 'Enable webhook immediately (default: true)' },
    ],
    requestExample: `{
  "url": "https://yourapp.com/webhook/radar",
  "events": [
    "mention.created",
    "sentiment.alert",
    "spike.detected"
  ],
  "active": true
}`,
    responseExample: `{
  "id": "webhook_789xyz",
  "url": "https://yourapp.com/webhook/radar",
  "events": [
    "mention.created",
    "sentiment.alert",
    "spike.detected"
  ],
  "active": true,
  "secret": "whsec_abc123def456...",
  "created_at": "2024-03-02T14:22:00Z"
}`,
  },

  // Webhooks - List
  {
    id: 'webhooks-list',
    category: 'Webhooks',
    method: 'GET',
    path: '/webhooks',
    title: 'List Webhooks',
    description: 'Retrieve all registered webhook endpoints for your account.',
    parameters: [
      { name: 'page', type: 'integer', required: false, description: 'Page number (default: 1)' },
      { name: 'limit', type: 'integer', required: false, description: 'Results per page (default: 20, max: 100)' },
    ],
    requestExample: `GET /webhooks?page=1&limit=20`,
    responseExample: `{
  "data": [
    {
      "id": "webhook_789xyz",
      "url": "https://yourapp.com/webhook/radar",
      "events": ["mention.created", "sentiment.alert"],
      "active": true,
      "last_triggered": "2024-02-28T18:45:00Z",
      "delivery_status": {
        "total_deliveries": 156,
        "success": 152,
        "failed": 4
      }
    }
  ]
}`,
  },

  // Webhooks - Delete
  {
    id: 'webhooks-delete',
    category: 'Webhooks',
    method: 'DELETE',
    path: '/webhooks/:id',
    title: 'Delete Webhook',
    description: 'Unregister a webhook endpoint. No further events will be sent to this URL.',
    parameters: [
      { name: 'id', type: 'string', required: true, description: 'Webhook ID' },
    ],
    requestExample: `DELETE /webhooks/webhook_789xyz`,
    responseExample: `{
  "success": true,
  "message": "Webhook deleted successfully",
  "deleted_id": "webhook_789xyz"
}`,
  },
]

// ============================================
// CODE SNIPPET COMPONENT
// ============================================

function CodeBlock({ code, language = 'json' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative">
      <pre className="overflow-x-auto p-4 rounded text-sm" style={{ backgroundColor: 'hsl(0, 0%, 8%)' }}>
        <code className="text-gray-300">{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-2 rounded transition-all"
        style={{ backgroundColor: 'hsl(0, 0%, 15%)' }}
      >
        {copied ? (
          <Check size={16} style={{ color: 'hsl(142, 71%, 45%)' }} />
        ) : (
          <Copy size={16} style={{ color: 'hsl(217, 91%, 60%)' }} />
        )}
      </button>
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function ApiDocs() {
  const navigate = useNavigate()
  const [themeKey, setThemeKey] = useState<ThemeKey>(() => {
    return (localStorage.getItem('dashboard-theme') as ThemeKey) || 'azul'
  })
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint>(API_ENDPOINTS[0])
  const [showApiKey, setShowApiKey] = useState(false)
  const [apiKeyCopied, setApiKeyCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'sdks'>('details')

  const theme = themeColors[themeKey]

  // Group endpoints by category
  const categories = Array.from(new Set(API_ENDPOINTS.map(e => e.category)))
  const endpointsByCategory = categories.map(cat => ({
    category: cat,
    endpoints: API_ENDPOINTS.filter(e => e.category === cat)
  }))

  const mockApiKey = 'sk_live_' + 'x'.repeat(32)

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(mockApiKey)
    setApiKeyCopied(true)
    setTimeout(() => setApiKeyCopied(false), 2000)
  }

  const handleThemeChange = (key: ThemeKey) => {
    setThemeKey(key)
    localStorage.setItem('dashboard-theme', key)
  }

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'POST':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'DELETE':
        return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'PUT':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      default:
        return 'bg-gray-500/20 text-gray-300'
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'hsl(0, 0%, 8%)' }}>
      {/* Header */}
      <div
        className="border-b"
        style={{
          backgroundColor: 'hsl(0, 0%, 10%)',
          borderColor: 'hsl(0, 0%, 20%)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
              style={{ color: theme.primary }}
            >
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: theme.primary }}>
                API Documentation
              </h1>
              <p className="text-sm" style={{ color: 'hsl(0, 0%, 50%)' }}>
                RadarPolítico REST API v1
              </p>
            </div>
          </div>

          {/* API Key Display */}
          <div
            className="flex items-center gap-2 px-4 py-2 rounded border"
            style={{
              backgroundColor: 'hsl(0, 0%, 12%)',
              borderColor: theme.bg
            }}
          >
            <Key size={16} style={{ color: theme.primary }} />
            <div className="flex items-center gap-2">
              <code
                className="text-sm font-mono"
                style={{ color: showApiKey ? theme.primary : 'hsl(0, 0%, 50%)' }}
              >
                {showApiKey ? mockApiKey : '••••••••••••••••••••••••••••••••'}
              </code>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowApiKey(!showApiKey)}
                style={{ color: theme.primary }}
              >
                {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopyApiKey}
                style={{ color: apiKeyCopied ? 'hsl(142, 71%, 45%)' : theme.primary }}
              >
                {apiKeyCopied ? <Check size={16} /> : <Copy size={16} />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div
          className="w-80 border-r overflow-y-auto"
          style={{
            backgroundColor: 'hsl(0, 0%, 9%)',
            borderColor: 'hsl(0, 0%, 20%)'
          }}
        >
          <div className="sticky top-0 p-4 border-b" style={{ borderColor: 'hsl(0, 0%, 20%)' }}>
            <h2 className="font-semibold mb-4" style={{ color: theme.primary }}>
              Endpoints
            </h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(THEME_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => handleThemeChange(key as ThemeKey)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                    themeKey === key
                      ? 'border-2'
                      : 'border opacity-50 hover:opacity-75'
                  }`}
                  style={{
                    color: themeColors[key as ThemeKey].primary,
                    borderColor: themeColors[key as ThemeKey].primary,
                    backgroundColor: themeKey === key ? `${themeColors[key as ThemeKey].bg}40` : 'transparent'
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {endpointsByCategory.map(({ category, endpoints }) => (
            <div key={category} className="border-b" style={{ borderColor: 'hsl(0, 0%, 20%)' }}>
              <div
                className="px-4 py-3 font-semibold text-sm"
                style={{ color: theme.accent, backgroundColor: 'hsl(0, 0%, 11%)' }}
              >
                {category}
              </div>
              {endpoints.map(endpoint => (
                <button
                  key={endpoint.id}
                  onClick={() => setSelectedEndpoint(endpoint)}
                  className="w-full text-left px-4 py-3 text-sm border-l-4 transition-all hover:bg-opacity-100"
                  style={{
                    color: selectedEndpoint.id === endpoint.id ? theme.primary : 'hsl(0, 0%, 60%)',
                    backgroundColor: selectedEndpoint.id === endpoint.id ? 'hsl(0, 0%, 12%)' : 'transparent',
                    borderColor: selectedEndpoint.id === endpoint.id ? theme.primary : 'transparent',
                    borderLeftWidth: '4px'
                  }}
                >
                  <div className="font-mono text-xs mb-1" style={{ color: theme.accent }}>
                    {endpoint.method}
                  </div>
                  <div className="truncate">{endpoint.title}</div>
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-8">
            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b" style={{ borderColor: 'hsl(0, 0%, 20%)' }}>
              {['details', 'sdks'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as 'details' | 'sdks')}
                  className="px-4 py-3 font-semibold border-b-2 transition-all"
                  style={{
                    color: activeTab === tab ? theme.primary : 'hsl(0, 0%, 50%)',
                    borderColor: activeTab === tab ? theme.primary : 'transparent'
                  }}
                >
                  {tab === 'details' ? 'Endpoint Details' : 'SDK Examples'}
                </button>
              ))}
            </div>

            {activeTab === 'details' && (
              <div>
                {/* Endpoint Header */}
                <div className="mb-8">
                  <div className="flex items-center gap-4 mb-4">
                    <Badge
                      className={`${getMethodColor(selectedEndpoint.method)} border`}
                      variant="outline"
                    >
                      {selectedEndpoint.method}
                    </Badge>
                    <code className="text-lg font-mono" style={{ color: 'hsl(0, 0%, 70%)' }}>
                      {selectedEndpoint.path}
                    </code>
                  </div>
                  <h1 className="text-3xl font-bold mb-4" style={{ color: theme.primary }}>
                    {selectedEndpoint.title}
                  </h1>
                  <p className="text-base" style={{ color: 'hsl(0, 0%, 65%)' }}>
                    {selectedEndpoint.description}
                  </p>
                </div>

                {/* Parameters */}
                {selectedEndpoint.parameters.length > 0 && (
                  <Card
                    className="mb-8 border"
                    style={{
                      backgroundColor: 'hsl(0, 0%, 10%)',
                      borderColor: 'hsl(0, 0%, 20%)'
                    }}
                  >
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4" style={{ color: theme.primary }}>
                        Parameters
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr style={{ borderBottomColor: 'hsl(0, 0%, 20%)' }} className="border-b">
                              <th className="text-left py-2 px-3" style={{ color: theme.accent }}>
                                Name
                              </th>
                              <th className="text-left py-2 px-3" style={{ color: theme.accent }}>
                                Type
                              </th>
                              <th className="text-left py-2 px-3" style={{ color: theme.accent }}>
                                Required
                              </th>
                              <th className="text-left py-2 px-3" style={{ color: theme.accent }}>
                                Description
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedEndpoint.parameters.map((param, i) => (
                              <tr
                                key={i}
                                style={{
                                  borderBottomColor: 'hsl(0, 0%, 15%)',
                                  backgroundColor: i % 2 === 0 ? 'hsl(0, 0%, 10%)' : 'hsl(0, 0%, 9%)'
                                }}
                                className="border-b"
                              >
                                <td className="py-3 px-3">
                                  <code
                                    className="font-mono text-sm"
                                    style={{ color: theme.primary }}
                                  >
                                    {param.name}
                                  </code>
                                </td>
                                <td className="py-3 px-3">
                                  <Badge
                                    variant="outline"
                                    className="border"
                                    style={{
                                      color: theme.accent,
                                      backgroundColor: theme.bg,
                                      borderColor: theme.accent
                                    }}
                                  >
                                    {param.type}
                                  </Badge>
                                </td>
                                <td className="py-3 px-3">
                                  {param.required ? (
                                    <Badge
                                      className="bg-red-500/20 text-red-300 border-red-500/30 border"
                                      variant="outline"
                                    >
                                      Required
                                    </Badge>
                                  ) : (
                                    <span style={{ color: 'hsl(0, 0%, 50%)' }}>Optional</span>
                                  )}
                                </td>
                                <td className="py-3 px-3" style={{ color: 'hsl(0, 0%, 60%)' }}>
                                  {param.description}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Examples */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                  {/* Request */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4" style={{ color: theme.primary }}>
                      Request
                    </h3>
                    <CodeBlock code={selectedEndpoint.requestExample} />
                  </div>

                  {/* Response */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4" style={{ color: theme.primary }}>
                      Response
                    </h3>
                    <CodeBlock code={selectedEndpoint.responseExample} />
                  </div>
                </div>

                {/* Rate Limiting */}
                <Card
                  className="border"
                  style={{
                    backgroundColor: 'hsl(0, 0%, 10%)',
                    borderColor: theme.bg
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Zap size={24} style={{ color: theme.primary }} />
                      <div>
                        <h3 className="text-lg font-semibold mb-2" style={{ color: theme.primary }}>
                          Rate Limiting
                        </h3>
                        <p style={{ color: 'hsl(0, 0%, 65%)' }} className="mb-4">
                          {selectedEndpoint.rateLimitNote || 'API requests are rate-limited per plan tier:'}
                        </p>
                        {!selectedEndpoint.rateLimitNote && (
                          <ul className="space-y-2 text-sm" style={{ color: 'hsl(0, 0%, 60%)' }}>
                            <li className="flex items-center gap-2">
                              <span style={{ color: theme.primary }}>▸</span>
                              <span><strong>Pro Plan:</strong> 1,000 requests/min</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <span style={{ color: theme.primary }}>▸</span>
                              <span><strong>Starter Plan:</strong> 100 requests/min</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <span style={{ color: theme.primary }}>▸</span>
                              <span><strong>Micro Plan:</strong> 50 requests/min</span>
                            </li>
                          </ul>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'sdks' && (
              <div className="space-y-8">
                <Card
                  className="border"
                  style={{
                    backgroundColor: 'hsl(0, 0%, 10%)',
                    borderColor: 'hsl(0, 0%, 20%)'
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Code2 size={24} style={{ color: theme.primary }} />
                      <h2 className="text-2xl font-bold" style={{ color: theme.primary }}>
                        SDK Examples
                      </h2>
                    </div>
                    <p style={{ color: 'hsl(0, 0%, 65%)' }} className="mb-6">
                      Here are examples of how to authenticate and make API calls using different SDKs.
                    </p>

                    {/* Python */}
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <span style={{ color: theme.primary }}>Python</span>
                        <Terminal size={16} style={{ color: theme.accent }} />
                      </h3>
                      <CodeBlock
                        code={`import requests

# Authenticate
auth_url = "https://api.radarpolitico.com.br/v1/auth/token"
auth_data = {
    "client_id": "your_client_id",
    "client_secret": "your_client_secret",
    "grant_type": "client_credentials"
}

response = requests.post(auth_url, json=auth_data)
token = response.json()["access_token"]

# Make API request
headers = {"Authorization": f"Bearer {token}"}
api_url = "https://api.radarpolitico.com.br/v1/politicians"
response = requests.get(api_url, headers=headers)
politicians = response.json()

print(politicians)`}
                        language="python"
                      />
                    </div>

                    {/* JavaScript/Node.js */}
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <span style={{ color: theme.primary }}>JavaScript/Node.js</span>
                        <Terminal size={16} style={{ color: theme.accent }} />
                      </h3>
                      <CodeBlock
                        code={`// Authenticate
const authUrl = "https://api.radarpolitico.com.br/v1/auth/token";
const authData = {
  client_id: "your_client_id",
  client_secret: "your_client_secret",
  grant_type: "client_credentials"
};

const authResponse = await fetch(authUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(authData)
});

const { access_token } = await authResponse.json();

// Make API request
const apiUrl = "https://api.radarpolitico.com.br/v1/politicians";
const response = await fetch(apiUrl, {
  headers: { "Authorization": \`Bearer \${access_token}\` }
});

const politicians = await response.json();
console.log(politicians);`}
                        language="javascript"
                      />
                    </div>

                    {/* cURL */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <span style={{ color: theme.primary }}>cURL</span>
                        <Terminal size={16} style={{ color: theme.accent }} />
                      </h3>
                      <CodeBlock
                        code={`# Step 1: Authenticate
curl -X POST https://api.radarpolitico.com.br/v1/auth/token \\
  -H "Content-Type: application/json" \\
  -d '{
    "client_id": "your_client_id",
    "client_secret": "your_client_secret",
    "grant_type": "client_credentials"
  }'

# Step 2: Use token in requests
curl -X GET https://api.radarpolitico.com.br/v1/politicians \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"`}
                        language="bash"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Footer */}
            <div
              className="mt-16 p-6 rounded border text-center"
              style={{
                backgroundColor: 'hsl(0, 0%, 10%)',
                borderColor: theme.bg
              }}
            >
              <p style={{ color: 'hsl(0, 0%, 60%)' }} className="mb-4">
                Need help? Check our documentation or contact support.
              </p>
              <div className="flex items-center justify-center gap-4">
                <Globe size={16} style={{ color: theme.primary }} />
                <a
                  href="https://docs.radarpolitico.com.br"
                  style={{ color: theme.primary }}
                  className="hover:underline"
                >
                  Full Documentation
                </a>
                <span style={{ color: 'hsl(0, 0%, 30%)' }}>•</span>
                <Lock size={16} style={{ color: theme.primary }} />
                <a
                  href="https://support.radarpolitico.com.br"
                  style={{ color: theme.primary }}
                  className="hover:underline"
                >
                  Support
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
