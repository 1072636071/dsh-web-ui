/**
 * Host loader entry for the task-board plugin.
 *
 * Everything the board does is browser work (DOM, localStorage, driving the
 * client runtime's session services over the wire), so the host half has no
 * behavior — mirroring the skin-center plugin form.
 */

/** Provides no host-side behavior: board state and execution are pure browser work. */
export function apply(): void {}
