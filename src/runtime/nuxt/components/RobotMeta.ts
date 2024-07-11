import { defineComponent } from 'vue'
import { defineRobotMeta } from '#imports'

/**
 * @deprecated The robots meta tag is now enabled by default.
 */
export default defineComponent({
  name: 'RobotMeta',
  setup() {
    defineRobotMeta(true)
    return () => null
  },
})
