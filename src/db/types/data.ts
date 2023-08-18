import { ListDoc } from "./docs";

export type Kanban = {
  _id: string;
  lists: string[];
  name: string;
  focusedList: string;
  doneList: string;
  description: string;
  collapsed: boolean;
  relatedSessions: string[];
  spentHours: string;
  lastVisitTime: Date;
};

export type List = ListDoc;

export type Card = {
  _id: string;
  title: string;
  content: string;
  sessionIds: string[];
  spentTimeInHour: {
    estimated: string;
    actual: string;
  };
  createdTime: Date;
};

export type Session = {
  _id: string;
  switchActivities: number[];
  stayTimeInSecond: string[];
  spentTimeInHour: string;
  apps: {
    [key: string]: {
      appName: string;
      spentTimeInHour: string;
    };
  };
  switchTime: number;
  startTime: Date;
  efficiency: number;
  boardId: string;
};
