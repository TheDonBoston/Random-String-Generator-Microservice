import crypto from 'crypto';

// 26 upper + 26 lower + 10 digits = 62 characters
const AZ_NUM_CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const DEFAULT_LENGTH = 16;

/**
 * Generate a cryptographically secure random string.
 */
function randomStr(charset, length) {
    let result = "";

    for (let i = 0; i < length; i++) {
        const idx = crypto.randomInt(0, charset.length);
        result += charset[idx];
    }
    return result;
}

/**
 * Generate a cryptographically secure random alphanumeric string.
 */
function alphaNumStr(length = DEFAULT_LENGTH) {
    return randomStr(AZ_NUM_CHARSET, length);
}

/**
 * Given two characters with the first_char <= last_char, returns a string that contains
 * all characters in the range from the first_char to the last_char
 * @param {string} first_char 
 * @param {string} last_char 
 * @returns string of characters in consecutive order based on their character codes
 */
function charsInRange(first_char, last_char) {
    if (first_char > last_char) {
        throw new RangeError(`${first_char} is greater than ${last_char} in ascii order. The first character in a range must come before the last character using ascii order.`)
    }

    let chars = ""
    for (let i = first_char.charCodeAt(); i <= last_char.charCodeAt(); i++) {
        chars += String.fromCharCode(i)
    }
    return chars
}

/**
 * Given a string with the start and end index of the charset, 
 * returns a string containing all the allowed characters as literals.
 * 
 * char_set: a string which can contain:
 *           ranges, ex: a-m, if a character is followed by a - and another character, the grouping will
 *               be interpreted as a range. If a dash is not followed by another character, it will be interpreted as
 *               a literal
 *           literals, ex !?, any character that is not part of a range will be interpreted as a literal (not escape characters below)
 *           must be escaped: ], To include a closing square bracket as a literal, it must be escaped by putting a
 *               backslash in front of it: \]
 * 
 * @param {string} pattern string with quantities, charsets, and/or literals ex: "loc-[a-m]{2,4}"
 * @param {number} start index of the first elelment in the charset
 * @param {number} end index of the last element in the charset
 * @returns string with all allowed chars in charset as literals
 */
function parseCharSet(pattern, start, end) {
    let rule = ""
    let i = start
    while (i <= end) {
        if (i < end - 1 && pattern[i + 1] === '-') {
            rule += charsInRange(pattern[i], pattern[i + 2])
            i += 3
            continue
        }
        
        if (i < end && pattern[i] === '\\' && pattern[i + 1] === (']')) {
            rule += ']'
            i += 2
            continue
        }

        rule += pattern[i]
        i++
    }

    return rule

}

/**
 * Verifies that the input string contains only allowed characters: ascii characters excluding control characters, 
 * space and DEL
 * @param {string} pattern string with quantities, charsets, and/or literals ex: "loc-[a-m]{2,4}"
 * @returns true if all characters in string are allowed ascii characters, false otherwise
 */
function charsValid(pattern) {
    for (let i = 0; i < pattern.length; i ++) {
        const curr_code = pattern.charCodeAt(i)
        if ( curr_code < 33 | curr_code > 126) {
            return false
        }
    }
    return true
}

/**
 * Extracts the string representing the quantity rule, which is found between curly brackets in the pattern
 * @param {string} pattern string with quantities, charsets, and/or literals ex: "loc-[a-m]{2,4}" 
 * @param {number} start the index of the first character in the qantity rule
 * @param {number} end the index of the last character in the quantity rule
 * @returns quantity rule as a string, ex: "2,4"
 */
function getQty(pattern, start, end) {
    // Validate input
    for (let i = start; i <= end; i++) {
        if ((pattern[i] < '0' || pattern[i] > '9') && pattern[i] !== ',' ) {
            throw new RangeError('Quantifiers can only contain digits and a comma')
        }
    }
    const qty_pattern = pattern.substring(start,end + 1)
    let [min, max] = [0, 0]
    let i_comma = qty_pattern.search(',')
    if (i_comma < 0) {
        const qty = Number(qty_pattern)
        return [qty, qty]         
    }
    if (/^\d+,\d+$/.test(qty_pattern)) {
        min = Number(qty_pattern.substring(0, i_comma))
        max = Number(qty_pattern.substring(i_comma + 1))
        if (min <= max) { 
            return [min, max]
        } else {
            throw new Error(`Error processing {${qty_pattern}}: minimum must not be greater than maximum`)
        }

    }
    throw new Error(`Error processing {${qty_pattern}} Quantities must be in the form {n} or {n,m} where n and m are non-negative integers`)
}

/**
 * Given a pattern, which can incude charsets, quantifiers, and/or literals, generates a string that matches
 * the specifications. 
 * @param {string} pattern string with quantities, charsets, and/or literals ex: "loc-[a-m]{2,4}"
 * @returns string that matches specifications
 */
function strFromPattern(pattern) {
    // Validate input string
    if (!charsValid(pattern)) {  
        throw new RangeError("Invalid character received. Valid characters include ascii characters excluding control characters")
    }

    let new_string = ''

    let i = 0
    while (i < pattern.length) {
        // Get the allowed chars
        let allowed_chars = ""
        const curr_char = pattern[i]
        
        if (curr_char === '[') {
            let end_rule = pattern.substring(i).search(']')
            while (pattern[i + end_rule - 1] === '\\') {                // ensure that the ] is not an escaped character in the charset
                end_rule = pattern.substring(i + end_rule).search(']')
            }
            allowed_chars = parseCharSet(pattern, i + 1, i + end_rule - 1)
            i += end_rule + 1
        } else if (curr_char ===  '\\') {
            allowed_chars = pattern[i + 1]
            i += 2
        } else {
            allowed_chars = pattern[i]
            i++
        }

        // Get the quantifier
        let [min, max] = [0, 0]

        if (i >= pattern.length) {
            [min, max] = [1, 1]
        } else if (pattern[i] !== '{') {
            [min, max] = [1, 1]
        } else {
            const end_qty = pattern.substring(i).search('}')
            const minmax = getQty(pattern, i + 1, i + end_qty - 1)
            min = minmax[0]
            max = minmax[1]
            i += end_qty + 1
        }

        // Generate a random string of the specified length using the allowed characters and add it to the return value
        let qty = min
        if (min !== max) {
            qty = crypto.randomInt(min, max)
        }
        new_string += randomStr(allowed_chars, qty)
    }
    return new_string

    }

export { alphaNumStr, strFromPattern }