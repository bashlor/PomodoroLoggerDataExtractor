import { join } from "node:path";

import nedb from "nedb";
import { serialize } from "tinyduration";
import * as process from "process";
import { Card, Kanban, List, Session } from "./types/data.js";
import { CardDoc, KanbanDoc, ListDoc, SessionDoc } from "./types/docs.js";

export class NedbDatabaseHandler {
  private readonly dbInstances: NedbInstances;
  private dbHandlers: NedbFileHandler[];

  constructor() {
    this.dbInstances = this.createNedbInstances();
    this.dbHandlers = [];
  }

  public async init() {
    this.dbHandlers = await this.loadNedbFiles(this.dbInstances);
  }

  public async getKanbans(): Promise<Array<Kanban>> {
    const kanbanDocs = await this.getKanbanDocs();

    return kanbanDocs.map((doc) => this.transformKanban(doc));
  }

  public getLists(): Promise<Array<List>> {
    return this.getListDocs();
  }

  public async getCards(): Promise<Array<Card>> {
    const cardDocs = await this.getCardsDocs();

    return cardDocs.map((doc) => this.transformCard(doc));
  }

  public async getSessions(): Promise<Array<Session>> {
    const sessionDocs = await this.getSessionDocs();

    return sessionDocs.map((doc) => this.transformSession(doc));
  }

  private getDatabasePaths() {
    if (process.env.POMODORO_LOGGER_DB_FILES_PATH === undefined) {
      throw new Error(
        "POMODORO_LOGGER_DB_FILES_PATH environment variable is not defined",
      );
    }

    return {
      cards: join(process.env.POMODORO_LOGGER_DB_FILES_PATH, "cards.nedb"),
      session: join(process.env.POMODORO_LOGGER_DB_FILES_PATH, "session.nedb"),
      kanban: join(process.env.POMODORO_LOGGER_DB_FILES_PATH, "kanban.nedb"),
      projects: join(
        process.env.POMODORO_LOGGER_DB_FILES_PATH,
        "projects.nedb",
      ),
      lists: join(process.env.POMODORO_LOGGER_DB_FILES_PATH, "lists.nedb"),
      moves: join(process.env.POMODORO_LOGGER_DB_FILES_PATH, "moveCard.nedb"),
    };
  }

  private createNedbInstances(): NedbInstances {
    const databasePaths = this.getDatabasePaths();

    return Object.keys(databasePaths).reduce(function (result, key) {
      result[key] = new nedb({ filename: databasePaths[key] });
      return result;
    }, {}) as NedbInstances;
  }

  private loadNedbFile(nedbFileHandler: nedb): Promise<nedb> {
    return new Promise(function (resolve, reject) {
      nedbFileHandler.loadDatabase(function (err) {
        if (err) {
          reject(err);
        }
        resolve(nedbFileHandler);
      });
    });
  }

  private async loadNedbFiles(db: NedbInstances): Promise<NedbFileHandler[]> {
    const nedbFileHandlers = Object.keys(db).map(async (key) => {
      return {
        fileDatabaseHandler: await this.loadNedbFile(db[key]),
        name: key,
      };
    });

    return Promise.all(nedbFileHandlers);
  }

  private transformKanban(docKanban: KanbanDoc): Kanban {
    return {
      ...docKanban,
      lastVisitTime: new Date(docKanban.lastVisitTime),
      spentHours: this.durationFloatHourNumberToIso8601Duration(
        docKanban.spentHours,
      ),
    } as Kanban;
  }

  private transformCard(docCard: CardDoc): Card {
    return {
      ...docCard,
      createdTime: new Date(docCard.createdTime),
      spentTimeInHour: {
        estimated: this.durationFloatHourNumberToIso8601Duration(
          docCard.spentTimeInHour.estimated,
        ),
        actual: this.durationFloatHourNumberToIso8601Duration(
          docCard.spentTimeInHour.actual,
        ),
      },
    };
  }

  private transformSession(docSession: SessionDoc): Session {
    const stayTimeInSecond = docSession.stayTimeInSecond.map((time) =>
      serialize({ seconds: time }),
    );

    const apps = {};

    for (const [key, value] of Object.entries(docSession.apps)) {
      apps[key] = {
        ...value,
        spentTimeInHour: this.durationFloatHourNumberToIso8601Duration(
          value.spentTimeInHour,
        ),
      };
    }

    return {
      ...docSession,
      startTime: new Date(docSession.startTime),
      stayTimeInSecond,
      spentTimeInHour: this.durationFloatHourNumberToIso8601Duration(
        docSession.spentTimeInHour,
      ),
      apps,
    };
  }

  private getKanbanDocs(): Promise<KanbanDoc[]> {
    const kanbanHandler = this.dbHandlers.find(
      (handler) => handler.name === "kanban",
    );

    if (!kanbanHandler) {
      throw new Error("Kanban handler not found");
    }

    return new Promise((resolve, reject) => {
      kanbanHandler?.fileDatabaseHandler.find({}, function (err, docs) {
        if (err) {
          reject(err);
        }
        resolve(docs);
      });
    });
  }

  private getListDocs(): Promise<ListDoc[]> {
    const listsHandler = this.dbHandlers.find(
      (handler) => handler.name === "lists",
    );

    if (!listsHandler) {
      throw new Error("Lists handler not found");
    }

    return new Promise((resolve, reject) => {
      listsHandler?.fileDatabaseHandler.find({}, function (err, docs) {
        if (err) {
          reject(err);
        }
        resolve(docs);
      });
    });
  }

  private getCardsDocs(): Promise<CardDoc[]> {
    const cardsHandler = this.dbHandlers.find(
      (handler) => handler.name === "cards",
    );

    if (!cardsHandler) {
      throw new Error("Cards handler not found");
    }

    return new Promise((resolve, reject) => {
      cardsHandler?.fileDatabaseHandler.find({}, function (err, docs) {
        if (err) {
          reject(err);
        }
        resolve(docs);
      });
    });
  }

  private getSessionDocs(): Promise<SessionDoc[]> {
    const sessionHandler = this.dbHandlers.find(
      (handler) => handler.name === "session",
    );

    if (!sessionHandler) {
      throw new Error("Session handler not found");
    }

    return new Promise((resolve, reject) => {
      sessionHandler?.fileDatabaseHandler.find({}, function (err, docs) {
        if (err) {
          reject(err);
        }
        resolve(docs);
      });
    });
  }

  private durationFloatHourNumberToIso8601Duration(
    durationFloatHourNumber: number,
  ): string {
    const totalMinutes = durationFloatHourNumber * 60;

    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);

    return serialize({
      hours,
      minutes,
    });
  }
}

type NedbInstances = {
  cards: nedb;
  session: nedb;
  kanban: nedb;
  projects: nedb;
  lists: nedb;
  moves: nedb;
};

type NedbFileHandler = {
  fileDatabaseHandler: nedb;
  name: string;
};
