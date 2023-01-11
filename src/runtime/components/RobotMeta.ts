import { defineComponent } from 'vue'
import { defineRobotMeta } from '#imports'

export default defineComponent({
  name: 'RobotMeta',
  setup() {
    defineRobotMeta()
    return () => null
  },
})
