/**
 * Fill the string template with arguments.
 * @param  {string} template The string template. Parameters are marked by
 *                           a colon. So '/resource/:id/action' has one
 *                           parameter that is 'id'.
 * @param  {dict}   args     Values for the parameters.
 * @return {string}          The string result by filling in the arguments to
 *                           the paramter slots. Parameters without arguments
 *                           will be left in their original state. E.g.
 *                           '/resource/:id/action/:extra' with argument of
 *                           {id: 1} will return '/resource/1/action/:extra'.
 */
export function fillString(
    template: string,
    args: {[key: string]: any}
): string {
    return template.replace(
        /:(\w+)/g,
        (whole, name) => {
            if (name in args) {
                return args[name];
            } else {
                return whole;
            }
        }
    );
}

/**
 * Get the parameter names in the template string.
 * @param  {string}   template The template string format is the same as
 *                             fillString function.
 * @return {string[]}          The parameter names with the colon stripped off.
 */
export function getStringParams(template: string): string[] {
    let result: string[] = [];
    let r = /:(\w+)/g;
    let component;
    while ((component = r.exec(template)) !== null) {
        result.push(component[1]);
    }
    return result;
}

export function buildQueryString(params: {[key: string]: any}): string {
    let result = '';
    let ampersand = '';
    for (let key in params) {
        let encodedKey = encodeURIComponent(key);
        let encodedValue = encodeURIComponent(params[key]);
        result += ampersand + `${encodedKey}=${encodedValue}`;
        ampersand = '&';
    }
    return result;
}
