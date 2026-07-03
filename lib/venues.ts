/* ------------------------------------------------------------------ */
/*  VENUES — shared source of truth                                    */
/*                                                                     */
/*  Used by the home page (Trending Venues), the venue detail route    */
/*  (/venues/[id]), and the booking flow. Detail copy (summary,        */
/*  highlights, inclusions…) is generated per-sport so every venue     */
/*  gets a rich detail page without hand-authoring each one.           */
/* ------------------------------------------------------------------ */

import { CircleParking, Toilet, Lightbulb, Snowflake, CircleDot, type LucideIcon } from "lucide-react";

export type Venue = {
  id: string;
  name: string;
  area: string;
  distanceKm: number;
  rating: number;
  pricePerHour: number;
  status: "Available" | "Filling Fast" | "Full";
  sport: string;
  image: string;
};

export const TRENDING_VENUES: Venue[] = [
  {
    id: "v1",
    name: "Cricket Arena",
    area: "Bhawani Nagar",
    distanceKm: 2.1,
    rating: 4.8,
    pricePerHour: 600,
    status: "Available",
    sport: "Cricket",
    image:
      "linear-gradient(135deg, rgba(20,30,15,0.55), rgba(20,30,15,0.15)), radial-gradient(circle at 30% 100%, #fb923c33, transparent 60%)",
  },
  {
    id: "v2",
    name: "Smash Zone",
    area: "Shobhagpura",
    distanceKm: 3.4,
    rating: 4.7,
    pricePerHour: 350,
    status: "Available",
    sport: "Badminton",
    image:
      "linear-gradient(135deg, rgba(10,20,40,0.6), rgba(10,20,40,0.2)), radial-gradient(circle at 70% 100%, #38bdf833, transparent 60%)",
  },
  {
    id: "v3",
    name: "Pickleball Hub",
    area: "Hiran Magri",
    distanceKm: 1.8,
    rating: 4.9,
    pricePerHour: 450,
    status: "Filling Fast",
    sport: "Pickleball",
    image:
      "linear-gradient(135deg, rgba(60,30,10,0.55), rgba(60,30,10,0.15)), radial-gradient(circle at 50% 100%, #fbbf2444, transparent 60%)",
  },
  {
    id: "v4",
    name: "Hitting Point",
    area: "Sukher",
    distanceKm: 2.7,
    rating: 4.6,
    pricePerHour: 900,
    status: "Available",
    sport: "Tennis",
    image:
      "linear-gradient(135deg, rgba(50,10,10,0.55), rgba(50,10,10,0.15)), radial-gradient(circle at 60% 100%, #f8717144, transparent 60%)",
  },
  {
    id: "v5",
    name: "Net Practice Pro",
    area: "Bhuwana",
    distanceKm: 4.2,
    rating: 4.5,
    pricePerHour: 500,
    status: "Available",
    sport: "Cricket",
    image:
      "linear-gradient(135deg, rgba(15,40,25,0.55), rgba(15,40,25,0.15)), radial-gradient(circle at 40% 100%, #34d39933, transparent 60%)",
  },
  {
    id: "v6",
    name: "Kickoff Turf",
    area: "Goverdhan Vilas",
    distanceKm: 5.1,
    rating: 4.4,
    pricePerHour: 1200,
    status: "Filling Fast",
    sport: "Football",
    image:
      "linear-gradient(135deg, rgba(10,40,30,0.55), rgba(10,40,30,0.15)), radial-gradient(circle at 35% 100%, #2dd4bf33, transparent 60%)",
  },
  {
    id: "v7",
    name: "Rally Point TT",
    area: "Fatehpura",
    distanceKm: 3.0,
    rating: 4.7,
    pricePerHour: 250,
    status: "Available",
    sport: "Table Tennis",
    image:
      "linear-gradient(135deg, rgba(40,10,30,0.55), rgba(40,10,30,0.15)), radial-gradient(circle at 55% 100%, #fb718533, transparent 60%)",
  },
  {
    id: "v8",
    name: "Cue Masters Lounge",
    area: "Chetak Circle",
    distanceKm: 2.4,
    rating: 4.6,
    pricePerHour: 300,
    status: "Available",
    sport: "Snooker",
    image:
      "linear-gradient(135deg, rgba(25,15,45,0.55), rgba(25,15,45,0.15)), radial-gradient(circle at 45% 100%, #a78bfa33, transparent 60%)",
  },
];

export function getVenueById(id: string): Venue | undefined {
  return TRENDING_VENUES.find((v) => v.id === id);
}

/* ------------------------------------------------------------------ */
/*  DETAIL COPY (generated per sport)                                  */
/* ------------------------------------------------------------------ */

export interface VenueDetail {
  summary: string;
  hours: string;
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  amenities: { icon: LucideIcon; label: string }[];
}

const PARKING = { icon: CircleParking, label: "Parking" };
const WASHROOM = { icon: Toilet, label: "Washroom" };
const FLOODLIGHTS = { icon: Lightbulb, label: "Floodlights" };

const SPORT_DETAILS: Record<string, Omit<VenueDetail, "summary">> = {
  Cricket: {
    hours: "6:00 AM – 11:00 PM",
    highlights: ["Floodlit turf pitch", "Bowling machine on request", "Free parking", "Seating for spectators"],
    inclusions: ["Turf pitch access", "Stumps & bails", "Drinking water", "Changing room"],
    exclusions: ["Bats & personal gear", "Food & beverages", "Coaching sessions"],
    amenities: [PARKING, WASHROOM, FLOODLIGHTS],
  },
  Badminton: {
    hours: "6:00 AM – 11:00 PM",
    highlights: ["Wooden sprung court", "Anti-slip flooring", "Air-conditioned hall", "Well-lit courts"],
    inclusions: ["Court access", "Net setup", "Drinking water", "Changing room"],
    exclusions: ["Rackets & shuttles", "Food & beverages", "Coaching"],
    amenities: [{ icon: Snowflake, label: "AC Hall" }, WASHROOM, FLOODLIGHTS],
  },
  Pickleball: {
    hours: "6:00 AM – 10:00 PM",
    highlights: ["Regulation-size court", "Fresh court surface", "Beginner friendly", "Evening floodlights"],
    inclusions: ["Court access", "Net setup", "Drinking water", "Changing room"],
    exclusions: ["Paddles & balls", "Food & beverages", "Coaching"],
    amenities: [PARKING, WASHROOM, FLOODLIGHTS],
  },
  Tennis: {
    hours: "6:00 AM – 10:00 PM",
    highlights: ["Synthetic hard court", "Pro-grade net", "Floodlit for night play", "Ball machine on request"],
    inclusions: ["Court access", "Net setup", "Drinking water", "Changing room"],
    exclusions: ["Rackets & balls", "Food & beverages", "Coaching"],
    amenities: [PARKING, WASHROOM, FLOODLIGHTS],
  },
  Football: {
    hours: "6:00 AM – 12:00 AM",
    highlights: ["5-a-side artificial turf", "Floodlit ground", "Bibs available", "Ample parking"],
    inclusions: ["Turf access", "Match ball", "Drinking water", "Changing room"],
    exclusions: ["Boots & shin guards", "Food & beverages", "Referee"],
    amenities: [PARKING, WASHROOM, FLOODLIGHTS],
  },
  "Table Tennis": {
    hours: "8:00 AM – 10:00 PM",
    highlights: ["ITTF-approved tables", "Indoor climate control", "Beginner & pro tables", "Well-lit hall"],
    inclusions: ["Table access", "Net setup", "Drinking water", "Seating"],
    exclusions: ["Bats & balls", "Food & beverages", "Coaching"],
    amenities: [{ icon: Snowflake, label: "Indoor" }, WASHROOM, { icon: Lightbulb, label: "Lighting" }],
  },
  Snooker: {
    hours: "10:00 AM – 1:00 AM",
    highlights: ["Tournament-grade tables", "Premium cues available", "Lounge seating", "Chilled ambience"],
    inclusions: ["Table access", "Cues & balls", "Chalk", "Lounge seating"],
    exclusions: ["Food & beverages", "Personal cue storage", "Private events"],
    amenities: [{ icon: Snowflake, label: "Lounge" }, WASHROOM, { icon: CircleDot, label: "Pro Tables" }],
  },
};

const DEFAULT_DETAIL: Omit<VenueDetail, "summary"> = {
  hours: "6:00 AM – 11:00 PM",
  highlights: ["Well-maintained facility", "Floodlit for night play", "Free parking", "Easy online booking"],
  inclusions: ["Venue access", "Basic equipment", "Drinking water", "Changing room"],
  exclusions: ["Personal gear", "Food & beverages", "Coaching"],
  amenities: [PARKING, WASHROOM, FLOODLIGHTS],
};

export function getVenueDetail(venue: Venue): VenueDetail {
  const base = SPORT_DETAILS[venue.sport] ?? DEFAULT_DETAIL;
  const summary = `Book ${venue.name} in ${venue.area} for a premium ${venue.sport.toLowerCase()} experience. Rated ${venue.rating}★ by players, this venue offers a well-kept surface, floodlights for evening play, and hassle-free slot booking — reserve by the hour and just show up and play.`;
  return { summary, ...base };
}
