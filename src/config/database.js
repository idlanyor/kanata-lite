import { JSONFilePreset } from 'lowdb/node';

const defaultData = { settings: { antiCall: true } };
export const db = await JSONFilePreset('db.json', defaultData);
