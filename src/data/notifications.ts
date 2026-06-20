import { NotificationTemplate, NotificationRecord } from '../types/notification';
import { generateId } from '../utils';

const now = Date.now();

export const mockTemplates: NotificationTemplate[] = [
  {
    id: generateId(),
    type: 'open',
    title: '开摊通知',
    content: '亲爱的顾客，本周农夫市集已开摊！您预订的商品已经备好，欢迎在约定时段前来取货。地址：城东公园周末市集 A12 摊位。',
    target: 'all'
  },
  {
    id: generateId(),
    type: 'outOfStock',
    title: '缺货说明',
    content: '抱歉通知您，您预订的部分商品因突发情况暂时缺货。我们已为您准备了同等价值的替代商品，或您可选择退款处理。如有疑问请联系摊主。',
    target: 'specific'
  },
  {
    id: generateId(),
    type: 'close',
    title: '收摊提醒',
    content: '今日市集即将结束，还有未取货的顾客请尽快前来。感谢您的支持，下周末我们不见不散！',
    target: 'pending'
  }
];

export const mockNotificationRecords: NotificationRecord[] = [
  {
    id: generateId(),
    templateId: mockTemplates[0].id,
    type: 'open',
    title: '开摊通知',
    content: '亲爱的顾客，本周农夫市集已开摊！您预订的商品已经备好，欢迎在约定时段前来取货。地址：城东公园周末市集 A12 摊位。',
    target: 'all',
    targetCount: 128,
    sentAt: new Date(now - 3600000 * 4).toISOString(),
    status: 'success'
  },
  {
    id: generateId(),
    type: 'outOfStock',
    title: '古法红糖馒头缺货说明',
    content: '抱歉通知您，您预订的古法红糖馒头因制作量不足暂时缺货。我们为您准备了手工花卷作为替代，或可办理退款。如有疑问请联系摊主。',
    target: 'specific',
    targetCount: 23,
    sentAt: new Date(now - 3600000 * 2).toISOString(),
    status: 'success'
  },
  {
    id: generateId(),
    templateId: mockTemplates[1].id,
    type: 'outOfStock',
    title: '水蜜桃礼盒缺货',
    content: '抱歉通知您，水蜜桃礼盒8个装已售罄，您可选择更换为4个装×2，或办理差额退款。给您带来不便敬请谅解！',
    target: 'specific',
    targetCount: 8,
    sentAt: new Date(now - 3600000 * 6).toISOString(),
    status: 'success'
  },
  {
    id: generateId(),
    templateId: mockTemplates[2].id,
    type: 'close',
    title: '收摊提醒',
    content: '今日市集即将结束，还有未取货的顾客请尽快前来。感谢您的支持，下周末我们不见不散！',
    target: 'pending',
    targetCount: 15,
    sentAt: new Date(now - 86400000).toISOString(),
    status: 'success'
  }
];
