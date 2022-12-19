import { defineComponent } from 'vue'
import { defineRobotMeta } from '#imports'

export default defineComponent<{
  title?: string
  description?: string
  component?: string
}>({
  name: 'RobotMeta',
  setup() {
    defineRobotMeta()
    return () => null
  },
})
