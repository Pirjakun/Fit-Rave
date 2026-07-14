export interface Dresscode {
  items: string[];
  note: string;
}

export interface EventAgendaItem {
  id: string;
  title: string;
  timeStart: string;
  timeEnd: string;
  venue: string;
  status: "confirmed" | "tbu";
  description: string;
  dresscode: Dresscode;
}

export interface EventInfo {
  scheduleVisible: boolean;
  day1: {
    title: string;
    description: string;
    date: string;
    time: string;
    dresscode: Dresscode;
    agenda: EventAgendaItem[];
  };
  day2: {
    title: string;
    description: string;
    date: string;
    agenda: EventAgendaItem[];
  };
}
