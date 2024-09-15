export function toGenericTag(tagName: string, tagValue: string) {
  return `${tagName}:${tagValue}`;
}

export function isGenericTagName(tagName: string) {
  return /^[a-zA-Z]$/.test(tagName);
}
