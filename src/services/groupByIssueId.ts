export function groupByIssueId<Item extends { issueId: string }>(
  items: Item[]
): Map<string, Item[]> {
  const itemsByIssueId = new Map<string, Item[]>()
  for (const item of items) {
    const itemsOfSameIssue = itemsByIssueId.get(item.issueId) ?? []
    itemsOfSameIssue.push(item)
    itemsByIssueId.set(item.issueId, itemsOfSameIssue)
  }
  return itemsByIssueId
}
