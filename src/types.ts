export type RuleValue = string | boolean | Function | (string | boolean | Function)[]

export type Rule = {
  [key: string]: RuleValue
}
