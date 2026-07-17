export const motionDuration = {
  instant: 0.18,
  fast: 0.2,
  base: 0.28,
  slow: 0.38,
};

export const motionEase = {
  standard: [0.2, 0, 0, 1],
  enter: [0.16, 1, 0.3, 1],
  exit: [0.4, 0, 1, 1],
};

export const motionSpring = {
  responsive: { type: "spring", stiffness: 360, damping: 34, mass: 0.82 },
  gentle: { type: "spring", stiffness: 280, damping: 30, mass: 0.9 },
};

export const pageMotion = {
  initial: { opacity: 0.99, y: 2 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: motionDuration.instant, ease: motionEase.standard },
};

export const popoverMotion = {
  initial: { opacity: 0, y: -4, scale: 0.99 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -3, scale: 0.995 },
  transition: { duration: motionDuration.fast, ease: motionEase.enter },
};

export const drawerMotion = {
  initial: { opacity: 0, y: -6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -5 },
  transition: { duration: motionDuration.base, ease: motionEase.enter },
};

export const backdropMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: motionDuration.fast, ease: motionEase.standard },
};

export const modalMotion = {
  initial: { opacity: 0, y: 10, scale: 0.99 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 6, scale: 0.995 },
  transition: motionSpring.responsive,
};

export const panelMotion = {
  initial: { opacity: 0, y: 3 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -2 },
  transition: { duration: motionDuration.fast, ease: motionEase.standard },
};

export const itemMotion = {
  initial: { opacity: 0, scale: 0.995 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.995 },
  transition: { duration: motionDuration.fast, ease: motionEase.standard },
};

export const toastMotion = {
  initial: { opacity: 0, y: 8, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 6, scale: 0.99 },
  transition: motionSpring.responsive,
};
