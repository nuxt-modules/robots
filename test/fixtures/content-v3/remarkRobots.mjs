import { visit } from 'unist-util-visit'
import { parse } from 'yaml'

// TODO experiment with remark plugins
export default function remarkFrontmatterProcessor() {
  return (tree) => {
    visit(tree, 'yaml', (node) => {
      parse(node.value)
      // Process the frontmatter data here
    })
  }
}
