import type { PipelineState, NodeStatus } from './types';

export const NODE_CONFIG = [
  { id: 'l1', name: 'L1 数据采集', icon: '📥', description: '从 Telegram 频道抓取消息' },
  { id: 'l2', name: 'L2 事件抽取', icon: '🔍', description: '使用 LLM 将原始消息转换为结构化事件' },
  { id: 'l3', name: 'L3 事件聚合', icon: '🔗', description: '识别相同事件，将多个媒体来源的报道聚合成簇' },
  { id: 'l4', name: 'L4 触发判断', icon: '⚡', description: '判断事件簇是否满足要闻生成条件' },
  { id: 'l5_1', name: 'L5.1 多源整合', icon: '📚', description: '使用 Tavily 搜索更多证据，整合原始消息和搜索结果' },
  { id: 'l5_2', name: 'L5.2 要闻撰写', icon: '✍️', description: '基于证据包撰写多格式文章' },
  { id: 'l5_3', name: 'L5.3 审校核验', icon: '✅', description: '核心任务：幻觉检测与一致性校验' },
  { id: 'l5_4', name: 'L5.4 格式验证', icon: '📋', description: '使用规则 + LLM 验证文章是否符合 AICoin 发布标准' },
  { id: 'l6', name: 'L6 视觉设计', icon: '🎨', description: '生成文章封面图（900x383）' },
  { id: 'notification', name: '通知推送', icon: '📤', description: '将最终文章推送到管理后台 / 企业微信 / Telegram' },
];

export function getNodeStatus(nodeId: string, state: PipelineState): NodeStatus {
  switch (nodeId) {
    case 'l1':
      return state.raw_events.length > 0 ? 'completed' : 'pending';
    case 'l2':
      return state.structured_events.length > 0 ? 'completed' : 'pending';
    case 'l3':
      return state.clusters.length > 0 ? 'completed' : 'pending';
    case 'l4':
      return state.decision ? 'completed' : 'pending';
    case 'l5_1':
      return state.evidence_bundle ? 'completed' : (state.decision?.trigger ? 'pending' : 'skipped');
    case 'l5_2':
      return state.article ? 'completed' : (state.decision?.trigger ? 'pending' : 'skipped');
    case 'l5_3':
      return state.article_validation ? 'completed' : (state.decision?.trigger ? 'pending' : 'skipped');
    case 'l5_4':
      return state.format_validation ? 'completed' : (state.decision?.trigger ? 'pending' : 'skipped');
    case 'l6':
      return state.article?.cover_image_url ? 'completed' : (state.decision?.trigger ? 'pending' : 'skipped');
    case 'notification':
      // 需要从 metadata 判断，暂时返回 pending
      return 'pending';
    default:
      return 'pending';
  }
}

export function getStatusColor(status: NodeStatus): string {
  switch (status) {
    case 'completed':
      return 'bg-green-500';
    case 'running':
      return 'bg-blue-500';
    case 'failed':
      return 'bg-red-500';
    case 'skipped':
      return 'bg-gray-300';
    case 'pending':
    default:
      return 'bg-gray-400';
  }
}

export function getStatusText(status: NodeStatus): string {
  switch (status) {
    case 'completed':
      return '已完成';
    case 'running':
      return '运行中';
    case 'failed':
      return '失败';
    case 'skipped':
      return '已跳过';
    case 'pending':
    default:
      return '待执行';
  }
}

