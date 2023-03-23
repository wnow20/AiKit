export function isApproachBottom(ref: HTMLElement, gap: number) {
  console.log('isApproachBottom', ref.scrollHeight - ref.clientHeight - ref.scrollTop < gap)
  return ref.scrollHeight - ref.clientHeight - ref.scrollTop < gap
}

export function scrollToBottom(ref: HTMLElement) {
  console.log('scrollToBottom', ref.scrollHeight - ref.clientHeight)
  ref.scrollTop = ref.scrollHeight - ref.clientHeight
}
