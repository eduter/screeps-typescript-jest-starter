/* eslint-disable global-require, no-cond-assign, no-prototype-builtins, no-underscore-dangle */
import { SourceMapConsumer } from 'source-map';

export default class ErrorMapper {

  // Cache consumer
  private static _consumer?: SourceMapConsumer;

  public static get consumer(): SourceMapConsumer {
    if (this._consumer == null) {
      this._consumer = new SourceMapConsumer(require('main.js.map'));
    }
    return this._consumer;
  }

  // Cache previously mapped traces to improve performance
  public static cache: { [key: string]: string } = {};

  /**
   * Generates a stack trace using a source map generate original symbol names.
   *
   * WARNING - EXTREMELY high CPU cost for first call after reset - >30 CPU! Use sparingly!
   * (Consecutive calls after a reset are more reasonable, ~0.1 CPU/ea)
   *
   * @param {Error | string} error The error or original stack trace
   * @returns {string} The source-mapped stack trace
   */
  public static sourceMappedStackTrace(error: Error | string): string {
    const stack: string = error instanceof Error ? (error.stack as string) : error;
    if (this.cache.hasOwnProperty(stack)) {
      return this.cache[stack];
    }

    const re = /^\s+at\s+(.+?\s+)?\(?([0-z._\-\\/]+):(\d+):(\d+)\)?$/gm;
    let match: RegExpExecArray | null;
    let outStack = error.toString();

    while ((match = re.exec(stack))) {
      if (match[2] === 'main') {
        const pos = this.consumer.originalPositionFor({
          column: parseInt(match[4], 10),
          line: parseInt(match[3], 10)
        });

        if (pos.line != null) {
          if (pos.name) {
            outStack += `\n    at ${pos.name} (${pos.source}:${pos.line}:${pos.column})`;
          } else if (match[1]) {
            // no original source file name known - use file name from given trace
            outStack += `\n    at ${match[1]} (${pos.source}:${pos.line}:${pos.column})`;
          } else {
            // no original source file name known or in given trace - omit name
            outStack += `\n    at ${pos.source}:${pos.line}:${pos.column}`;
          }
        } else {
          // no known position
          break;
        }
      } else {
        // no more parseable lines
        break;
      }
    }

    this.cache[stack] = outStack;
    return outStack;
  }

  public static wrapLoop(loop: () => void): () => void {
    return () => {
      try {
        loop();
      } catch (e) {
        if (e instanceof Error) {
          if ('sim' in Game.rooms) {
            const message = 'Source maps don\'t work in the simulator - displaying original error';
            console.log(`<span style='color:red'>${message}<br>${_.escape(e.stack ?? '')}</span>`);
          } else {
            console.log(`<span style='color:red'>${escape(this.sourceMappedStackTrace(e))}</span>`);
          }
        } else {
          // can't handle it
          throw e;
        }
      }
    };
  }

}

/** Used to map characters to HTML entities. */
const htmlEscapes: {[key: string]: string} = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

/** Used to match HTML entities and HTML characters. */
const reUnescapedHtml = /[&<>"']/g;
const reHasUnescapedHtml = RegExp(reUnescapedHtml.source);

/**
 * Converts the characters "&", "<", ">", '"', and "'" in `string` to their
 * corresponding HTML entities.
 *
 * **Note:** No other characters are escaped. To escape additional
 * characters use a third-party library like [_he_](https://mths.be/he).
 *
 * Though the ">" character is escaped for symmetry, characters like
 * ">" and "/" don't need escaping in HTML and have no special meaning
 * unless they're part of a tag or unquoted attribute value. See
 * [Mathias Bynens's article](https://mathiasbynens.be/notes/ambiguous-ampersands)
 * (under "semi-related fun fact") for more details.
 *
 * When working with HTML you should always
 * [quote attribute values](http://wonko.com/post/html-escaping) to reduce
 * XSS vectors.
 *
 * @since 0.1.0
 * @category String
 * @param {string} [text=''] The string to escape.
 * @returns {string} Returns the escaped string.
 * @see escapeRegExp, unescape
 * @example
 *
 * escape('fred, barney, & pebbles')
 * // => 'fred, barney, &amp; pebbles'
 */
function escape(text: string): string {
  return (text && reHasUnescapedHtml.test(text))
    ? text.replace(reUnescapedHtml, (chr: string) => htmlEscapes[chr])
    : (text || '');
}
