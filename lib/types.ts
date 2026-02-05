// Pipeline 状态类型定义

export interface RawEvent {
  message_id: number;
  channel: string;
  text: string;
  date: string;
  author: string | null;
  media_type: string | null;
  raw_data?: Record<string, any>;
}

export interface Impact {
  amount: string | null;
  change: string | null;
  scope: string | null;
}

export interface StructuredEvent {
  event_type: string;
  project: string | null;
  chain: string | null;
  impact: Impact | string | null;
  timestamp: string;
  summary: string;
  confidence: number;
  keywords: string[];
  source_message_id: number;
  source_channel: string;
  source_date: string;
}

export interface Cluster {
  event_fingerprint: string;
  support_count: number;
  media_sources: string[];
  aggregated_summary: string;
  confidence: number;
  events: StructuredEvent[];
  event_type?: string;
  project?: string | null;
  chain?: string | null;
  impact?: Impact | string | null;
}

export interface Decision {
  trigger: boolean;
  triggered_clusters?: number;
  best_cluster?: Cluster | null;
  decision?: {
    confidence: number;
    reason: string;
  };
  all_clusters?: number;
  reason?: string;
  confidence?: number;
}

export interface Evidence {
  source: string;
  text: string;
  url?: string | null;
  credibility: string;
  source_type: 'media' | 'search' | 'twitter';
}

export interface Article {
  title: string;
  lead: string;
  body_html: string;
  summary: string;
  twitter_thread: string[];
  tg_text: string;
  tags: string[];
  headlines: Array<{ text: string; score: number }>;
  cover_image_url?: string;
}

export interface ArticleValidation {
  article_validated: boolean;
  issues: Array<{
    type: string;
    severity: string;
    location: string;
    description: string;
    suggestion?: string;
  }>;
  edits?: Array<{
    loc: string;
    suggest: string;
  }>;
}

export interface FormatValidation {
  format_validated: boolean;
  checks: Record<string, any>;
  overall_score?: number;
  ready_for_publish?: boolean;
}

export interface Metadata {
  created_at: string;
  processed_count?: number;
  collection_time?: string;
  extracted_count?: number;
  cluster_count?: number;
  decision_time?: string;
  [key: string]: any;
}

export interface PipelineState {
  raw_events: RawEvent[];
  structured_events: StructuredEvent[];
  clusters: Cluster[];
  decision: Decision | null;
  evidence_bundle: Evidence[] | null;
  synth_summary: string | null;
  disputed_points: string[] | null;
  article: Article | null;
  article_validation: ArticleValidation | null;
  format_validation: FormatValidation | null;
  metadata: Metadata;
  notification_sent?: boolean;
}

export interface PipelineListItem {
  id: string;
  filename: string;
  createdAt: string;
  modifiedAt: string;
  size: number;
  title?: string;
}

// 成本报告类型
export interface TokenUsage {
  node: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens?: number;
  timestamp: string;
}

export interface ExternalApiUsage {
  node: string;
  api_name: string;
  request_count: number;
  image_count?: number;
  timestamp: string;
}

export interface NodeCost {
  model: string;
  input_tokens: number;
  output_tokens: number;
  cache_tokens: number;
  cost: number;
}

export interface ApiCost {
  api_name: string;
  request_count: number;
  image_count: number;
  cost: number;
}

export interface CostSummary {
  llm_cost: number;
  external_api_cost: number;
  total_cost: number;
  total_cost_cny: number;
  llm_breakdown: Record<string, NodeCost>;
  api_breakdown: Record<string, ApiCost>;
  execution_time: number;
}

export interface CostReport {
  pipeline_id: string;
  timestamp: string;
  summary: CostSummary;
  token_usage_records: TokenUsage[];
  external_api_records: ExternalApiUsage[];
}

export interface CostReportListItem {
  id: string;
  filename: string;
  createdAt: string;
  modifiedAt: string;
  size: number;
  total_cost?: number;
}

// Pipeline 节点信息
export type NodeStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface PipelineNode {
  id: string;
  name: string;
  description: string;
  status: NodeStatus;
  startTime?: string;
  endTime?: string;
  duration?: number;
  cost?: number;
}

