"use client";

import type { ComponentType } from "react";

import type { Answers } from "../types";
import { History, Incidents, Weapons } from "./history";
import { Orders } from "./orders";
import { Relationship, Respondent, Roster, You } from "./people";
import { CourtAndLawyer, Start } from "./setup";
import type { StepProps } from "./types";

export interface StepDef {
  id: string;
  title: string;
  /** One plain sentence on why we ask (from the info sheets). */
  blurb?: string;
  Component: ComponentType<StepProps>;
  /** Errors that block "Continue", keyed by question ID. Keep this list short. */
  validate?: (a: Answers) => Record<string, string>;
}

/** Eligibility stop rule (map Step 3). */
export function notEligible(a: Answers): boolean {
  if (a.RL1.length === 0) return false; // not answered yet
  const onlyLiveTogether = a.RL1.every((r) => r === "live together");
  return onlyLiveTogether && a.RL3 === "N";
}

export const STEPS: StepDef[] = [
  { id: "start", title: "Before you start", Component: Start },
  {
    id: "court",
    title: "Court and lawyer",
    blurb: "Restraining orders are filed in the Superior Court of your county.",
    Component: CourtAndLawyer,
    validate: (a) => ({
      ...(!a.S1 && { S1: "Choose a county." }),
      ...(a.S5 === "Y" && !a.L1.trim() && { L1: "Enter your lawyer's name." }),
    }),
  },
  {
    id: "you",
    title: "About you",
    blurb: "Tell us about you, the person asking for protection.",
    Component: You,
    validate: (a) => ({
      ...(!a.P1.trim() && { P1: "Enter your full name." }),
    }),
  },
  {
    id: "respondent",
    title: "The other person",
    blurb: "Police need a few details to enter and enforce the order.",
    Component: Respondent,
    validate: (a) => ({
      ...(!a.R1.trim() && { R1: "Enter their full name." }),
      ...(!a.R3 && !a.R4.trim() && { R4: "Give their age. A guess is fine." }),
      ...(!a.R5 && { R5: "Choose one." }),
      ...(!a.R6.trim() && { R6: "Police need this. A best guess is fine." }),
    }),
  },
  {
    id: "relationship",
    title: "Your relationship",
    blurb: "A domestic violence order needs a close relationship with the other person.",
    Component: Relationship,
    validate: (a) => ({
      ...(a.RL1.length === 0 && { RL1: "Choose at least one, or see the note below." }),
      ...(a.RL1.includes("live together") && !a.RL3 && { RL3: "Choose yes or no." }),
      ...(notEligible(a) && {
        RL1: "Living together only as roommates doesn't qualify. See the note below about other kinds of orders.",
      }),
    }),
  },
  {
    id: "people",
    title: "People to protect",
    blurb: "Your children and anyone else who needs protection.",
    Component: Roster,
  },
  {
    id: "history",
    title: "Past orders and cases",
    Component: History,
  },
  {
    id: "incidents",
    title: "What happened",
    blurb: "This is the most important part: the judge decides mainly from what you write here.",
    Component: Incidents,
    validate: (a) => ({
      ...(!a.cards[0]?.A6.trim() && { A6: "Describe what happened. Your own words are fine." }),
    }),
  },
  {
    id: "weapons",
    title: "Weapons",
    blurb: "This information is important to the judge and to police.",
    Component: Weapons,
  },
  {
    id: "orders",
    title: "Orders you want",
    Component: Orders,
  },
];

/** The finish step is rendered by the page (it needs navigation). */
export const FINISH = { id: "finish", title: "Review and get your forms" };
