// Conversion d'un montant numérique en lettres en français (Francs CFA)

export function numberToWordsFCFA(amount: number): string {
  if (amount === 0) return 'Zéro franc CFA';

  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingts', 'quatre-vingt-dix'];

  function convertGroup(n: number, isThousands = false): string {
    let result = '';

    const c = Math.floor(n / 100);
    const remainder = n % 100;

    if (c > 0) {
      if (c === 1) {
        result += 'cent ';
      } else {
        // En français, "cent" est invariable s'il est suivi de "mille"
        result += units[c] + ' cent' + (remainder === 0 && c > 1 && !isThousands ? 's ' : ' ');
      }
    }

    if (remainder > 0) {
      if (remainder < 10) {
        result += units[remainder] + ' ';
      } else if (remainder < 20) {
        result += teens[remainder - 10] + ' ';
      } else {
        const d = Math.floor(remainder / 10);
        const u = remainder % 10;

        if (d === 7) {
          result += 'soixante-' + teens[u] + ' ';
        } else if (d === 9) {
          result += 'quatre-vingt-' + teens[u] + ' ';
        } else {
          result += tens[d];
          if (u === 1 && d !== 8) {
            result += ' et un ';
          } else if (u > 0) {
            result += '-' + units[u] + ' ';
          } else {
            result += (d === 8 && !isThousands ? 's ' : ' ');
          }
        }
      }
    }

    return result.trim();
  }

  const billions = Math.floor(amount / 1000000000);
  const millions = Math.floor((amount % 1000000000) / 1000000);
  const thousands = Math.floor((amount % 1000000) / 1000);
  const remainder = Math.floor(amount % 1000);

  const parts: string[] = [];

  if (billions > 0) {
    parts.push(billions === 1 ? 'un milliard' : `${convertGroup(billions)} milliards`);
  }
  if (millions > 0) {
    parts.push(millions === 1 ? 'un million' : `${convertGroup(millions)} millions`);
  }
  if (thousands > 0) {
    parts.push(thousands === 1 ? 'mille' : `${convertGroup(thousands, true)} mille`);
  }
  if (remainder > 0) {
    parts.push(convertGroup(remainder));
  }

  const text = parts.join(' ').trim();
  const capitalized = text.charAt(0).toUpperCase() + text.slice(1);
  return `${capitalized} francs CFA`;
}
