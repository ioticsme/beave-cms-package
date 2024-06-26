const convertToSingular = (pluralName) => {
    // Define some basic rules for pluralization
    const rules = [
        { pattern: /ies$/i, replace: 'y' }, // Replace 'ies' with 'y'
        { pattern: /s$/i, replace: '' }, // Remove 's' at the end
        { pattern: /es$/i, replace: '' }, // Remove 'es' at the end
    ]

    // Apply the rules in order
    for (const rule of rules) {
        if (rule.pattern.test(pluralName)) {
            return pluralName?.replace(rule.pattern, rule.replace)
        }
    }

    // If no rule matches, return the original name
    return pluralName
}

module.exports = {
    convertToSingular,
}
