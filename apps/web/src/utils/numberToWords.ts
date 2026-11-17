import { numberToWordsFCFA as toWords } from '@eev/business-rules';
import { currencyWords } from './formatters';

/** Montant en toutes lettres dans la monnaie de l'église */
export function numberToWordsFCFA(amount: number): string {
  return toWords(amount, currencyWords());
}
