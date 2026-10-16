"use client";

import type { ComponentType } from "react";

import { consentGiven } from "@/legal/consent";

import { COURTHOUSES } from "../courthouses";
import { custodyRequested, financesRequested } from "../derive";
import type { Answers } from "../types";
import { Confidential } from "./confidential";
import { Abduction, Children, CustodyOrders } from "./custody";
import { ChildSupport, Expenses, Income } from "./finances";
import { Service } from "./service";
import { History, Incidents } from "./history";
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
  /** Shown only when this is true (branch steps such as custody). */
  when?: (a: Answers) => boolean;
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
  {
    id: "start",
    title: "Before you start",
    Component: Start,
    validate: (): Record<string, string> => (consentGiven() ? {} : { consent: "Check all three boxes to continue." }),
  },
  {
    id: "court",
    title: "Court and lawyer",
    blurb: "Restraining orders are filed in the Superior Court of your county.",
    Component: CourtAndLawyer,
    validate: (a) => ({
      ...(!a.S1 && { S1: "Choose a county." }),
      ...((COURTHOUSES[a.S1]?.length ?? 0) > 1 && !a.S2 && { S2: "Choose a courthouse." }),
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
    id: "confidential",
    title: "Keeping a child's information private",
    blurb: "Form DV-160 asks the judge to keep a child's information out of the public file.",
    Component: Confidential,
    when: (a) => a.PR14 === "Y",
    validate: (a) => ({
      ...(!a.M1 && { M1: "Choose one." }),
      ...(a.M1 !== "the minor" && a.M2.length === 0 && { M2: "Choose at least one child." }),
    }),
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
    id: "orders",
    title: "Orders you want",
    Component: Orders,
  },
  {
    id: "children",
    title: "Your children",
    blurb: "For your custody request (form DV-105). The judge needs to know where the children have lived.",
    Component: Children,
    when: custodyRequested,
    validate: (a) => ({
      ...(!a.K1 && { K1: "Choose yes or no." }),
    }),
  },
  {
    id: "custody",
    title: "Custody and visits",
    blurb: "What you want the judge to order for your children until your court date.",
    Component: CustodyOrders,
    when: custodyRequested,
    validate: (a) => ({
      ...(!a.K7 && { K7: "Choose one." }),
    }),
  },
  {
    id: "abduction",
    title: "Preventing abduction",
    blurb: "Form DV-108 asks the judge for orders to keep the children from being taken.",
    Component: Abduction,
    when: (a) => custodyRequested(a) && a.K5 === "Y",
  },
  {
    id: "income",
    title: "Your income",
    blurb: "For your support or fees request (form FL-150). Leave blank anything that doesn't apply.",
    Component: Income,
    when: financesRequested,
  },
  {
    id: "expenses",
    title: "Your expenses",
    blurb: "Monthly amounts. Estimates are fine; leave blank anything that doesn't apply.",
    Component: Expenses,
    when: financesRequested,
  },
  {
    id: "child-support",
    title: "Child support details",
    Component: ChildSupport,
    when: (a) => financesRequested(a) && !!a.orders.O24 && a.RL1.includes("children"),
  },
  {
    id: "service",
    title: "Court help and serving the papers",
    blurb: "A free interpreter if you need one, and who will give the other person copies of your papers.",
    Component: Service,
  },
];

/** The steps that apply to these answers, in order. */
export const visibleSteps = (a: Answers): StepDef[] => STEPS.filter((s) => !s.when || s.when(a));

/** The finish step is rendered by the page (it needs navigation). */
export const FINISH = { id: "finish", title: "Review and get your forms" };
