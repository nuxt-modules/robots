import { visit } from 'unist-util-visit'
import { parse } from 'yaml'

export default function remarkFrontmatterProcessor(top) {
  return (tree, two, three) => {
    console.log('tree', tree, { two, three })
    visit(tree, 'yaml', (node) => {
      console.log(node)
      const data = parse(node.value)
      // Process the frontmatter data here
      console.log(data)
    })
  }
}
