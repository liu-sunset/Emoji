export interface StyleOption {
  id: string;
  name: string;
  description: string;
  isCustom?: boolean;
}

export interface BubblePreset {
  id: string;
  name: string;
  texts: string[];
}

export const DEFAULT_STYLE = '卡通风';
export const DEFAULT_BUBBLE_TEXT = ['早上好', '咦', '抱抱', '谢谢', '亲亲', '做得好'];

export const styleOptions: StyleOption[] = [
  { id: 'cartoon', name: '卡通风', description: '卡通风格的可爱表情包' },
  { id: 'disney', name: '迪士尼风格', description: '迪士尼风格的梦幻插画' },
  { id: 'pixel', name: '像素风格', description: '复古像素游戏风格' },
  { id: 'watercolor', name: '水彩画风格', description: '柔和的水彩插画风格' },
  { id: 'flat', name: '扁平插画风格', description: '现代扁平设计风格' },
  { id: 'vintage', name: '复古漫画风格', description: '经典美式漫画风格' },
  { id: 'cyberpunk', name: '赛博朋克风格', description: '未来科技感风格' },
  { id: 'custom', name: '自定义风格', description: '输入你想要的风格描述', isCustom: true },
];

export const bubblePresets: BubblePreset[] = [
  {
    id: 'preset1',
    name: '日常问候',
    texts: ['早上好', '咦', '抱抱', '谢谢', '亲亲', '做得好'],
  },
  {
    id: 'preset2',
    name: '社交互动',
    texts: ['你好呀', '哈哈', '加油', '爱你', '么么哒', '辛苦啦'],
  },
  {
    id: 'preset3',
    name: '网络热梗',
    texts: ['笑死', '离谱', '救命', '好耶', '太卷', '冲鸭'],
  },
];

export const PROMPT_TEMPLATE = `制作一个 2000px * 2000px 固定尺寸的透明背景 {style} 风格画布，画面包含六个 Q 版贴纸表情包，排成 3 行 2 列的布局，每行 2 个表情包，每列 3 个表情包，表情包之间保持严格宽敞的间距，确保裁切过程中不会破坏表情包的完整性。

每个格子内包含一个独立的 Q 版贴纸，贴纸有着不同的穿搭、姿势和表情。每个贴纸都带有清晰的白色边框（边框宽度至少 3px），并且配有对话气泡（气泡大小要小一点），气泡内文字包括："{bubble1}"、"{bubble2}"、"{bubble3}"、"{bubble4}"、"{bubble5}"、"{bubble6}"。

重要约束:
- 生成图片的背景必须是纯绿色 (#00FF00),确保主体与背景有明显分界，便于 AI 抠图算法识别
- 背景必须是高对比度的纯色背景，不能使用渐变、纹理或复杂图案
- 纯绿色背景与前景 (人物、衣物、气泡) 形成强烈对比，确保抠图时能准确分离主体
- **气泡文字必须清晰锐利，不能有任何模糊或虚化效果**
- **气泡文字的边缘必须清晰，文字颜色与气泡背景形成高对比度（建议使用黑色或深色文字）**
- **气泡本身的轮廓必须清晰，气泡边框与绿色背景形成明显分界**
- **人物头发丝、衣物边缘等细节必须清晰，不能有模糊或融合到背景中**
- **所有前景元素 (人物、气泡、文字) 都必须与绿色背景有明显的颜色分界线**
- 每个格子内的 Q 版贴纸和气泡文字的宽高都不能超过 500px
- 上下左右相邻的表情包之间保持至少 120px 的间距
- 确保气泡文字完整显示在气泡内，不能被裁切或超出气泡边界`;

export function buildPrompt(style: string, bubbleTexts: string[]): string {
  return PROMPT_TEMPLATE
    .replace('{style}', style)
    .replace('{bubble1}', bubbleTexts[0] || '')
    .replace('{bubble2}', bubbleTexts[1] || '')
    .replace('{bubble3}', bubbleTexts[2] || '')
    .replace('{bubble4}', bubbleTexts[3] || '')
    .replace('{bubble5}', bubbleTexts[4] || '')
    .replace('{bubble6}', bubbleTexts[5] || '');
}
