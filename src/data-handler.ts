import { NedbDatabaseHandler } from "./db/db.js";

export class DataHandler {
  constructor(private readonly nedbHandler: NedbDatabaseHandler) {}

  public async init() {
    await this.nedbHandler.init();
  }

  async getCards() {
    const rawCards = await this.nedbHandler.getCards();
    const sessions = await this.nedbHandler.getSessions();

    const cards = rawCards.map((card) => {
      const cardSessions = sessions.filter((session) =>
        card.sessionIds.includes(session._id),
      );

      const newCard = {
        ...card,
        sessions: cardSessions,
      };

      //@ts-ignore Just delete ids
      delete newCard.sessionIds;

      return newCard;
    });

    return cards;
  }

  async getLists() {
    const cards = await this.getCards();
    const lists = await this.nedbHandler.getLists();

    return lists.map((list) => {
      const linkedCards = cards.filter((card) => list.cards.includes(card._id));

      const newList = {
        ...list,
        cards: linkedCards,
      };

      return newList;
    });
  }

  async getKanbans() {
    const lists = await this.getLists();
    const kanbans = await this.nedbHandler.getKanbans();

    return kanbans.map((kanban) => {
      const linkedLists = lists.filter((list) =>
        kanban.lists.includes(list._id),
      );

      const relatedSessions = linkedLists.reduce((acc, list) => {
        return [
          ...acc,
          ...list.cards.reduce((acc, card) => {
            return [...acc, ...card.sessions];
          }, []),
        ];
      }, []);

      const newKanban = {
        ...kanban,
        focusedList: linkedLists.find(
          (list) => list._id === kanban.focusedList,
        ),
        doneList: linkedLists.find((list) => list._id === kanban.doneList),
        relatedSessions,
        lists: linkedLists,
      };

      return newKanban;
    });
  }
}
