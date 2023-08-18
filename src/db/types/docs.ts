export type KanbanDoc = {
  _id: string;
  lists: string[];
  name: string;
  focusedList: string;
  doneList: string;
  description: string;
  collapsed: boolean;
  relatedSessions: string[];
  spentHours: number;
  lastVisitTime: number;
};

export type ListDoc = {
  _id: string;
  title: string;
  cards: string[];
};

export type CardDoc = {
  _id: string;
  title: string;
  content: string;
  sessionIds: string[];
  spentTimeInHour: {
    estimated: number;
    actual: number;
  };
  createdTime: number;
};

export type SessionDoc = {
  _id: string;
  switchActivities: number[];
  stayTimeInSecond: number[];
  apps: Record<string, AppSessionDoc>;
  spentTimeInHour: number;
  switchTime: number;
  startTime: number;
  efficiency: number;
  boardId: string;
};

type AppSessionDoc = {
  appName: string;
  spentTimeInHour: number;
  titleSpentTime: Record<string, SpentTimeObject>;
};

type SpentTimeObject = {
  [key: string]: {
    index: 0;
    normalizedWeight: number;
    occurrence: number;
  };
};
