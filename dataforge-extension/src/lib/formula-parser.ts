/**
 * FormulaParser – Simple formula evaluation for DataForge data tables.
 *
 * Supports a set of text and data manipulation functions that can be applied
 * to row data via column references. Formulas follow the syntax:
 *
 *   =FUNC(col_ref, ...args)
 *
 * Where `col_ref` is a column name (matched case-insensitively) and additional
 * arguments are string or number literals.
 *
 * Supported functions:
 *  - CONCAT(col1, col2, ...)     – Concatenate values from multiple columns
 *  - UPPER(col)                  – Convert to uppercase
 *  - LOWER(col)                  – Convert to lowercase
 *  - TRIM(col)                   – Remove leading/trailing whitespace
 *  - REPLACE(col, find, replace) – Replace occurrences of a substring
 *  - EXTRACT_DOMAIN(col)         – Extract domain from a URL
 *  - EXTRACT_NUMBER(col)         – Extract the first number from text
 *  - LEN(col)                    – Return the character count
 *  - LEFT(col, count)            – Return leftmost N characters
 *  - RIGHT(col, count)           – Return rightmost N characters
 *  - IF(col, operator, value, then, else) – Conditional expression
 *
 * Zero dependencies.
 */

import type { Row } from '../types/extraction';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Token types for the formula lexer. */
type TokenType = 'FUNCTION' | 'COLUMN_REF' | 'STRING_LITERAL' | 'NUMBER_LITERAL' | 'COMMA' | 'LPAREN' | 'RPAREN';

/** A single token from the formula lexer. */
interface Token {
  type: TokenType;
  value: string;
}

/** Supported function names. */
export type FormulaFunction =
  | 'CONCAT'
  | 'UPPER'
  | 'LOWER'
  | 'TRIM'
  | 'REPLACE'
  | 'EXTRACT_DOMAIN'
  | 'EXTRACT_NUMBER'
  | 'LEN'
  | 'LEFT'
  | 'RIGHT'
  | 'IF';

/** Argument type: either a column reference or a literal value. */
export interface FormulaArg {
  type: 'column' | 'string' | 'number';
  value: string;
}

/** Parsed formula ready for evaluation. */
export interface ParsedFormula {
  /** The function name. */
  func: FormulaFunction;
  /** The argument list. */
  args: FormulaArg[];
  /** Original formula string for debugging. */
  raw: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VALID_FUNCTIONS = new Set<string>([
  'CONCAT', 'UPPER', 'LOWER', 'TRIM', 'REPLACE',
  'EXTRACT_DOMAIN', 'EXTRACT_NUMBER',
  'LEN', 'LEFT', 'RIGHT', 'IF',
]);

/** Minimum argument count per function. */
const MIN_ARGS: Record<FormulaFunction, number> = {
  CONCAT: 1,
  UPPER: 1,
  LOWER: 1,
  TRIM: 1,
  REPLACE: 3,
  EXTRACT_DOMAIN: 1,
  EXTRACT_NUMBER: 1,
  LEN: 1,
  LEFT: 2,
  RIGHT: 2,
  IF: 5,
};

/** Maximum argument count per function (-1 = unlimited). */
const MAX_ARGS: Record<FormulaFunction, number> = {
  CONCAT: -1,
  UPPER: 1,
  LOWER: 1,
  TRIM: 1,
  REPLACE: 3,
  EXTRACT_DOMAIN: 1,
  EXTRACT_NUMBER: 1,
  LEN: 1,
  LEFT: 2,
  RIGHT: 2,
  IF: 5,
};

// ---------------------------------------------------------------------------
// Lexer
// ---------------------------------------------------------------------------

/**
 * Tokenize a formula string into a list of tokens.
 * Formula format: =FUNC(arg1, arg2, ...)
 */
function tokenize(formula: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const len = formula.length;

  // Skip leading '='
  if (formula[0] === '=') i = 1;

  while (i < len) {
    const ch = formula[i];

    // Skip whitespace
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      i++;
      continue;
    }

    // Parentheses
    if (ch === '(') {
      tokens.push({ type: 'LPAREN', value: '(' });
      i++;
      continue;
    }
    if (ch === ')') {
      tokens.push({ type: 'RPAREN', value: ')' });
      i++;
      continue;
    }

    // Comma
    if (ch === ',') {
      tokens.push({ type: 'COMMA', value: ',' });
      i++;
      continue;
    }

    // String literal (double-quoted or single-quoted)
    if (ch === '"' || ch === "'") {
      const quote = ch;
      i++;
      let str = '';
      while (i < len && formula[i] !== quote) {
        if (formula[i] === '\\' && i + 1 < len) {
          // Escape sequence
          i++;
          str += formula[i];
        } else {
          str += formula[i];
        }
        i++;
      }
      if (i < len) i++; // Skip closing quote
      tokens.push({ type: 'STRING_LITERAL', value: str });
      continue;
    }

    // Number literal (including negative and decimal)
    if (ch === '-' || ch === '+' || (ch >= '0' && ch <= '9')) {
      // Check if it's a negative sign before a number
      if ((ch === '-' || ch === '+') && (i + 1 >= len || formula[i + 1] < '0' || formula[i + 1] > '9')) {
        // Not a number – treat as part of an identifier
      } else {
        let num = '';
        if (ch === '-' || ch === '+') {
          num += ch;
          i++;
        }
        while (i < len && ((formula[i] >= '0' && formula[i] <= '9') || formula[i] === '.')) {
          num += formula[i];
          i++;
        }
        if (num && num !== '-' && num !== '+') {
          tokens.push({ type: 'NUMBER_LITERAL', value: num });
          continue;
        }
      }
    }

    // Identifier (function name or column reference)
    if (/[a-zA-Z_]/.test(ch)) {
      let ident = '';
      while (i < len && /[a-zA-Z0-9_\-]/.test(formula[i])) {
        ident += formula[i];
        i++;
      }

      // Check if this is a function name (followed by '(')
      // Look ahead for '(' (skipping whitespace)
      let lookAhead = i;
      while (lookAhead < len && (formula[lookAhead] === ' ' || formula[lookAhead] === '\t')) {
        lookAhead++;
      }

      if (lookAhead < len && formula[lookAhead] === '(' && VALID_FUNCTIONS.has(ident.toUpperCase())) {
        tokens.push({ type: 'FUNCTION', value: ident.toUpperCase() });
      } else {
        tokens.push({ type: 'COLUMN_REF', value: ident });
      }
      continue;
    }

    // Unknown character – skip
    i++;
  }

  return tokens;
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

/**
 * Parse a formula string into a ParsedFormula structure.
 *
 * @param formula - The formula string (e.g., "=UPPER(name)")
 * @returns ParsedFormula object
 * @throws Error if the formula is malformed or uses an unsupported function
 */
export function parseFormula(formula: string): ParsedFormula {
  if (!formula || typeof formula !== 'string') {
    throw new Error('Formula must be a non-empty string');
  }

  const trimmed = formula.trim();
  if (!trimmed.startsWith('=')) {
    throw new Error('Formula must start with "="');
  }

  const tokens = tokenize(trimmed);
  if (tokens.length === 0) {
    throw new Error('Empty formula');
  }

  // Expect: FUNCTION LPAREN args... RPAREN
  if (tokens[0].type !== 'FUNCTION') {
    throw new Error(`Expected function name, got "${tokens[0].value}"`);
  }

  const funcName = tokens[0].value as FormulaFunction;

  if (tokens.length < 3 || tokens[1].type !== 'LPAREN') {
    throw new Error(`Expected "(" after function name "${funcName}"`);
  }

  // Parse arguments between parentheses
  const args: FormulaArg[] = [];
  let idx = 2;

  while (idx < tokens.length && tokens[idx].type !== 'RPAREN') {
    const token = tokens[idx];

    if (token.type === 'COMMA') {
      idx++;
      continue;
    }

    if (token.type === 'COLUMN_REF') {
      args.push({ type: 'column', value: token.value });
    } else if (token.type === 'STRING_LITERAL') {
      args.push({ type: 'string', value: token.value });
    } else if (token.type === 'NUMBER_LITERAL') {
      args.push({ type: 'number', value: token.value });
    } else {
      throw new Error(`Unexpected token: ${token.value}`);
    }

    idx++;
  }

  // Validate closing parenthesis
  if (idx >= tokens.length || tokens[idx].type !== 'RPAREN') {
    throw new Error('Missing closing parenthesis');
  }

  // Validate argument count
  const minArgs = MIN_ARGS[funcName];
  const maxArgs = MAX_ARGS[funcName];

  if (args.length < minArgs) {
    throw new Error(
      `${funcName} requires at least ${minArgs} argument(s), got ${args.length}`,
    );
  }
  if (maxArgs >= 0 && args.length > maxArgs) {
    throw new Error(
      `${funcName} accepts at most ${maxArgs} argument(s), got ${args.length}`,
    );
  }

  return { func: funcName, args, raw: trimmed };
}

// ---------------------------------------------------------------------------
// Evaluator
// ---------------------------------------------------------------------------

/**
 * Resolve an argument value: either look up a column value from the row,
 * or return the literal value.
 */
function resolveArg(arg: FormulaArg, row: Row): string {
  if (arg.type === 'column') {
    // Look up the column value (case-insensitive match)
    const colName = arg.value.toLowerCase();
    for (const [key, val] of Object.entries(row.data)) {
      if (key.toLowerCase() === colName) {
        return val === null || val === undefined ? '' : String(val);
      }
    }
    // Column not found – return empty string
    return '';
  }

  // String or number literal
  return arg.value;
}

/**
 * Resolve an argument as a number.
 */
function resolveArgNumber(arg: FormulaArg, row: Row): number {
  const str = resolveArg(arg, row);
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/**
 * Evaluate a parsed formula against a data row.
 *
 * @param formula - The parsed formula (from parseFormula)
 * @param row - The data row to evaluate against
 * @returns The computed value (string or number)
 * @throws Error if evaluation fails due to invalid arguments
 */
export function evaluateFormula(formula: ParsedFormula, row: Row): string | number {
  if (!formula || !formula.func) {
    throw new Error('Invalid parsed formula');
  }

  if (!row || !row.data) {
    throw new Error('Invalid row data');
  }

  const { func, args } = formula;

  switch (func) {
    case 'CONCAT': {
      const parts: string[] = [];
      for (const arg of args) {
        parts.push(resolveArg(arg, row));
      }
      return parts.join('');
    }

    case 'UPPER': {
      return resolveArg(args[0], row).toUpperCase();
    }

    case 'LOWER': {
      return resolveArg(args[0], row).toLowerCase();
    }

    case 'TRIM': {
      return resolveArg(args[0], row).trim();
    }

    case 'REPLACE': {
      const source = resolveArg(args[0], row);
      const find = resolveArg(args[1], row);
      const replacement = resolveArg(args[2], row);
      if (!find) return source;
      // Replace all occurrences
      return source.split(find).join(replacement);
    }

    case 'EXTRACT_DOMAIN': {
      const url = resolveArg(args[0], row);
      if (!url) return '';
      try {
        const normalized = url.startsWith('//') ? 'https:' + url : url;
        const withProtocol = normalized.includes('://') ? normalized : 'https://' + normalized;
        return new URL(withProtocol).hostname;
      } catch {
        // Fallback regex
        const match = url.match(/(?:https?:\/\/)?(?:www\.)?([^/?#:]+)/i);
        return match ? match[1] : '';
      }
    }

    case 'EXTRACT_NUMBER': {
      const text = resolveArg(args[0], row);
      if (!text) return 0;
      // Match numbers including decimals, negatives, and comma-separated groups
      const match = text.match(/-?[\d,]+\.?\d*/);
      if (!match) return 0;
      const cleaned = match[0].replace(/,/g, '');
      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    }

    case 'LEN': {
      return resolveArg(args[0], row).length;
    }

    case 'LEFT': {
      const text = resolveArg(args[0], row);
      const count = resolveArgNumber(args[1], row);
      if (count <= 0) return '';
      return text.slice(0, Math.floor(count));
    }

    case 'RIGHT': {
      const text = resolveArg(args[0], row);
      const count = resolveArgNumber(args[1], row);
      if (count <= 0) return '';
      return text.slice(-Math.floor(count));
    }

    case 'IF': {
      // IF(col, operator, value, thenResult, elseResult)
      const colValue = resolveArg(args[0], row);
      const operator = resolveArg(args[1], row).toLowerCase();
      const compareValue = resolveArg(args[2], row);
      const thenResult = resolveArg(args[3], row);
      const elseResult = resolveArg(args[4], row);

      let condition = false;

      switch (operator) {
        case '=':
        case '==':
        case 'eq':
        case 'equals':
          condition = colValue === compareValue;
          break;
        case '!=':
        case '<>':
        case 'ne':
        case 'not_equals':
          condition = colValue !== compareValue;
          break;
        case '>':
        case 'gt':
          condition = parseFloat(colValue) > parseFloat(compareValue);
          break;
        case '<':
        case 'lt':
          condition = parseFloat(colValue) < parseFloat(compareValue);
          break;
        case '>=':
        case 'gte':
          condition = parseFloat(colValue) >= parseFloat(compareValue);
          break;
        case '<=':
        case 'lte':
          condition = parseFloat(colValue) <= parseFloat(compareValue);
          break;
        case 'contains':
          condition = colValue.toLowerCase().includes(compareValue.toLowerCase());
          break;
        case 'starts_with':
          condition = colValue.toLowerCase().startsWith(compareValue.toLowerCase());
          break;
        case 'ends_with':
          condition = colValue.toLowerCase().endsWith(compareValue.toLowerCase());
          break;
        case 'empty':
          condition = colValue.trim() === '';
          break;
        case 'not_empty':
          condition = colValue.trim() !== '';
          break;
        default:
          throw new Error(`Unknown IF operator: "${operator}"`);
      }

      return condition ? thenResult : elseResult;
    }

    default: {
      throw new Error(`Unknown function: ${func}`);
    }
  }
}
