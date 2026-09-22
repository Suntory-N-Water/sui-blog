import ArticleImage from './ArticleImage.astro';
import Block from './Block.astro';
import BlockquoteGroup from './BlockquoteGroup.astro';
import CodeBlock from './CodeBlock.astro';
import FootnoteLink from './FootnoteLink.astro';

export const articlePortableTextComponents = {
  block: Block,
  mark: {
    link: FootnoteLink,
  },
  type: {
    blockquoteGroup: BlockquoteGroup,
    code: CodeBlock,
    image: ArticleImage,
  },
};
