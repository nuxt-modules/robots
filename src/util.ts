export const asArray = (v: any) => typeof v === 'undefined' ? [] : (Array.isArray(v) ? v : [v])
