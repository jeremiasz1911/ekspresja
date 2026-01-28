export type PresenceState = "online" | "offline";

export type PresenceDoc = {
  state: PresenceState;
  lastSeenAt: number; // ms
};
