import {readFileSync} from 'node:fs';
export const questionnaire=JSON.parse(readFileSync(new URL('./questions.json',import.meta.url),'utf8'));
import {calculate as score} from './scoring-core.mjs';
export const calculate = (answers, grade, now) => score(questionnaire, answers, grade, now);
