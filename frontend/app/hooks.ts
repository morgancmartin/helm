
export function useOnEnter(handler: Function) {
  const onKeyDown = (e: any) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      handler()
    }
  }

  return {
    onKeyDown
  }
}
