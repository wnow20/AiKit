export function isApproachBottom(ref: HTMLElement, gap: number) {
  console.log('isApproachBottom', ref.scrollHeight - ref.clientHeight - ref.scrollTop < gap)
  return ref.scrollHeight - ref.clientHeight - ref.scrollTop < gap
}

export function scrollToBottom(ref: HTMLElement) {
  const targetScrollTop = ref.scrollHeight - ref.clientHeight
  console.log('scrollToBottom', targetScrollTop)
  ref.scroll({
    behavior: 'smooth',
    top: targetScrollTop,
  })
}
