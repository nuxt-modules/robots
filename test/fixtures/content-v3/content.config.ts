import { defineCollection } from '@nuxt/content'
import {asRobotsCollection} from "../../../src/content";

export const collections = {
  content: asRobotsCollection(defineCollection({
    type: 'page',
    source: '**/*.md'
  }))
}
