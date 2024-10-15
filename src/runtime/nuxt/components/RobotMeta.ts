import { defineRobotMeta } from '#imports'
import { defineComponent } from 'vue'

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
