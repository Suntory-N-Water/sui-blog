import Block from './Block.astro';
import BlockquoteGroup from './BlockquoteGroup.astro';
import CodeBlock from './CodeBlock.astro';

export const articlePortableTextComponents = {
  block: Block,
  type: {
    blockquoteGroup: BlockquoteGroup,
    code: CodeBlock,
  },
};
