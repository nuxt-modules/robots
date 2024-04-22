export type RuleValue = string | boolean | ((...args: unknown[]) => unknown) | (string | boolean | ((...args: unknown[]) => unknown))[]

export type Rule = {
  [key: string]: RuleValue
}
