/** True when the key event target is a field the user types into, so global shortcuts stay out of the way. */
export const isTypingTarget = (target) => {
    if (!target) return false
    if (target.isContentEditable) return true
    const tag = target.tagName
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

/** True when a modifier is held: browser and OS shortcuts must keep working. */
export const hasModifier = (e) => e.ctrlKey || e.metaKey || e.altKey
