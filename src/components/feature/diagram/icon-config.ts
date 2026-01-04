/**
 * Diagram機能で使用するアイコンの一覧
 */

import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  BatteryWarning,
  BookOpen,
  Brain,
  BrainCircuit,
  CheckCircle,
  CheckSquare,
  EyeOff,
  FileSearch,
  FileText,
  Flag,
  HelpCircle,
  LayoutDashboard,
  LayoutTemplate,
  Lightbulb,
  Map as MapIcon,
  MessageCircle,
  MessageSquare,
  PenTool,
  Scale,
  Search,
  Settings,
  Target,
  Users,
  Zap,
} from 'lucide-react';

/**
 * 使用可能なアイコン名の配列（真実の源）
 * Zodスキーマ生成で直接使用可能なタプル型
 */
export const ICON_NAMES = [
  'activity',
  'alert',
  'alertTriangle',
  'arrow',
  'arrowRight',
  'batteryWarning',
  'bookOpen',
  'brain',
  'brainCircuit',
  'check',
  'checkCircle',
  'checkSquare',
  'eyeOff',
  'fileSearch',
  'fileText',
  'flag',
  'help',
  'layoutDashboard',
  'layoutTemplate',
  'lightbulb',
  'map',
  'message',
  'messageSquare',
  'pen',
  'scale',
  'search',
  'settings',
  'target',
  'users',
  'zap',
] as const;

/**
 * アイコン名の型定義（ICON_NAMESから派生）
 */
export type IconName = (typeof ICON_NAMES)[number];

/**
 * アイコン名とLucideコンポーネントのマッピング
 * ICON_NAMESの型に基づいて型安全性を保証
 */
export const ICON_MAP: Record<IconName, LucideIcon> = {
  activity: Activity,
  alert: AlertCircle,
  alertTriangle: AlertTriangle,
  arrow: ArrowDown,
  arrowRight: ArrowRight,
  batteryWarning: BatteryWarning,
  bookOpen: BookOpen,
  brain: Brain,
  brainCircuit: BrainCircuit,
  check: CheckCircle,
  checkCircle: CheckCircle,
  checkSquare: CheckSquare,
  eyeOff: EyeOff,
  fileSearch: FileSearch,
  fileText: FileText,
  flag: Flag,
  help: HelpCircle,
  layoutDashboard: LayoutDashboard,
  layoutTemplate: LayoutTemplate,
  lightbulb: Lightbulb,
  map: MapIcon,
  message: MessageCircle,
  messageSquare: MessageSquare,
  pen: PenTool,
  scale: Scale,
  search: Search,
  settings: Settings,
  target: Target,
  users: Users,
  zap: Zap,
};
