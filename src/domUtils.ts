export function isApproachBottom(ref: HTMLElement, gap: number) {
  console.debug('isApproachBottom', ref.scrollHeight - ref.clientHeight - ref.scrollTop < gap)
  return ref.scrollHeight - ref.clientHeight - ref.scrollTop < gap
}

export function scrollToBottom(ref: HTMLElement) {
  const targetScrollTop = ref.scrollHeight - ref.clientHeight
  ref.scroll({
    behavior: 'smooth',
    top: targetScrollTop,
  })
}

export function elementBoundCheck(element: HTMLDivElement | null) {
  if (!element) {
    return
  }
  const clientRect = element.getBoundingClientRect()

  let transX = 0
  let transY = 0
  if (clientRect.right > window.innerWidth) {
    transX = window.innerWidth - clientRect.right
  }
  if (clientRect.left < 0) {
    transX = -clientRect.left
  }
  if (clientRect.top < 0) {
    transY = -clientRect.top
  }
  if (clientRect.bottom > window.innerHeight) {
    transY = window.innerHeight - clientRect.bottom
  }
  // dialogBoxRef.current.style.transform = `translate(${transX}px, ${transY}px`;
  return {
    x: transX,
    y: transY,
  }
}
