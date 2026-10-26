import "server-only";
import { eventSamples } from "@/tools/searchEvents";

export async function getEventDetails(eventIds: string[]) {
  const events = eventIds.flatMap((id) => {
    const event = eventSamples.find((sample) => sample.id === id);
    return event ? [{ ...event, scale: "찾지 못함", fee: "찾지 못함", operatingNotes: event.format }] : [];
  });
  return { source_type: "fictional_local_samples", events, missing_ids: eventIds.filter((id) => !events.some((event) => event.id === id)) };
}
