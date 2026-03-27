// src/core/msr/liveSwipeStore.ts
let lastSwipe: any = null;

export function setLiveSwipe(data: any) {
  lastSwipe = data;
}

export function getLiveSwipe() {
  return lastSwipe;
}
